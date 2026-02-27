import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
const STREAMING_URL = process.env.EXPO_PUBLIC_STREAMING_URL ?? '';

export function isBackendConfigured(): boolean {
  return API_BASE_URL !== '';
}

export function isStreamingConfigured(): boolean {
  return STREAMING_URL !== '';
}

async function getAuthToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const token = await getAuthToken();
  if (token !== null) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API error ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

// ── Ideas API ──────────────────────────────────────────────

export interface ApiIdea {
  ideaId: string;
  title: string;
  description?: string;
  status: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export async function fetchIdeas(status?: string): Promise<ApiIdea[]> {
  const query = status !== undefined ? `?status=${status}` : '';
  const data = await apiClient<{ ideas: ApiIdea[] }>(`/ideas${query}`);
  return data.ideas;
}

export async function createIdeaApi(input: {
  title: string;
  description?: string;
  tags?: string[];
}): Promise<ApiIdea> {
  return apiClient<ApiIdea>('/ideas', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateIdeaApi(
  ideaId: string,
  updates: { title?: string; description?: string; status?: string; tags?: string[] },
): Promise<void> {
  await apiClient(`/ideas/${ideaId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteIdeaApi(ideaId: string): Promise<void> {
  await apiClient(`/ideas/${ideaId}`, { method: 'DELETE' });
}

// ── Coach API ──────────────────────────────────────────────

export interface ApiConversation {
  convoId: string;
  title: string;
  mode: string;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
  linkedIdeaId?: string;
}

export interface ApiMessage {
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export async function fetchConversations(): Promise<ApiConversation[]> {
  const data = await apiClient<{ conversations: ApiConversation[] }>('/coach/conversations');
  return data.conversations;
}

export async function createConversationApi(input?: {
  mode?: string;
  linkedIdeaId?: string;
}): Promise<{ convoId: string }> {
  return apiClient<{ convoId: string }>('/coach/conversations', {
    method: 'POST',
    body: JSON.stringify(input ?? { mode: 'general' }),
  });
}

export async function sendMessageApi(
  convoId: string,
  content: string,
): Promise<{ userMessage: ApiMessage; assistantMessage: ApiMessage }> {
  return apiClient<{ userMessage: ApiMessage; assistantMessage: ApiMessage }>(
    `/coach/conversations/${convoId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ content }),
    },
  );
}

// ── Explore API ────────────────────────────────────────────

export interface ApiExploreResult {
  title: string;
  overview: string;
  dayToDay: string;
  gettingStarted: string[];
  salaryRange: string;
  timeframe: string;
  pros: string[];
  cons: string[];
}

export async function searchExploreApi(query: string): Promise<ApiExploreResult> {
  const data = await apiClient<{ result: ApiExploreResult }>('/explore/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
  return data.result;
}

// ── Coach Streaming API (Lambda Function URL) ───────────

interface StreamEvent {
  type: 'user_message' | 'token' | 'done' | 'error';
  messageId?: string;
  timestamp?: string;
  text?: string;
  message?: string;
}

export async function streamCoachMessageApi(
  convoId: string,
  content: string,
  onToken: (text: string) => void,
): Promise<{
  userMessageId: string;
  assistantMessageId: string;
  fullText: string;
  userTimestamp: string;
  assistantTimestamp: string;
}> {
  const token = await getAuthToken();

  const response = await fetch(STREAMING_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token !== null ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ convoId, content }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Stream API error ${response.status}: ${body}`);
  }

  const reader = response.body?.getReader();
  if (reader === undefined) {
    throw new Error('No readable stream in response');
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';
  let userMessageId = '';
  let userTimestamp = '';
  let assistantMessageId = '';
  let assistantTimestamp = '';

  let done = false;
  while (!done) {
    const chunk = await reader.read();
    done = chunk.done;
    if (done) break;

    buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      try {
        const event = JSON.parse(data) as StreamEvent;
        switch (event.type) {
          case 'user_message':
            userMessageId = event.messageId ?? '';
            userTimestamp = event.timestamp ?? '';
            break;
          case 'token':
            fullText += event.text ?? '';
            onToken(fullText);
            break;
          case 'done':
            assistantMessageId = event.messageId ?? '';
            assistantTimestamp = event.timestamp ?? '';
            break;
          case 'error':
            throw new Error(event.message ?? 'Streaming failed');
        }
      } catch (e) {
        // Only treat JSON parse failures as malformed; propagate server error events
        if (e instanceof SyntaxError) {
          console.warn('Malformed stream event:', data, e);
        } else {
          throw e;
        }
      }
    }
  }

  return { userMessageId, assistantMessageId, fullText, userTimestamp, assistantTimestamp };
}

// ── Coach Idea Extraction API ───────────────────────────

export async function extractIdeaApi(
  messages: Array<{ role: string; content: string }>,
): Promise<{ title: string; description: string }> {
  return apiClient<{ title: string; description: string }>('/coach/extract-idea', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });
}
