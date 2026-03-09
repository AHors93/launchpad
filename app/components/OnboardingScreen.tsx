import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View, ViewToken } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { TRACK_CONFIG, TRACK_TYPES } from '@/constants/tracks';
import { colors, fontFamily, gradients, radius, shadows, spacing } from '@/theme/tokens';
import type { TrackType } from '@/types/idea';
import { hapticLight, hapticSuccess } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  buttonGradient: readonly [string, string];
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'capture',
    title: 'Capture everything',
    subtitle: 'Ideas, job applications, career moves \u2014 tracked from spark to shipped.',
    accent: colors.primary[500],
    buttonGradient: gradients.primary,
  },
  {
    id: 'bob',
    title: 'Meet Bob',
    subtitle:
      'Your AI side coach. He\u2019ll challenge weak ideas, break big goals into steps, and push you toward action.',
    accent: colors.purple[400],
    buttonGradient: gradients.purple,
  },
  {
    id: 'track',
    title: 'Pick your first track',
    subtitle: 'What are you working on? You can always add more later.',
    accent: colors.status.shipped,
    buttonGradient: gradients.green,
  },
];

// Per-slide dot accent colors
const DOT_COLORS = [colors.primary[500], colors.purple[400], colors.status.shipped];

// ── Mini UI Mockups ──────────────────────────────────────────

function IdeasMockup() {
  const mockIdeas = [
    { title: 'Coffee shop business plan', status: 'Exploring it', color: colors.status.exploring },
    { title: 'Learn React Native', status: 'Started building', color: colors.status.building },
    { title: 'Freelance design portfolio', status: 'Just a spark', color: colors.status.spark },
    { title: 'Switch to product management', status: 'Shipped!', color: colors.status.shipped },
  ];

  const filters = [
    { label: '3 sparks', color: colors.status.spark },
    { label: '2 active', color: colors.status.building },
    { label: '1 shipped', color: colors.status.shipped },
  ];

  return (
    <Animated.View entering={FadeInUp.delay(300).duration(500)} style={mockStyles.phoneFrame}>
      <View style={mockStyles.phoneHeader}>
        <Text style={mockStyles.phoneTitle}>Ideas</Text>
      </View>
      <View style={mockStyles.filterRow}>
        {filters.map((f) => (
          <View key={f.label} style={[mockStyles.filterPill, { backgroundColor: f.color + '20' }]}>
            <Text
              style={[mockStyles.filterText, { color: f.color, fontFamily: fontFamily.mono.bold }]}
            >
              {f.label}
            </Text>
          </View>
        ))}
      </View>
      {mockIdeas.map((idea, i) => (
        <Animated.View
          key={idea.title}
          entering={FadeInDown.delay(450 + i * 100).duration(350)}
          style={mockStyles.ideaCard}
        >
          <Text style={mockStyles.ideaTitle} numberOfLines={1}>
            {idea.title}
          </Text>
          <View style={[mockStyles.statusPill, { backgroundColor: idea.color + '18' }]}>
            <View style={[mockStyles.statusDot, { backgroundColor: idea.color }]} />
            <Text style={[mockStyles.statusText, { color: idea.color }]}>{idea.status}</Text>
          </View>
        </Animated.View>
      ))}
    </Animated.View>
  );
}

function BobMockup() {
  return (
    <Animated.View
      entering={FadeInUp.delay(300).duration(500)}
      style={[mockStyles.phoneFrame, mockStyles.bobFrame]}
    >
      <View style={mockStyles.phoneHeader}>
        <Text style={[mockStyles.phoneTitle, { color: colors.purple[400] }]}>Bob</Text>
        <Text style={mockStyles.phoneSubtitle}>Your thinking partner</Text>
      </View>
      <Animated.View entering={FadeInDown.delay(500).duration(350)} style={mockStyles.userBubble}>
        <Text style={mockStyles.bubbleText}>
          I want to start a coffee shop but I have no experience
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(700).duration(350)} style={mockStyles.bobBubble}>
        <Text style={mockStyles.bobLabel}>Bob</Text>
        <Text style={mockStyles.bubbleText}>
          Good — most great founders started with zero experience in their field. Let&apos;s break
          this down. What specifically draws you to it?
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(900).duration(350)} style={mockStyles.taskAction}>
        <View style={mockStyles.taskCheckbox}>
          <Text style={mockStyles.taskCheckIcon}>{'\u2713'}</Text>
        </View>
        <Text style={mockStyles.taskActionText}>Task: Research local coffee shop costs</Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(1050).duration(350)} style={mockStyles.gestureHint}>
        <Text style={mockStyles.gestureIcon}>{'\u2191'}</Text>
        <Text style={mockStyles.gestureText}>Swipe up to save ideas from conversations</Text>
      </Animated.View>
    </Animated.View>
  );
}

// Track accent colors for the picker cards
const TRACK_ACCENTS: Record<TrackType, string> = {
  side_project: colors.primary[400],
  job_application: colors.status.exploring,
  career_pivot: colors.blue[400],
  course: colors.status.spark,
  freelance: colors.status.shipped,
  custom: colors.text.muted,
};

