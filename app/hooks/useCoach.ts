import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList } from 'react-native';

import { useCreateIdea } from './useIdeas';

import {
  createConversationApi,
  deleteConversationApi,
  extractIdeaApi,
  fetchConversations,
  fetchMessagesApi,
  isBackendConfigured,
  isStreamingConfigured,
  sendMessageApi,
  streamCoachMessageApi,
  updateConversationApi,
} from '@/services/api';
import { extractIdeaFromConversation, streamCoachMessage } from '@/services/coach';
import { ChatMessage, Conversation } from '@/types/coach';
import { UserProfile } from '@/types/profile';
import { hapticSuccess } from '@/utils/haptics';

const STORAGE_KEY = 'launchpad_conversations';
const useApi = isBackendConfigured();

const coachKeys = {
  all: ['conversations'] as const,
};

async function loadConversations(): Promise<Conversation[]> {
  if (useApi) {
    const apiConvos = await fetchConversations();
    return apiConvos.map((c) => ({
      id: c.convoId,
      title: c.title,
      ideaId: c.linkedIdeaId,
      messages: [],
      messageCount: c.messageCount,
      createdAt: c.startedAt,
      updatedAt: c.lastMessageAt,
    }));
  }
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  if (data === null || data === '') return [];
  return JSON.parse(data) as Conversation[];
}

