import { randomUUID } from 'crypto';

import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { COACH_SYSTEM_PROMPT, sendMessageSchema } from '@launchpad/shared';

import { getClaudeClient } from '../../shared/claude-client';
import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import {
  withErrorHandling,
  getUserId,
  getPathParam,
  parseBody,
  success,
  ApiError,
} from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const convoId = getPathParam(event, 'convoId');
  const input = sendMessageSchema.parse(parseBody(event));
  const now = new Date().toISOString();

  // Verify conversation belongs to user
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
  if (!convo) throw new ApiError(404, 'Conversation not found');

  // Load existing messages
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

  // Store user message
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
        content: input.content,
        timestamp: now,
      },
    }),
  );

  // Build messages array for Claude
  const apiMessages = [
    ...existingMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: input.content },
  ];

  // Call Claude
  const claude = await getClaudeClient();
  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: COACH_SYSTEM_PROMPT,
    messages: apiMessages,
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new ApiError(500, 'No text in Claude response');
  }
  const assistantContent = textBlock.text;

  // Store assistant message
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
        content: assistantContent,
        timestamp: assistantNow,
      },
    }),
  );

  // Update conversation metadata
  const messageCount = ((convo.messageCount as number) ?? 0) + 2;
  const isFirstMessage = messageCount <= 2;
  const title = isFirstMessage
    ? input.content.length > 50
      ? input.content.substring(0, 50) + '...'
      : input.content
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

  return success({
    userMessage: {
      messageId: userMessageId,
      role: 'user',
      content: input.content,
      timestamp: now,
    },
    assistantMessage: {
      messageId: assistantMessageId,
      role: 'assistant',
      content: assistantContent,
      timestamp: assistantNow,
    },
  });
});
