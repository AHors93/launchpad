import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export function isBackendConfigured(): boolean {
  return API_BASE_URL !== '';
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