async function saveConversations(conversations: Conversation[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function useConversations() {
  return useQuery({
    queryKey: coachKeys.all,
    queryFn: loadConversations,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input?: { linkedIdeaId?: string }) => {
      if (useApi) {
        const { convoId } = await createConversationApi(input);
        const now = new Date().toISOString();
        return {
          id: convoId,
          title: 'New conversation',
          ideaId: input?.linkedIdeaId,
          messages: [],
          createdAt: now,
          updatedAt: now,
        } satisfies Conversation;
      }
      const conversations = await loadConversations();
      const now = new Date().toISOString();
      const newConvo: Conversation = {
        id: Crypto.randomUUID(),
        title: 'New conversation',
        ideaId: input?.linkedIdeaId,
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      conversations.unshift(newConvo);
      await saveConversations(conversations);
      return newConvo;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: coachKeys.all });
      const previous = queryClient.getQueryData<Conversation[]>(coachKeys.all);
      const now = new Date().toISOString();
      const optimistic: Conversation = {
        id: `temp-${Date.now()}`,
        title: 'New conversation',
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      queryClient.setQueryData<Conversation[]>(coachKeys.all, (old) => [
        optimistic,
        ...(old ?? []),
      ]);
      return { previous };
    },
    onSuccess: (newConvo) => {
      // Replace the temp conversation with the real one so sendMessage can find it
      queryClient.setQueryData<Conversation[]>(coachKeys.all, (old) =>
        (old ?? []).map((c) => (c.id.startsWith('temp-') ? newConvo : c)),
      );
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(coachKeys.all, context.previous);
      }
    },
    onSettled: () => {
      // In API mode, a refetch would return conversations with messages: [] and wipe
      // any in-memory messages. The cache is kept in sync by onSuccess above.
      if (!useApi) {
        void queryClient.invalidateQueries({ queryKey: coachKeys.all });
      }
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (useApi) {
        await deleteConversationApi(conversationId);
        return;
      }
      const conversations = await loadConversations();
      const filtered = conversations.filter((c) => c.id !== conversationId);
      await saveConversations(filtered);
    },
    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey: coachKeys.all });
      const previous = queryClient.getQueryData<Conversation[]>(coachKeys.all);
      queryClient.setQueryData<Conversation[]>(coachKeys.all, (old) =>
        (old ?? []).filter((c) => c.id !== conversationId),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(coachKeys.all, context.previous);
      }
      Alert.alert('Error', 'Failed to delete conversation. Please try again.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: coachKeys.all });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      profile,
    }: {
      conversationId: string;
      content: string;
      profile?: UserProfile;
    }) => {
      if (useApi) {
        if (isStreamingConfigured()) {
          // Backend streaming via Lambda Function URL
          const assistantId = `stream-${Date.now()}`;
          const streamingMessage: ChatMessage = {
            id: assistantId,
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString(),
          };

          queryClient.setQueryData<Conversation[]>(coachKeys.all, (old) =>
            (old ?? []).map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    messages: [
                      ...c.messages.filter((m) => !m.id.startsWith('temp-')),
                      streamingMessage,
                    ],
                    updatedAt: new Date().toISOString(),
                  }
                : c,
            ),
          );

          const result = await streamCoachMessageApi(conversationId, content, (partialText) => {
            queryClient.setQueryData<Conversation[]>(coachKeys.all, (old) =>
              (old ?? []).map((c) =>
                c.id === conversationId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantId ? { ...m, content: partialText } : m,
                      ),
                    }
                  : c,
              ),
            );
          });

          const assistantMessage: ChatMessage = {
            id: result.assistantMessageId,
            role: 'assistant',
            content: result.fullText,
            createdAt: result.assistantTimestamp,
          };

          queryClient.setQueryData<Conversation[]>(coachKeys.all, (old) =>
            (old ?? []).map((convo) =>
              convo.id === conversationId
                ? {
                    ...convo,
                    messages: convo.messages.map((m) => {
                      if (m.id === assistantId) return assistantMessage;
                      if (m.id.startsWith('temp-') && m.role === 'user') {
                        return { ...m, id: result.userMessageId, createdAt: result.userTimestamp };
                      }
                      return m;
                    }),
                    updatedAt: new Date().toISOString(),
                  }
                : convo,
            ),
          );

          return assistantMessage;
        }

        // Backend non-streaming fallback
        const result = await sendMessageApi(conversationId, content);
        const assistantMessage: ChatMessage = {
          id: result.assistantMessage.messageId,
          role: 'assistant',
          content: result.assistantMessage.content,
          createdAt: result.assistantMessage.timestamp,
        };
        queryClient.setQueryData<Conversation[]>(coachKeys.all, (old) =>
          (old ?? []).map((convo) =>
            convo.id === conversationId
              ? {
                  ...convo,
                  messages: [
                    ...convo.messages.filter((m) => !m.id.startsWith('temp-')),
                    {
                      id: result.userMessage.messageId,
                      role: 'user' as const,
                      content,
                      createdAt: result.userMessage.timestamp,
                    },
                    assistantMessage,
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : convo,
          ),
        );
        return assistantMessage;
      }

      // Local mode — stream from Claude directly
      const conversations = await loadConversations();
      const convo = conversations.find((c) => c.id === conversationId);
      if (convo === undefined) throw new Error('Conversation not found');

      const now = new Date().toISOString();
      const userMessage: ChatMessage = {
        id: Crypto.randomUUID(),
        role: 'user',
        content,
        createdAt: now,
      };
      convo.messages.push(userMessage);
      convo.updatedAt = now;

      if (convo.title === 'New conversation') {
        convo.title = content.length > 50 ? content.substring(0, 50) + '...' : content;
      }

      await saveConversations(conversations);

      // Create a placeholder assistant message in the cache for streaming
      const assistantId = Crypto.randomUUID();
      const streamingMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };

      // Add empty assistant bubble so user sees it appear immediately
      queryClient.setQueryData<Conversation[]>(coachKeys.all, (old) =>
        (old ?? []).map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: [
                  ...c.messages.filter((m) => !m.id.startsWith('temp-')),
                  userMessage,
                  streamingMessage,
                ],
                updatedAt: new Date().toISOString(),
              }
            : c,
        ),
      );

      // Stream tokens and update the assistant message progressively
      const apiMessages = convo.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const fullText = await streamCoachMessage(
        apiMessages,
        (partialText) => {
          queryClient.setQueryData<Conversation[]>(coachKeys.all, (old) =>
            (old ?? []).map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantId ? { ...m, content: partialText } : m,
                    ),
                  }
                : c,
            ),
          );
        },
        profile,
      );

      // Final save with complete text
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: fullText,
        createdAt: new Date().toISOString(),
      };
      convo.messages.push(assistantMessage);
      convo.updatedAt = new Date().toISOString();
      await saveConversations(conversations);

      return assistantMessage;
    },
    onMutate: async ({ conversationId, content }) => {
      await queryClient.cancelQueries({ queryKey: coachKeys.all });
      const previous = queryClient.getQueryData<Conversation[]>(coachKeys.all);

      queryClient.setQueryData<Conversation[]>(coachKeys.all, (old) =>
        (old ?? []).map((convo) =>
          convo.id === conversationId
            ? {
                ...convo,
                messages: [
                  ...convo.messages,
                  {
                    id: `temp-${Date.now()}`,
                    role: 'user' as const,
                    content,
                    createdAt: new Date().toISOString(),
                  },
                ],
                updatedAt: new Date().toISOString(),
              }
            : convo,
        ),
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(coachKeys.all, context.previous);
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', message);
    },
    onSettled: () => {
      // In API mode, the cache is authoritative for messages (server doesn't return them
      // on list). Invalidating would refetch and wipe the in-memory messages.
      if (!useApi) {
        void queryClient.invalidateQueries({ queryKey: coachKeys.all });
      }
    },
  });
}

