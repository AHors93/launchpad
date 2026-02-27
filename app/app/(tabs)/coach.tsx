import BottomSheet from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { ChatBubble, ThinkingIndicator } from '@/components/coach/ChatBubble';
import { ChatInput } from '@/components/coach/ChatInput';
import { ConversationHistorySheet } from '@/components/coach/ConversationHistorySheet';
import {
  useAutoScroll,
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useIdeaLinking,
  useSaveIdeaFromChat,
  useSendMessage,
} from '@/hooks/useCoach';
import { useProfile } from '@/hooks/useProfile';
import { isBackendConfigured } from '@/services/api';
import { colors, fontFamily, spacing } from '@/theme/tokens';
import { ChatMessage } from '@/types/coach';
import { hapticLight } from '@/utils/haptics';

export default function CoachScreen() {
  const { data: conversations } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const sendMessage = useSendMessage();
  const { data: profile } = useProfile();
  const router = useRouter();
  const params = useLocalSearchParams<{ ideaId?: string; ideaTitle?: string; ideaDesc?: string }>();

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const historySheetRef = useRef<BottomSheet>(null);

  const [activeId, setActiveId] = useState<string | undefined>(undefined);

  // Resolve active conversation
  const conversation = useMemo(() => {
    if (conversations === undefined || conversations.length === 0) return undefined;
    if (activeId !== undefined) {
      return conversations.find((c) => c.id === activeId);
    }
    return conversations[0];
  }, [conversations, activeId]);

  const isStreaming = sendMessage.isPending;
  const lastMessage = conversation?.messages[conversation.messages.length - 1];
  const isWaitingForStream =
    isStreaming && (lastMessage === undefined || lastMessage.role === 'user');
  const hasMessages = conversation !== undefined && conversation.messages.length > 0;

  const hasApiKey =
    isBackendConfigured() ||
    (process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY !== undefined &&
      process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY !== '');

  // Extracted hooks
  const { saveAsIdea, isSavingIdea } = useSaveIdeaFromChat(conversation);

  useIdeaLinking(
    params,
    createConversation,
    sendMessage,
    setActiveId,
    () => router.setParams({ ideaId: '', ideaTitle: '', ideaDesc: '' }),
    profile,
  );

  useAutoScroll(listRef, conversation?.messages.length);

  const handleSend = useCallback(
    (content: string) => {
      if (conversation === undefined) {
        createConversation.mutate(undefined, {
          onSuccess: (newConvo) => {
            setActiveId(newConvo.id);
            sendMessage.mutate({ conversationId: newConvo.id, content, profile });
          },
        });
        return;
      }
      sendMessage.mutate({ conversationId: conversation.id, content, profile });
    },
    [conversation, createConversation, sendMessage, profile],
  );

  const handleNewConversation = useCallback(() => {
    hapticLight();
    createConversation.mutate(undefined, {
      onSuccess: (newConvo) => {
        setActiveId(newConvo.id);
      },
    });
  }, [createConversation]);

  const handleOpenHistory = useCallback(() => {
    historySheetRef.current?.snapToIndex(0);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveId(id);
    historySheetRef.current?.close();
  }, []);

  const handleDeleteConversation = useCallback(
    (id: string) => {
      deleteConversation.mutate(id);
      if (activeId === id) {
        setActiveId(undefined);
      }
    },
    [deleteConversation, activeId],
  );

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <ChatBubble role={item.role === 'assistant' ? 'coach' : 'user'} text={item.content} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const conversationCount = conversations?.length ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Bob</Text>
            <Text style={styles.subtitle}>Your thinking partner</Text>
          </View>
          <View style={styles.headerButtons}>
            {hasMessages && (
              <Pressable
                onPress={() => void saveAsIdea()}
                style={[styles.headerButton, styles.saveButton]}
                disabled={isSavingIdea}
              >
                <Text style={styles.saveButtonText}>
                  {isSavingIdea ? 'Saving...' : 'Save idea'}
                </Text>
              </Pressable>
            )}
            {conversationCount > 1 && (
              <Pressable onPress={handleOpenHistory} style={styles.headerButton}>
                <Text style={styles.historyButtonText}>History</Text>
              </Pressable>
            )}
            {hasMessages && (
              <Pressable onPress={handleNewConversation} style={styles.headerButton}>
                <Text style={styles.newButtonText}>New</Text>
              </Pressable>
            )}
          </View>
        </View>

        {!hasApiKey ? (
          <Pressable style={styles.emptyState} onPress={() => Keyboard.dismiss()}>
            <Text style={styles.emptyIcon}>{'\u{1F511}'}</Text>
            <Text style={styles.emptyTitle}>API key needed</Text>
            <Text style={styles.emptyText}>
              {'Set EXPO_PUBLIC_ANTHROPIC_API_KEY\nin your .env to chat with Bob.'}
            </Text>
          </Pressable>
        ) : !hasMessages ? (
          <Pressable style={styles.emptyState} onPress={() => Keyboard.dismiss()}>
            <Text style={styles.emptyIcon}>{'\u{1F4AC}'}</Text>
            <Text style={styles.emptyTitle}>Ready when you are</Text>
            <Text style={styles.emptyText}>
              {"Start a conversation about an idea\nor a career move you're considering"}
            </Text>
            {conversationCount > 0 && (
              <Pressable onPress={handleOpenHistory} style={styles.historyLink}>
                <Text style={styles.historyLinkText}>
                  View past conversations ({conversationCount})
                </Text>
              </Pressable>
            )}
          </Pressable>
        ) : (
          <FlatList
            ref={listRef}
            data={conversation.messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={isWaitingForStream ? <ThinkingIndicator /> : null}
          />
        )}

        {hasApiKey && <ChatInput onSend={handleSend} disabled={isStreaming || isSavingIdea} />}
      </KeyboardAvoidingView>

      <ConversationHistorySheet
        ref={historySheetRef}
        conversations={conversations ?? []}
        activeId={conversation?.id}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  headerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  saveButton: {
    borderColor: colors.amber[300],
    backgroundColor: colors.amber[100],
  },
  saveButtonText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.amber[500],
  },
  historyButtonText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.text.secondary,
  },
  newButtonText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.purple[400],
  },
  messageList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 18,
    lineHeight: 26,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  historyLink: {
    paddingVertical: spacing.sm,
  },
  historyLinkText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.purple[400],
  },
});
