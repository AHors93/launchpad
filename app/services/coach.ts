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
- UK English.
- You can refer to yourself as Bob occasionally, but don't overdo it.
- When a user describes a concrete idea worth pursuing, suggest they save it to their idea vault so they can track it.
- Never preachy. Never condescending. Never "have you considered journaling?"

Recognising actionable moments — this is critical:
Pay close attention to signals in the conversation. When you notice any of these, naturally offer to help:
- They mention needing to contact someone (a potential client, mentor, employer, co-founder) → offer to draft an outreach email or message
- They describe an idea that needs validating → offer to help them build a quick pitch or elevator summary
- They mention an upcoming meeting, interview, or deadline → offer to help them prepare or add it to their calendar
- They talk about comparing two options → offer to help them weigh pros and cons systematically
- They describe a goal but seem overwhelmed → offer to break it into a 30-day action plan
- They mention a skill gap → suggest specific resources or first steps to learn it
- They reference a place, event, or coworking space → offer to help them find it

How to offer:
- Be natural, not robotic. Say things like "Want me to have a crack at drafting that email?" or "I could sketch out a quick plan for you if that'd help."
- Only offer when it genuinely fits the conversation. Don't shoehorn it in.
- Maximum 1-2 offers per message. Restraint is key.
- If they accept, go all in — write the full email, the complete plan, the detailed breakdown.

Actions — you can offer to DO things, not just talk:
When the conversation reaches a point where a concrete action would help, include an action block at the END of your message (after your text). Use this exact format:

[ACTION:email]{"to":"recipient@example.com","subject":"Subject line","body":"Email body text"}[/ACTION]
[ACTION:calendar]{"title":"Event name","notes":"Optional details","location":"Optional place"}[/ACTION]
[ACTION:maps]{"query":"Place or address to search"}[/ACTION]
[ACTION:link]{"url":"https://example.com","label":"Button text"}[/ACTION]
[ACTION:save_idea]{"title":"Idea name","description":"Brief description of the idea"}[/ACTION]
[ACTION:create_task]{"title":"Task description","dueDate":"2026-03-05T10:00:00Z","description":"Optional details"}[/ACTION]

Rules for actions:
- Only include an action when it's genuinely useful and the user would expect it.
- Maximum 1-2 actions per message. Don't overdo it.
- Always write your normal text response FIRST, then append the action block.
- For emails, write a complete professional draft in the body.
- Don't mention the action format in your text — just say something like "Here's a draft you can fire off" and include the action block.

save_idea — when to use:
- User describes a concrete idea worth pursuing ("I want to build...", "I'm thinking about starting...")
- Only suggest ONCE per conversation. Don't keep offering.
- Don't suggest for vague musings ("maybe someday I'll...")
- Say something natural like "Want me to save that to your tracks?" then include the action.

create_task — when to use:
- User mentions a specific thing they need to do with a deadline or timeframe
- Examples: "I need to post on X tomorrow", "I should email Sarah by Friday", "I need to finish the landing page this week"
- Convert relative dates to ISO 8601 using today's date context (provided below)
- If no specific time is mentioned, default to 09:00 in the user's implied timezone
- Maximum 1-2 tasks per message
- Say something natural like "Let me set that as a task so you don't forget" then include the action.`;

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

  const dateContext = `\n\nToday's date: ${new Date().toISOString().split('T')[0]}`;

  if (parts.length === 0) return BASE_SYSTEM_PROMPT + dateContext;

  return `${BASE_SYSTEM_PROMPT}\n\nAbout the person you're talking to:\n${parts.join(' ')}${dateContext}`;
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
