import BottomSheet from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { ChatBubble, ThinkingIndicator } from '@/components/coach/ChatBubble';
import { ChatInput } from '@/components/coach/ChatInput';
import { ConversationHistorySheet } from '@/components/coach/ConversationHistorySheet';
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useSendMessage,
} from '@/hooks/useCoach';
import { useCreateIdea } from '@/hooks/useIdeas';
import { extractIdeaFromConversation } from '@/services/coach';
import { colors, fontFamily, spacing } from '@/theme/tokens';
import { ChatMessage } from '@/types/coach';

export default function CoachScreen() {
  const { data: conversations } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const sendMessage = useSendMessage();
  const createIdea = useCreateIdea();

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const historySheetRef = useRef<BottomSheet>(null);

  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [isSavingIdea, setIsSavingIdea] = useState(false);

  // Resolve active conversation
  const conversation = useMemo(() => {
    if (conversations === undefined || conversations.length === 0) return undefined;
    if (activeId !== undefined) {
      return conversations.find((c) => c.id === activeId);
    }
    return conversations[0];
  }, [conversations, activeId]);

  const isThinking = sendMessage.isPending;
  const hasMessages = conversation !== undefined && conversation.messages.length > 0;

  const hasApiKey =
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY !== undefined &&
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY !== '';

  // Auto-scroll when messages change
  useEffect(() => {
    if (hasMessages) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversation?.messages.length, hasMessages]);

  const handleSend = useCallback(
    (content: string) => {
      if (conversation === undefined) {
        createConversation.mutate(undefined, {
          onSuccess: (newConvo) => {
            setActiveId(newConvo.id);
            sendMessage.mutate({ conversationId: newConvo.id, content });
          },
        });
        return;
      }
      sendMessage.mutate({ conversationId: conversation.id, content });
    },
    [conversation, createConversation, sendMessage],
  );

  const handleNewConversation = useCallback(() => {
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

  const handleSaveAsIdea = useCallback(async () => {
    if (conversation === undefined || conversation.messages.length === 0) return;

    setIsSavingIdea(true);
    try {
      const apiMessages = conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const extracted = await extractIdeaFromConversation(apiMessages);
      createIdea.mutate(
        { title: extracted.title, description: extracted.description },
        {
          onSuccess: () => {
            Alert.alert('Saved to vault', `"${extracted.title}" has been added to your ideas.`);
          },
        },
      );
    } catch {
      Alert.alert('Error', 'Failed to extract idea. Try again.');
    } finally {
      setIsSavingIdea(false);
    }
  }, [conversation, createIdea]);

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
            <Text style={styles.title}>Side Coach</Text>
            <Text style={styles.subtitle}>Your no-BS thinking partner</Text>
          </View>
          <View style={styles.headerButtons}>
            {hasMessages && (
              <Pressable
                onPress={() => void handleSaveAsIdea()}
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
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{'\u{1F511}'}</Text>
            <Text style={styles.emptyTitle}>API key needed</Text>
            <Text style={styles.emptyText}>
              {'Set EXPO_PUBLIC_ANTHROPIC_API_KEY\nin your .env to start coaching.'}
            </Text>
          </View>
        ) : !hasMessages ? (
          <View style={styles.emptyState}>
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
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={conversation.messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={isThinking ? <ThinkingIndicator /> : null}
          />
        )}

        {hasApiKey && <ChatInput onSend={handleSend} disabled={isThinking || isSavingIdea} />}
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
