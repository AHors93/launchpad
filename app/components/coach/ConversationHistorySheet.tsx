import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import { Conversation } from '@/types/coach';

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

interface ConversationHistorySheetProps {
  conversations: Conversation[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ConversationHistorySheet = forwardRef<BottomSheet, ConversationHistorySheetProps>(
  function ConversationHistorySheet({ conversations, activeId, onSelect, onDelete }, ref) {
    const snapPoints = useMemo(() => ['50%', '80%'], []);

    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
      ),
      [],
    );

    const handleDelete = useCallback(
      (id: string, title: string) => {
        Alert.alert('Delete conversation', `Delete "${title}"?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDelete(id),
          },
        ]);
      },
      [onDelete],
    );

    const renderItem = useCallback(
      ({ item }: { item: Conversation }) => {
        const isActive = item.id === activeId;
        const messageCount = item.messages.length;
        const preview =
          messageCount > 0
            ? item.messages[messageCount - 1].content.substring(0, 80)
            : 'No messages yet';

        return (
          <Pressable
            style={[styles.conversationItem, isActive && styles.conversationItemActive]}
            onPress={() => onSelect(item.id)}
            onLongPress={() => handleDelete(item.id, item.title)}
          >
            <View style={styles.conversationHeader}>
              <Text
                style={[styles.conversationTitle, isActive && styles.conversationTitleActive]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.conversationDate}>{formatDate(item.updatedAt)}</Text>
            </View>
            <Text style={styles.conversationPreview} numberOfLines={2}>
              {preview}
            </Text>
            <Text style={styles.conversationMeta}>
              {messageCount} {messageCount === 1 ? 'message' : 'messages'}
            </Text>
          </Pressable>
        );
      },
      [activeId, onSelect, handleDelete],
    );

    const keyExtractor = useCallback((item: Conversation) => item.id, []);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Past conversations</Text>
          <Text style={styles.sheetSubtitle}>Long press to delete</Text>
        </View>
        <BottomSheetFlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.bg.surfacePressed,
  },
  handleIndicator: {
    backgroundColor: colors.text.muted,
  },
  sheetHeader: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  sheetTitle: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
  },
  sheetSubtitle: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  list: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  conversationItem: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.bg.surface,
    marginBottom: spacing.md,
  },
  conversationItemActive: {
    borderColor: colors.purple[400] + '44',
    backgroundColor: colors.purple[400] + '11',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conversationTitle: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  conversationTitleActive: {
    color: colors.purple[400],
  },
  conversationDate: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    color: colors.text.muted,
  },
  conversationPreview: {
    fontFamily: fontFamily.display.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  conversationMeta: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    color: colors.text.muted,
  },
});
