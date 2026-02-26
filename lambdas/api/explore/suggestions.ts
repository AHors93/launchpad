import { QueryCommand } from '@aws-sdk/lib-dynamodb';

import { getClaudeClient } from '../../shared/claude-client';
import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { withErrorHandling, getUserId, success, ApiError } from '../../shared/middleware';

const SUGGESTIONS_PROMPT = `Based on the user's ideas and saved career paths, suggest 3-5 new career paths or project ideas they might find interesting.

Return ONLY a valid JSON array of objects, each with:
- "title": Short path/idea name
- "reason": One sentence explaining why this fits them
- "relatedTo": Which of their existing ideas/paths this relates to

Be creative but realistic. Connect the dots between their interests. No generic suggestions.

Do not include any other text, markdown, or code fences. Just the JSON array.`;

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);

  // Get user's ideas
  const ideasResult = await dynamo.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'IDEA#',
      },
    }),
  );
  const ideas = (ideasResult.Items ?? []) as Array<{ title: string; status: string }>;

  // Get user's saved paths
  const pathsResult = await dynamo.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'PATH#',
      },
    }),
  );
  const paths = (pathsResult.Items ?? []) as Array<{ title: string; query: string }>;

  if (ideas.length === 0 && paths.length === 0) {
    return success({ suggestions: [] });
  }

  const context = [
    ideas.length > 0 ? `Ideas: ${ideas.map((i) => `${i.title} (${i.status})`).join(', ')}` : '',
    paths.length > 0 ? `Saved paths: ${paths.map((p) => p.title).join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const claude = await getClaudeClient();
  const response = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: SUGGESTIONS_PROMPT,
    messages: [{ role: 'user', content: context }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new ApiError(500, 'No text in Claude response');
  }

  try {
    const suggestions = JSON.parse(textBlock.text) as Array<{
      title: string;
      reason: string;
      relatedTo: string;
    }>;
    return success({ suggestions });
  } catch {
    return success({ suggestions: [] });
  }
});
