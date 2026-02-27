import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View, ViewToken } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  emoji: string;
  title: string;
  body: string;
  accent?: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    emoji: '\u{1F44B}',
    title: "Hey, I'm Adam",
    body: "I wanted to add a personal touch as to why this app has come into existence.\n\nI've been a software engineer just over 6 years, last September I was made redundant. The time off helped guide me to pursue what I really want to do, and its change career for the 3rd time before 35!\n\nIn my experience, there isn't a lot of guidance out there, if you want to change careers. It takes hours and hours just to even get remotely close to what you might be looking for.\n\nLaunchpad is here as a bit of a guide to help you get started, or even just give you some inspiration. It's not career advice, disclaimer, but it can hopefully give you that nudge to maybe purse the career you really want, or make that app you've dreamt about creating...",
    accent: colors.amber[500],
  },
  {
    id: 'why',
    emoji: '\u{1F4A1}',
    title: 'Why this exists',
    body: "Most idea apps are just lists. LaunchPad is different — it's a coach, a tracker, and a career explorer in one.\n\nIt's built for people of all ages who know they want to try something new, but just don't know where to start.",
    accent: colors.amber[400],
  },
  {
    id: 'ideas',
    emoji: '\u{1F4DD}',
    title: 'Capture ideas',
    body: 'Drop any idea in your vault. Track it from spark to shipped.\n\nNo judgment. The only bad idea is the one you never wrote down.',
    accent: colors.status.spark,
  },
  {
    id: 'coach',
    emoji: '\u{1F5E3}\u{FE0F}',
    title: 'Meet Bob',
    body: 'Bob is your side coach — named after my childhood cat, who was genuinely the best cat in the world.\n\nBob will help you break big ambitions into small steps, challenge weak ideas, and push you toward action. Be honest and open with Bob about who you are and what you like — the more you give, the more personal it gets.',
    accent: colors.purple[400],
  },
  {
    id: 'explore',
    emoji: '\u{1F50D}',
    title: 'Explore paths',
    body: "Curious about a career change? Bob will help you explore, and if you allow notifcations, will give you a nudge if you're stuck or if some time has passed and you need to follow up.",
    accent: colors.blue[400],
  },
  {
    id: 'start',
    emoji: '\u{1F680}',
    title: "Let's go",
    body: "That's it.\n\nYour first idea is already in your head. Let's get it out, and start your journey.",
    accent: colors.green[400],
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLastSlide = currentIndex === SLIDES.length - 1;

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
      onComplete();
    } else {
      listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }, [currentIndex, isLastSlide, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const renderSlide = useCallback(
    ({ item, index }: { item: OnboardingSlide; index: number }) => (
      <View style={styles.slide}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.slideContent}>
          <Text style={styles.emoji}>{item.emoji}</Text>
          <Animated.Text
            entering={FadeInDown.delay(200).duration(400)}
            style={[styles.title, item.accent !== undefined ? { color: item.accent } : undefined]}
          >
            {item.title}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(350).duration(400)} style={styles.body}>
            {item.body}
          </Animated.Text>
          {index === 0 && (
            <Animated.Text entering={FadeInDown.delay(500).duration(400)} style={styles.signature}>
              — Adam
            </Animated.Text>
          )}
        </Animated.View>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: OnboardingSlide) => item.id, []);

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
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.id}
              style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        <Pressable onPress={handleNext} style={styles.nextButton}>
          <LinearGradient
            colors={
              isLastSlide
                ? [colors.amber[400], colors.amber[500]]
                : [colors.amber[500], colors.amber[400]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>{isLastSlide ? "Let's go" : 'Next'}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

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
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  slideContent: {
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing['2xl'],
  },
  title: {
    fontFamily: fontFamily.display.bold,
    fontSize: 32,
    lineHeight: 40,
    color: colors.text.primary,
    marginBottom: spacing.xl,
  },
  body: {
    fontFamily: fontFamily.display.regular,
    fontSize: 18,
    lineHeight: 28,
    color: colors.text.secondary,
  },
  signature: {
    fontFamily: fontFamily.display.italic,
    fontSize: 18,
    lineHeight: 28,
    color: colors.amber[500],
    marginTop: spacing.lg,
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
    backgroundColor: colors.amber[500],
    width: 24,
  },
  dotInactive: {
    backgroundColor: colors.border.medium,
  },
  nextButton: {
    borderRadius: radius.md,
    overflow: 'hidden',
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
});
