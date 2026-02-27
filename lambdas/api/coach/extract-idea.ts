import { getClaudeClient } from '../../shared/claude-client';
import {
  withErrorHandling,
  getUserId,
  parseBody,
  success,
  ApiError,
} from '../../shared/middleware';

const EXTRACTION_PROMPT = `Based on the conversation below, extract a concise startup/project idea.

Return ONLY a valid JSON object with exactly these fields:
- "title": A punchy idea name under 60 characters
- "description": 2-3 sentences summarizing the idea and why it matters

Do not include any other text, markdown, or code fences. Just the JSON object.`;

interface ExtractInput {
  messages: Array<{ role: string; content: string }>;
}

interface ExtractedIdea {
  title: string;
  description: string;
}

export const handler = withErrorHandling(async (event) => {
  getUserId(event);
  const { messages } = parseBody<ExtractInput>(event);

  if (messages === undefined || messages.length === 0) {
    throw new ApiError(400, 'Messages array is required');
  }

  const conversationText = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Bob'}: ${m.content}`)
    .join('\n\n');

  const claude = await getClaudeClient();
  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 256,
    system: EXTRACTION_PROMPT,
    messages: [{ role: 'user', content: conversationText }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new ApiError(500, 'No text in extraction response');
  }

  try {
    const result = JSON.parse(textBlock.text) as ExtractedIdea;
    return success(result);
  } catch {
    const firstUserMsg = messages.find((m) => m.role === 'user');
    const fallbackTitle = firstUserMsg?.content ?? 'Untitled idea';
    return success({
      title: fallbackTitle.length > 60 ? fallbackTitle.substring(0, 57) + '...' : fallbackTitle,
      description: 'Idea captured from a coaching conversation.',
    });
  }
});
