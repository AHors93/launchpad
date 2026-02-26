import { GetCommand } from '@aws-sdk/lib-dynamodb';

import { getClaudeClient } from '../../shared/claude-client';
import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import {
  withErrorHandling,
  getUserId,
  getPathParam,
  success,
  ApiError,
} from '../../shared/middleware';

const NUDGE_PROMPT = `You are a coaching assistant. Given an idea, generate a short, encouraging nudge message (1-2 sentences) that helps the user take the next step. Be specific to the idea, not generic. Match the nudge to the idea's current status:
- spark: Encourage them to explore/validate it
- exploring: Push them to start building something small
- building: Motivate them to keep shipping
- shipped: Celebrate and suggest iteration

Return ONLY the nudge text, no JSON, no quotes.`;

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const ideaId = getPathParam(event, 'ideaId');

  // Get the idea
  const result = await dynamo.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `IDEA#${ideaId}` },
    }),
  );
  if (!result.Item) throw new ApiError(404, 'Idea not found');

  const idea = result.Item as { title: string; description?: string; status: string };

  const claude = await getClaudeClient();
  const response = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: NUDGE_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Idea: "${idea.title}"${idea.description !== undefined && idea.description !== '' ? `\nDescription: ${idea.description}` : ''}\nStatus: ${idea.status}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new ApiError(500, 'No text in Claude response');
  }

  return success({ nudge: textBlock.text, ideaId });
});
