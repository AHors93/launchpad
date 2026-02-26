import { ExploreResult } from '@/types/explore';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are a career exploration assistant. When given a career, path, or business question, provide a comprehensive but concise overview.

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

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
}

export async function searchCareerPath(query: string): Promise<ExploreResult> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (apiKey === undefined || apiKey === '') {
    throw new Error('EXPO_PUBLIC_ANTHROPIC_API_KEY is not set');
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: query }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Explore API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as AnthropicResponse;
  const textBlock = data.content.find((block) => block.type === 'text');
  if (textBlock === undefined) {
    throw new Error('No text in explore response');
  }

  try {
    return JSON.parse(textBlock.text) as ExploreResult;
  } catch {
    throw new Error('Failed to parse career data. Try rephrasing your search.');
  }
}
