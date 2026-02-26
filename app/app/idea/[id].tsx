import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { StatusPill } from '@/components/StatusPill';
import { useDeleteIdea, useIdea, useUpdateIdea } from '@/hooks/useIdeas';
import { colors, fontFamily, radius, spacing, statusConfig } from '@/theme/tokens';
import { IdeaStatus } from '@/types/idea';

export default function IdeaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: idea } = useIdea(id);
  const updateIdea = useUpdateIdea();
  const deleteIdea = useDeleteIdea();

  const [description, setDescription] = useState(idea?.description ?? '');
  const [isEditing, setIsEditing] = useState(false);

  const handleStatusChange = useCallback(
    (newStatus: IdeaStatus) => {
      if (id === undefined || id === '') return;
      updateIdea.mutate({ ideaId: id, updates: { status: newStatus } });
    },
    [id, updateIdea],
  );

  const handleSaveDescription = useCallback(() => {
    if (id === undefined || id === '') return;
    updateIdea.mutate({ ideaId: id, updates: { description: description.trim() || undefined } });
    setIsEditing(false);
  }, [id, description, updateIdea]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete idea', "Are you sure? This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (id === undefined || id === '') return;
          deleteIdea.mutate(id);
          router.back();
        },
      },
    ]);
  }, [id, deleteIdea, router]);

  if (!idea) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Idea not found</Text>
      </SafeAreaView>
    );
  }

  const statusObj = statusConfig.find((s) => s.value === idea.status) ?? statusConfig[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color={colors.red[400]} />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{idea.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusObj.color + '22' }]}>
          <Text style={[styles.statusBadgeText, { color: statusObj.color }]}>
            {statusObj.label}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Status</Text>
          <View style={styles.statusRow}>
            {statusConfig.map((s) => (
              <StatusPill
                key={s.value}
                status={s}
                isActive={idea.status === s.value}
                onPress={() => handleStatusChange(s.value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Description</Text>
            {!isEditing && (
              <Pressable onPress={() => setIsEditing(true)}>
                <Text style={styles.editButton}>Edit</Text>
              </Pressable>
            )}
          </View>
          {isEditing ? (
            <View>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="What's this idea about?"
                placeholderTextColor={colors.text.muted}
                multiline
                autoFocus
              />
              <Pressable style={styles.saveButton} onPress={handleSaveDescription}>
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.description}>
              {idea.description ?? 'No description yet. Tap Edit to add one.'}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Created</Text>
          <Text style={styles.meta}>
            {new Date(idea.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  scrollContent: {
    padding: spacing['2xl'],
    paddingBottom: 100,
  },
  title: {
    fontFamily: fontFamily.display.bold,
    fontSize: 28,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    lineHeight: 36,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
  },
  notFound: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 16,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 100,
  },
  section: {
    marginTop: spacing['3xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  editButton: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 13,
    color: colors.amber[500],
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  description: {
    fontFamily: fontFamily.display.regular,
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  descriptionInput: {
    fontFamily: fontFamily.display.regular,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: radius.md,
    padding: spacing.lg,
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  saveButton: {
    backgroundColor: colors.amber[500],
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonText: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 14,
    color: colors.text.inverse,
  },
  meta: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    color: colors.text.secondary,
  },
});
