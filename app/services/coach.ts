const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are the LaunchPad Side Coach — a direct, no-BS thinking partner for aspiring builders and career pivoters.

Your style:
- Be encouraging but honest. No fake positivity.
- Keep responses concise and actionable (2-4 short paragraphs max).
- Ask probing questions to help users think deeper.
- Push users toward action, not endless planning.
- Use plain language, no corporate speak.
- If an idea is weak, say so constructively and help strengthen it.
- Help break big ambitions into small, concrete next steps.
- Use short sentences. Be punchy.
- When a user describes a concrete idea worth pursuing, suggest they save it to their idea vault so they can track it.

You're talking to someone in their 20s-30s who has ideas but hasn't started yet. Your job is to get them unstuck.`;

const EXTRACTION_PROMPT = `Based on the conversation below, extract a concise startup/project idea.

Return ONLY a valid JSON object with exactly these fields:
- "title": A punchy idea name under 60 characters
- "description": 2-3 sentences summarizing the idea and why it matters

Do not include any other text, markdown, or code fences. Just the JSON object.`;

interface ApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
}

export async function sendCoachMessage(messages: ApiMessage[]): Promise<string> {
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
      messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Coach API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as AnthropicResponse;
  const textBlock = data.content.find((block) => block.type === 'text');
  if (textBlock === undefined) {
    throw new Error('No text in coach response');
  }
  return textBlock.text;
}

export interface ExtractedIdea {
  title: string;
  description: string;
}

export async function extractIdeaFromConversation(messages: ApiMessage[]): Promise<ExtractedIdea> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (apiKey === undefined || apiKey === '') {
    throw new Error('EXPO_PUBLIC_ANTHROPIC_API_KEY is not set');
  }

  const conversationText = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
    .join('\n\n');

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: EXTRACTION_PROMPT,
      messages: [{ role: 'user', content: conversationText }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Extraction API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as AnthropicResponse;
  const textBlock = data.content.find((block) => block.type === 'text');
  if (textBlock === undefined) {
    throw new Error('No text in extraction response');
  }

  try {
    const parsed = JSON.parse(textBlock.text) as ExtractedIdea;
    return parsed;
  } catch {
    // Fallback: use first user message as title
    const firstUserMsg = messages.find((m) => m.role === 'user');
    const fallbackTitle = firstUserMsg?.content ?? 'Untitled idea';
    return {
      title: fallbackTitle.length > 60 ? fallbackTitle.substring(0, 57) + '...' : fallbackTitle,
      description: 'Idea captured from a coaching conversation.',
    };
  }
}
