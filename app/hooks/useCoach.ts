import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import {
  createConversationApi,
  fetchConversations,
  isBackendConfigured,
  sendMessageApi,
} from '@/services/api';
import { sendCoachMessage } from '@/services/coach';
import { ChatMessage, Conversation } from '@/types/coach';

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
      messages: [],
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

export function useActiveConversation() {
  return useQuery({
    queryKey: coachKeys.all,
    queryFn: loadConversations,
    select: (convos: Conversation[]) => (convos.length > 0 ? convos[0] : undefined),
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (useApi) {
        const { convoId } = await createConversationApi();
        const now = new Date().toISOString();
        return {
          id: convoId,
          title: 'New conversation',
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
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(coachKeys.all, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: coachKeys.all });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (useApi) {
        // API delete not yet implemented — just remove locally
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
    }: {
      conversationId: string;
      content: string;
    }) => {
      if (useApi) {
        const result = await sendMessageApi(conversationId, content);
        const assistantMessage: ChatMessage = {
          id: result.assistantMessage.messageId,
          role: 'assistant',
          content: result.assistantMessage.content,
          createdAt: result.assistantMessage.timestamp,
        };
        // Update local cache with the messages
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

      // Local mode — call Claude directly
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

      const apiMessages = convo.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const responseText = await sendCoachMessage(apiMessages);

      const assistantMessage: ChatMessage = {
        id: Crypto.randomUUID(),
        role: 'assistant',
        content: responseText,
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
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(coachKeys.all, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: coachKeys.all });
    },
  });
}