function TrackPicker({
  selectedTrack,
  onSelectTrack,
}: {
  selectedTrack: TrackType | null;
  onSelectTrack: (track: TrackType) => void;
}) {
  return (
    <Animated.View entering={FadeInUp.delay(300).duration(500)} style={mockStyles.trackContainer}>
      {TRACK_TYPES.map((trackType, i) => {
        const config = TRACK_CONFIG[trackType];
        const accent = TRACK_ACCENTS[trackType];
        const isSelected = selectedTrack === trackType;
        return (
          <Animated.View key={trackType} entering={FadeInDown.delay(400 + i * 80).duration(300)}>
            <Pressable
              style={[
                mockStyles.trackCard,
                isSelected && { borderColor: accent, backgroundColor: accent + '10' },
              ]}
              onPress={() => {
                hapticLight();
                onSelectTrack(trackType);
              }}
            >
              <View style={[mockStyles.trackIconContainer, { backgroundColor: accent + '18' }]}>
                <Text style={mockStyles.trackIcon}>{config.icon}</Text>
              </View>
              <View style={mockStyles.trackInfo}>
                <Text style={[mockStyles.trackLabel, isSelected && { color: accent }]}>
                  {config.label}
                </Text>
                <Text style={mockStyles.trackDesc}>{config.description}</Text>
              </View>
              {isSelected && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={[mockStyles.trackCheck, { backgroundColor: accent }]}
                >
                  <Text style={mockStyles.trackCheckText}>{'\u2713'}</Text>
                </Animated.View>
              )}
            </Pressable>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

// ── Main Component ───────────────────────────────────────────

interface OnboardingScreenProps {
  onComplete: (selectedTrack?: TrackType) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<TrackType | null>(null);

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[currentIndex];

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<OnboardingSlide>[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      hapticSuccess();
      onComplete(selectedTrack ?? undefined);
    } else {
      hapticLight();
      listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }, [currentIndex, isLastSlide, onComplete, selectedTrack]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const renderSlide = useCallback(
    ({ item, index }: { item: OnboardingSlide; index: number }) => (
      <View style={styles.slide}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.slideContent}>
          <Animated.Text
            entering={FadeInDown.delay(150).duration(400)}
            style={[styles.title, { color: item.accent }]}
          >
            {item.title}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(250).duration(400)} style={styles.subtitle}>
            {item.subtitle}
          </Animated.Text>
        </Animated.View>

        {index === 0 && <IdeasMockup />}
        {index === 1 && <BobMockup />}
        {index === 2 && (
          <TrackPicker selectedTrack={selectedTrack} onSelectTrack={setSelectedTrack} />
        )}
      </View>
    ),
    [selectedTrack],
  );

  const keyExtractor = useCallback((item: OnboardingSlide) => item.id, []);

  const canProceed = !isLastSlide || selectedTrack !== null;
  const buttonGradient = canProceed
    ? currentSlide.buttonGradient
    : ([colors.border.medium, colors.border.medium] as const);

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground />

      {!isLastSlide && (
        <View style={styles.skipContainer}>
          <Pressable onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEnabled
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.id}
              style={[
                styles.dot,
                i === currentIndex
                  ? [styles.dotActive, { backgroundColor: DOT_COLORS[i] }]
                  : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          disabled={!canProceed}
        >
          <LinearGradient
            colors={buttonGradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text style={[styles.nextButtonText, !canProceed && styles.nextButtonTextDisabled]}>
              {isLastSlide ? "Let's go" : 'Next'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: spacing['2xl'],
    zIndex: 10,
  },
  skipText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    color: colors.text.muted,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['3xl'],
  },
  slideContent: {
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fontFamily.display.bold,
    fontSize: 28,
    lineHeight: 36,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fontFamily.display.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.secondary,
  },
  footer: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['2xl'],
    gap: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    backgroundColor: colors.border.medium,
  },
  nextButton: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonGradient: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  nextButtonText: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 16,
    color: colors.text.inverse,
  },
  nextButtonTextDisabled: {
    color: colors.text.muted,
  },
});

const mockStyles = StyleSheet.create({
  // ── Phone frame (shared) ──────────────────────
  phoneFrame: {
    flex: 1,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  bobFrame: {
    borderColor: colors.purple[200],
  },
  phoneHeader: {
    marginBottom: spacing.md,
  },
  phoneTitle: {
    fontFamily: fontFamily.display.bold,
    fontSize: 22,
    color: colors.primary[500],
  },
  phoneSubtitle: {
    fontFamily: fontFamily.display.regular,
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },

  // ── Ideas mockup ──────────────────────────────
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  filterText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    color: colors.text.muted,
  },
  ideaCard: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  ideaTitle: {
    fontFamily: fontFamily.display.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 10,
  },

  // ── Bob mockup ────────────────────────────────
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary[50],
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  bobBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.purple[100],
    borderRadius: radius.lg,
    borderBottomLeftRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: colors.purple[200],
  },
  bobLabel: {
    fontFamily: fontFamily.display.semiBold,
    fontSize: 11,
    color: colors.purple[400],
    marginBottom: 4,
  },
  bubbleText: {
    fontFamily: fontFamily.display.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.warm,
  },
  taskAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.status.shipped + '12',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.status.shipped + '30',
  },
  taskCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.status.shipped,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCheckIcon: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  taskActionText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.status.shipped,
    flex: 1,
  },
  gestureHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    marginTop: 'auto',
  },
  gestureIcon: {
    fontSize: 14,
    color: colors.purple[400],
  },
  gestureText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    color: colors.text.muted,
  },

  // ── Track picker ──────────────────────────────
  trackContainer: {
    flex: 1,
    gap: spacing.sm,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    gap: spacing.md,
  },
  trackIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackIcon: {
    fontSize: 20,
  },
  trackInfo: {
    flex: 1,
  },
  trackLabel: {
    fontFamily: fontFamily.display.semiBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  trackDesc: {
    fontFamily: fontFamily.display.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.text.muted,
    marginTop: 1,
  },
  trackCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackCheckText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.inverse,
  },
});