// ── Extracted screen-level hooks ─────────────────────────────

export function useSaveIdeaFromChat(conversation: Conversation | undefined) {
  const createIdea = useCreateIdea();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(async () => {
    if (conversation === undefined || conversation.messages.length === 0) return;

    setIsSaving(true);
    try {
      const apiMessages = conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const extracted = useApi
        ? await extractIdeaApi(apiMessages)
        : await extractIdeaFromConversation(apiMessages);
      createIdea.mutate(
        { title: extracted.title, description: extracted.description },
        {
          onSuccess: (idea) => {
            hapticSuccess();
            Alert.alert('Saved to vault', `"${extracted.title}" has been added to your ideas.`);

            // Link this conversation to the saved idea
            const ideaId = idea.ideaId;
            if (useApi) {
              void updateConversationApi(conversation.id, { linkedIdeaId: ideaId });
            }
            queryClient.setQueryData<Conversation[]>(coachKeys.all, (old) =>
              (old ?? []).map((c) => (c.id === conversation.id ? { ...c, ideaId } : c)),
            );
          },
        },
      );
    } catch {
      Alert.alert('Error', 'Failed to extract idea. Try again.');
    } finally {
      setIsSaving(false);
    }
  }, [conversation, createIdea, queryClient]);

  return { saveAsIdea: save, isSavingIdea: isSaving };
}

export function useIdeaLinking(
  params: { ideaId?: string; ideaTitle?: string; ideaDesc?: string },
  conversations: Conversation[] | undefined,
  createConversation: ReturnType<typeof useCreateConversation>,
  sendMessage: ReturnType<typeof useSendMessage>,
  setActiveId: (id: string) => void,
  clearParams: () => void,
  profile?: UserProfile,
) {
  const handledRef = useRef<string | undefined>(undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (
      params.ideaId === undefined ||
      params.ideaId === '' ||
      params.ideaTitle === undefined ||
      params.ideaTitle === ''
    ) {
      return;
    }
    if (handledRef.current === params.ideaId) return;
    handledRef.current = params.ideaId;

    // Check for existing conversation linked to this idea
    const existingConvo = conversations?.find((c) => c.ideaId === params.ideaId);

    if (existingConvo !== undefined) {
      setActiveId(existingConvo.id);

      // Load messages from API if not already in cache
      if (useApi && existingConvo.messages.length === 0) {
        void fetchMessagesApi(existingConvo.id).then((apiMessages) => {
          const messages: ChatMessage[] = apiMessages.map((m) => ({
            id: m.messageId,
            role: m.role,
            content: m.content,
            createdAt: m.timestamp,
          }));
          queryClient.setQueryData<Conversation[]>(coachKeys.all, (old) =>
            (old ?? []).map((c) => (c.id === existingConvo.id ? { ...c, messages } : c)),
          );
        });
      }

      clearParams();
      return;
    }

    // No existing conversation — create a new one linked to this idea
    const desc = params.ideaDesc !== undefined && params.ideaDesc !== '' ? params.ideaDesc : '';
    const prompt = `I have an idea called "${params.ideaTitle}"${desc !== '' ? `. Here's what it's about: ${desc}` : ''}. Help me think through this — what should I focus on first?`;

    createConversation.mutate(
      { linkedIdeaId: params.ideaId },
      {
        onSuccess: (newConvo) => {
          setActiveId(newConvo.id);
          sendMessage.mutate({ conversationId: newConvo.id, content: prompt, profile });
          clearParams();
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.ideaId, params.ideaTitle]);
}

export function useLoadMessages(conversation: Conversation | undefined) {
  const queryClient = useQueryClient();
  const convoId = conversation?.id;
  const hasMessages = (conversation?.messages.length ?? 0) > 0;

  useEffect(() => {
    if (!useApi) return;
    if (convoId === undefined || hasMessages) return;

    void fetchMessagesApi(convoId).then((apiMessages) => {
      const messages: ChatMessage[] = apiMessages.map((m) => ({
        id: m.messageId,
        role: m.role,
        content: m.content,
        createdAt: m.timestamp,
      }));
      queryClient.setQueryData<Conversation[]>(coachKeys.all, (old) =>
        (old ?? []).map((c) => (c.id === convoId ? { ...c, messages } : c)),
      );
    });
  }, [convoId, hasMessages, queryClient]);
}

export function useAutoScroll(
  listRef: React.RefObject<FlatList<ChatMessage> | null>,
  messageCount: number | undefined,
) {
  useEffect(() => {
    if (messageCount !== undefined && messageCount > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messageCount, listRef]);
}
