import { randomUUID } from 'crypto';
import type { Writable } from 'stream';

import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { COACH_SYSTEM_PROMPT } from '@launchpad/shared';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import { validateToken } from '../../shared/auth';
import { getClaudeClient } from '../../shared/claude-client';
import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';

function errorResponse(responseStream: Writable, statusCode: number, message: string) {
  const stream = awslambda.HttpResponseStream.from(responseStream, {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
  stream.write(JSON.stringify({ error: message }));
  stream.end();
}

export const handler = awslambda.streamifyResponse(
  async (event: APIGatewayProxyEventV2, responseStream: Writable) => {
    // ── Auth ──────────────────────────────────────────────────
    let userId: string;
    try {
      userId = await validateToken(event.headers?.authorization);
    } catch {
      return errorResponse(responseStream, 401, 'Unauthorized');
    }

    // ── Parse request ────────────────────────────────────────
    let convoId: string;
    let content: string;
    try {
      const raw =
        event.isBase64Encoded === true && event.body !== undefined
          ? Buffer.from(event.body, 'base64').toString()
          : (event.body ?? '{}');
      const body = JSON.parse(raw) as { convoId?: string; content?: string };
      if (
        body.convoId === undefined ||
        body.convoId === '' ||
        body.content === undefined ||
        body.content === ''
      ) {
        return errorResponse(responseStream, 400, 'convoId and content are required');
      }
      convoId = body.convoId;
      content = body.content;
    } catch {
      return errorResponse(responseStream, 400, 'Invalid request body');
    }

    // ── Verify conversation belongs to user ──────────────────
    const convoResult = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': `CONVO#${convoId}`,
        },
      }),
    );
    const convo = convoResult.Items?.[0];
    if (convo === undefined) {
      return errorResponse(responseStream, 404, 'Conversation not found');
    }

    // ── Load existing messages ───────────────────────────────
    const messagesResult = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `CONVO#${convoId}`,
          ':sk': 'MSG#',
        },
        ScanIndexForward: true,
      }),
    );
    const existingMessages = (messagesResult.Items ?? []) as Array<{
      role: string;
      content: string;
    }>;

    // ── Store user message ───────────────────────────────────
    const now = new Date().toISOString();
    const userMessageId = randomUUID();
    await dynamo.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `CONVO#${convoId}`,
          SK: `MSG#${now}#${userMessageId}`,
          messageId: userMessageId,
          convoId,
          userId,
          role: 'user',
          content,
          timestamp: now,
        },
      }),
    );

    // ── Start SSE stream ─────────────────────────────────────
    const stream = awslambda.HttpResponseStream.from(responseStream, {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

    stream.write(
      `data: ${JSON.stringify({ type: 'user_message', messageId: userMessageId, timestamp: now })}\n\n`,
    );

    try {
      const apiMessages = [
        ...existingMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content },
      ];

      const systemPrompt = `${COACH_SYSTEM_PROMPT}\n\nToday's date: ${new Date().toISOString().split('T')[0]}`;

      const claude = await getClaudeClient();
      const claudeStream = await claude.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: apiMessages,
        stream: true,
      });

      let fullText = '';
      for await (const streamEvent of claudeStream) {
        if (streamEvent.type === 'content_block_delta' && streamEvent.delta.type === 'text_delta') {
          fullText += streamEvent.delta.text;
          stream.write(
            `data: ${JSON.stringify({ type: 'token', text: streamEvent.delta.text })}\n\n`,
          );
        }
      }

      // ── Store assistant message ──────────────────────────────
      const assistantNow = new Date().toISOString();
      const assistantMessageId = randomUUID();
      await dynamo.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `CONVO#${convoId}`,
            SK: `MSG#${assistantNow}#${assistantMessageId}`,
            messageId: assistantMessageId,
            convoId,
            userId,
            role: 'assistant',
            content: fullText,
            timestamp: assistantNow,
          },
        }),
      );

      // ── Update conversation metadata ─────────────────────────
      const messageCount = ((convo.messageCount as number) ?? 0) + 2;
      const isFirstMessage = messageCount <= 2;
      const title = isFirstMessage
        ? content.length > 50
          ? content.substring(0, 50) + '...'
          : content
        : (convo.title as string);

      await dynamo.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: `USER#${userId}`, SK: `CONVO#${convoId}` },
          UpdateExpression: 'SET #mc = :mc, #lma = :lma, #title = :title',
          ExpressionAttributeNames: {
            '#mc': 'messageCount',
            '#lma': 'lastMessageAt',
            '#title': 'title',
          },
          ExpressionAttributeValues: {
            ':mc': messageCount,
            ':lma': assistantNow,
            ':title': title,
          },
        }),
      );

      stream.write(
        `data: ${JSON.stringify({ type: 'done', messageId: assistantMessageId, timestamp: assistantNow })}\n\n`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Streaming failed';
      console.error('Stream error:', err);
      stream.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
    } finally {
      stream.end();
    }
  },
);
