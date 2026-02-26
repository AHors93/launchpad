import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { getClaudeClient } from '../../shared/claude-client';
import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import {
  withErrorHandling,
  getUserId,
  getPathParam,
  success,
  ApiError,
} from '../../shared/middleware';

const REFRESH_PROMPT = `You are a career research assistant. Given a career path query, provide an updated, current summary of this career/path in 2-3 concise paragraphs. Include any recent trends, changes in demand, or new opportunities. Be factual and practical.

Return ONLY the summary text, no JSON, no formatting.`;

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const pathId = getPathParam(event, 'pathId');

  const result = await dynamo.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `PATH#${pathId}` },
    }),
  );
  if (!result.Item) throw new ApiError(404, 'Saved path not found');

  const savedPath = result.Item as { query: string; title: string };

  const claude = await getClaudeClient();
  const response = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: REFRESH_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Career path: "${savedPath.title}"\nOriginal query: "${savedPath.query}"`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new ApiError(500, 'No text in Claude response');
  }

  const now = new Date().toISOString();
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `PATH#${pathId}` },
      UpdateExpression: 'SET #lc = :lc, #li = :li',
      ExpressionAttributeNames: {
        '#lc': 'lastChecked',
        '#li': 'latestInfo',
      },
      ExpressionAttributeValues: {
        ':lc': now,
        ':li': textBlock.text,
      },
    }),
  );

  return success({ pathId, latestInfo: textBlock.text, lastChecked: now });
});
