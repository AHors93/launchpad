import { exploreSearchSchema } from '@launchpad/shared';

import { getClaudeClient } from '../../shared/claude-client';
import {
  withErrorHandling,
  getUserId,
  parseBody,
  success,
  ApiError,
} from '../../shared/middleware';

const EXPLORE_PROMPT = `You are a career exploration assistant. When given a career, path, or business question, provide a comprehensive but concise overview.

Return ONLY a valid JSON object with exactly these fields:
- "title": The career/path name (e.g., "Electrician", "UX Researcher", "Coffee Shop Owner")
- "overview": 2-3 sentence overview of what this career/path involves
- "dayToDay": 2-3 sentences about typical daily work or what running this looks like
- "gettingStarted": Array of 4-6 concrete, actionable steps to get started
- "salaryRange": Typical salary or income range. Mention the country if clear from context, otherwise give a general range
- "timeframe": How long it typically takes to get established or qualified
- "pros": Array of 3-4 genuine advantages
- "cons": Array of 3-4 real challenges or downsides

Be honest and practical. Don't sugarcoat — if something is hard, say it. Keep it punchy and useful, not generic.

Do not include any other text, markdown, or code fences. Just the JSON object.`;

interface ExploreResult {
  title: string;
  overview: string;
  dayToDay: string;
  gettingStarted: string[];
  salaryRange: string;
  timeframe: string;
  pros: string[];
  cons: string[];
}

export const handler = withErrorHandling(async (event) => {
  getUserId(event);
  const { query } = exploreSearchSchema.parse(parseBody(event));

  const claude = await getClaudeClient();
  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: EXPLORE_PROMPT,
    messages: [{ role: 'user', content: query }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new ApiError(500, 'No text in Claude response');
  }

  try {
    const result = JSON.parse(textBlock.text) as ExploreResult;
    return success({ result });
  } catch {
    throw new ApiError(500, 'Failed to parse career data. Try rephrasing your search.');
  }
});
