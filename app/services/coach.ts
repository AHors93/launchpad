import { UserProfile } from '@/types/profile';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

const BASE_SYSTEM_PROMPT = `You are Bob — the LaunchPad side coach. You're named after the creator's childhood cat, who was genuinely the best cat in the world. You carry that same energy: loyal, attentive, and always there when needed.

You're a direct, no-BS thinking partner for aspiring builders and career pivoters.

Your style:
- Be encouraging but honest. No fake positivity.
- Keep responses concise and actionable (2-4 short paragraphs max).
- Ask probing questions to help users think deeper.
- Push users toward action, not endless planning.
- Use plain language, no corporate speak.
- If an idea is weak, say so constructively and help strengthen it.
- Help break big ambitions into small, concrete next steps.
- Use short sentences. Be punchy.
- You can refer to yourself as Bob occasionally, but don't overdo it.
- When a user describes a concrete idea worth pursuing, suggest they save it to their idea vault so they can track it.

You're talking to someone who has ideas but hasn't started yet. Your job is to get them unstuck.

Actions — you can offer to DO things, not just talk:
When the conversation reaches a point where a concrete action would help, include an action block at the END of your message (after your text). Use this exact format:

[ACTION:email]{"to":"recipient@example.com","subject":"Subject line","body":"Email body text"}[/ACTION]
[ACTION:calendar]{"title":"Event name","notes":"Optional details","location":"Optional place"}[/ACTION]
[ACTION:maps]{"query":"Place or address to search"}[/ACTION]
[ACTION:link]{"url":"https://example.com","label":"Button text"}[/ACTION]

Rules for actions:
- Only include an action when it's genuinely useful and the user would expect it.
- Maximum 1-2 actions per message. Don't overdo it.
- Always write your normal text response FIRST, then append the action block.
- For emails, write a complete professional draft in the body.
- Don't mention the action format in your text — just say something like "Want me to draft that email?" and include the action block.`;

function buildSystemPrompt(profile?: UserProfile): string {
  if (profile === undefined) return BASE_SYSTEM_PROMPT;

  const parts: string[] = [];

  if (profile.name !== '') {
    parts.push(`Their name is ${profile.name}.`);
  }
  if (profile.careerBackground !== '') {
    parts.push(`Career background: ${profile.careerBackground}.`);
  }
  if (profile.interests.length > 0) {
    parts.push(`Interested in: ${profile.interests.join(', ')}.`);
  }
  if (profile.goals !== '') {
    parts.push(`Goals: ${profile.goals}.`);
  }
  if (profile.bio !== '') {
    parts.push(`About them: ${profile.bio}.`);
  }

  if (parts.length === 0) return BASE_SYSTEM_PROMPT;

  return `${BASE_SYSTEM_PROMPT}\n\nAbout the person you're talking to:\n${parts.join(' ')}`;
}

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

function getApiKey(): string {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (apiKey === undefined || apiKey === '') {
    throw new Error('EXPO_PUBLIC_ANTHROPIC_API_KEY is not set');
  }
  return apiKey;
}

export async function sendCoachMessage(
  messages: ApiMessage[],
  profile?: UserProfile,
): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystemPrompt(profile),
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

// ── Streaming ──────────────────────────────────────────────

export async function streamCoachMessage(
  messages: ApiMessage[],
  onToken: (text: string) => void,
  profile?: UserProfile,
): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystemPrompt(profile),
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Coach API error ${response.status}: ${body}`);
  }

  const reader = response.body?.getReader();
  if (reader === undefined) {
    throw new Error('No readable stream in response');
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';
  let done = false;

  while (!done) {
    const chunk = await reader.read();
    done = chunk.done;
    if (done) break;
    const value = chunk.value;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE lines
    const lines = buffer.split('\n');
    // Keep the last potentially incomplete line in the buffer
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;

      try {
        const event = JSON.parse(data) as {
          type: string;
          delta?: { type: string; text: string };
        };
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          const text = event.delta.text;
          fullText += text;
          onToken(fullText);
        }
      } catch (e) {
        console.warn('Malformed SSE event:', data, e);
      }
    }
  }

  return fullText;
}

// ── Idea extraction ────────────────────────────────────────

export interface ExtractedIdea {
  title: string;
  description: string;
}

export async function extractIdeaFromConversation(messages: ApiMessage[]): Promise<ExtractedIdea> {
  const apiKey = getApiKey();

  const conversationText = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Bob'}: ${m.content}`)
    .join('\n\n');

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
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
  } catch (e) {
    console.warn('Idea extraction parse failed:', e);
    const firstUserMsg = messages.find((m) => m.role === 'user');
    const fallbackTitle = firstUserMsg?.content ?? 'Untitled idea';
    return {
      title: fallbackTitle.length > 60 ? fallbackTitle.substring(0, 57) + '...' : fallbackTitle,
      description: 'Idea captured from a coaching conversation.',
    };
  }
}
