import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { useConversations } from '@/hooks/useCoach';
import { useSearchHistory } from '@/hooks/useExplore';
import { useIdeas, useIdeaStats } from '@/hooks/useIdeas';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import { Conversation } from '@/types/coach';
import { ExploreSearch } from '@/types/explore';
import { Idea } from '@/types/idea';

// ── Streak calculation ───────────────────────────────────────

function getActivityDates(
  ideas: Idea[],
  conversations: Conversation[],
  searches: ExploreSearch[],
): Set<string> {
  const dates = new Set<string>();

  for (const idea of ideas) {
    dates.add(new Date(idea.createdAt).toDateString());
    dates.add(new Date(idea.updatedAt).toDateString());
  }
  for (const convo of conversations) {
    dates.add(new Date(convo.createdAt).toDateString());
    for (const msg of convo.messages) {
      if (msg.role === 'user') {
        dates.add(new Date(msg.createdAt).toDateString());
      }
    }
  }
  for (const search of searches) {
    dates.add(new Date(search.createdAt).toDateString());
  }

  return dates;
}

function calculateStreak(activityDates: Set<string>): number {
  if (activityDates.size === 0) return 0;

  let streak = 0;
  const now = new Date();
  const today = now.toDateString();

  // Check if active today
  if (!activityDates.has(today)) {
    // Check yesterday — streak might still be alive
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (!activityDates.has(yesterday.toDateString())) return 0;
  }

  // Count consecutive days backwards
  const check = new Date(now);
  while (activityDates.has(check.toDateString())) {
    streak++;
    check.setDate(check.getDate() - 1);
  }

  return streak;
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

// ── Milestones ───────────────────────────────────────────────

interface Milestone {
  id: string;
  label: string;
  icon: string;
  unlocked: boolean;
}

function getMilestones(
  ideas: Idea[],
  conversations: Conversation[],
  searches: ExploreSearch[],
  streak: number,
): Milestone[] {
  const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
  const shippedCount = ideas.filter((i) => i.status === 'shipped').length;

  return [
    { id: 'first-idea', label: 'First idea', icon: '\u{1F4A1}', unlocked: ideas.length >= 1 },
    { id: '5-ideas', label: '5 ideas', icon: '\u{1F4A1}', unlocked: ideas.length >= 5 },
    { id: '10-ideas', label: '10 ideas', icon: '\u{1F3C6}', unlocked: ideas.length >= 10 },
    {
      id: 'first-chat',
      label: 'First Bob chat',
      icon: '\u{1F5E3}\u{FE0F}',
      unlocked: conversations.length >= 1,
    },
    { id: '50-messages', label: '50 messages', icon: '\u{1F4AC}', unlocked: totalMessages >= 50 },
    {
      id: 'first-explore',
      label: 'First search',
      icon: '\u{1F50D}',
      unlocked: searches.length >= 1,
    },
    { id: 'first-shipped', label: 'First shipped', icon: '\u{1F680}', unlocked: shippedCount >= 1 },
    { id: '3-shipped', label: '3 shipped', icon: '\u{2B50}', unlocked: shippedCount >= 3 },
    { id: 'streak-3', label: '3-day streak', icon: '\u{1F525}', unlocked: streak >= 3 },
    { id: 'streak-7', label: '7-day streak', icon: '\u{1F525}', unlocked: streak >= 7 },
  ];
}

// ── Component ────────────────────────────────────────────────

export default function ProgressScreen() {
  const { data: ideas } = useIdeas();
  const { data: stats } = useIdeaStats();
  const { data: conversations } = useConversations();
  const { data: searches } = useSearchHistory();

  const resolvedIdeas = useMemo(() => ideas ?? [], [ideas]);
  const resolvedConversations = useMemo(() => conversations ?? [], [conversations]);
  const resolvedSearches = useMemo(() => searches ?? [], [searches]);
  const resolvedStats = useMemo(
    () => stats ?? { total: 0, spark: 0, exploring: 0, building: 0, shipped: 0 },
    [stats],
  );

  const activityDates = useMemo(
    () => getActivityDates(resolvedIdeas, resolvedConversations, resolvedSearches),
    [resolvedIdeas, resolvedConversations, resolvedSearches],
  );

  const streak = useMemo(() => calculateStreak(activityDates), [activityDates]);

  const oldestIdea = useMemo(() => {
    if (resolvedIdeas.length === 0) return undefined;
    return resolvedIdeas.reduce((oldest, idea) =>
      new Date(idea.createdAt) < new Date(oldest.createdAt) ? idea : oldest,
    );
  }, [resolvedIdeas]);

  const milestones = useMemo(
    () => getMilestones(resolvedIdeas, resolvedConversations, resolvedSearches, streak),
    [resolvedIdeas, resolvedConversations, resolvedSearches, streak],
  );

  const unlockedCount = milestones.filter((m) => m.unlocked).length;
  const totalMessages = resolvedConversations.reduce((sum, c) => sum + c.messages.length, 0);

  // Pipeline bar widths
  const pipelineTotal = resolvedStats.total || 1;
  const pipelineSegments = [
    { label: 'Spark', count: resolvedStats.spark, color: colors.status.spark },
    { label: 'Exploring', count: resolvedStats.exploring, color: colors.status.exploring },
    { label: 'Building', count: resolvedStats.building, color: colors.status.building },
    { label: 'Shipped', count: resolvedStats.shipped, color: colors.status.shipped },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Progress</Text>
        <Text style={styles.screenSubtitle}>Your journey so far</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero stats */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.heroRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroNumber}>{streak}</Text>
            <Text style={styles.heroLabel}>day streak</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroNumber}>{resolvedStats.total}</Text>
            <Text style={styles.heroLabel}>{resolvedStats.total === 1 ? 'idea' : 'ideas'}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={[styles.heroNumber, { color: colors.status.shipped }]}>
              {resolvedStats.shipped}
            </Text>
            <Text style={styles.heroLabel}>shipped</Text>
          </View>
        </Animated.View>

        {/* Journey duration */}
        {oldestIdea !== undefined && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.journeyCard}>
            <Text style={styles.journeyText}>
              {daysSince(oldestIdea.createdAt) === 0
                ? 'You started your journey today'
                : `${daysSince(oldestIdea.createdAt)} days on your journey`}
            </Text>
            <Text style={styles.journeySubtext}>
              {totalMessages} messages with Bob {'\u00B7'} {resolvedSearches.length}{' '}
              {resolvedSearches.length === 1 ? 'path' : 'paths'} explored
            </Text>
          </Animated.View>
        )}

        {/* Pipeline */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>Idea pipeline</Text>
          {resolvedStats.total > 0 ? (
            <>
              <View style={styles.pipelineBar}>
                {pipelineSegments.map(
                  (seg) =>
                    seg.count > 0 && (
                      <View
                        key={seg.label}
                        style={[
                          styles.pipelineSegment,
                          {
                            flex: seg.count / pipelineTotal,
                            backgroundColor: seg.color,
                          },
                        ]}
                      />
                    ),
                )}
              </View>
              <View style={styles.pipelineLegend}>
                {pipelineSegments.map((seg) => (
                  <View key={seg.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
                    <Text style={styles.legendText}>
                      {seg.label} ({seg.count})
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyPipeline}>
              <Text style={styles.emptyText}>Add your first idea to see your pipeline</Text>
            </View>
          )}
        </Animated.View>

        {/* Milestones */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>
            Milestones ({unlockedCount}/{milestones.length})
          </Text>
          <View style={styles.milestonesGrid}>
            {milestones.map((m) => (
              <View
                key={m.id}
                style={[styles.milestoneCard, !m.unlocked && styles.milestoneCardLocked]}
              >
                <Text style={[styles.milestoneIcon, !m.unlocked && styles.milestoneIconLocked]}>
                  {m.icon}
                </Text>
                <Text style={[styles.milestoneLabel, !m.unlocked && styles.milestoneLabelLocked]}>
                  {m.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  headerRow: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  screenTitle: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.amber[500],
  },
  screenSubtitle: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  scrollContent: {
    paddingBottom: spacing['4xl'],
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing['2xl'],
    marginTop: spacing.xl,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing['2xl'],
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroNumber: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 32,
    lineHeight: 40,
    color: colors.amber[500],
  },
  heroLabel: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  heroDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.subtle,
  },
  journeyCard: {
    marginHorizontal: spacing['2xl'],
    marginTop: spacing.xl,
    padding: spacing.xl,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
  },
  journeyText: {
    fontFamily: fontFamily.display.bold,
    fontSize: 18,
    lineHeight: 26,
    color: colors.text.primary,
    textAlign: 'center',
  },
  journeySubtext: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.text.muted,
    marginTop: spacing.sm,
  },
  section: {
    paddingHorizontal: spacing['2xl'],
    marginTop: spacing['3xl'],
  },
  sectionLabel: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  pipelineBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    gap: 2,
  },
  pipelineSegment: {
    borderRadius: 6,
  },
  pipelineLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.text.secondary,
  },
  emptyPipeline: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 13,
    color: colors.text.muted,
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  milestoneCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.amber[300],
  },
  milestoneCardLocked: {
    borderColor: colors.border.subtle,
    opacity: 0.5,
  },
  milestoneIcon: {
    fontSize: 20,
  },
  milestoneIconLocked: {
    opacity: 0.4,
  },
  milestoneLabel: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 12,
    color: colors.text.primary,
    flex: 1,
  },
  milestoneLabelLocked: {
    fontFamily: fontFamily.mono.regular,
    color: colors.text.muted,
  },
});
