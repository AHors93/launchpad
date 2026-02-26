import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ENCOURAGEMENTS } from '@/constants/ideas';
import { animation, fontFamily, radius, spacing } from '@/theme/tokens';

function getRandomItem(arr: readonly string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function EncouragementBanner() {
  const [message, setMessage] = useState(() => getRandomItem(ENCOURAGEMENTS));
  const opacity = useSharedValue(1);

  const cycleMessage = useCallback(() => {
    opacity.value = withTiming(0, { duration: animation.encouragementFade }, (finished) => {
      if (finished === true) {
        opacity.value = withTiming(1, { duration: animation.encouragementFade });
      }
    });

    // Update message on JS thread after fade-out completes
    setTimeout(() => {
      setMessage(getRandomItem(ENCOURAGEMENTS));
    }, animation.encouragementFade);
  }, [opacity]);

  useEffect(() => {
    const interval = setInterval(cycleMessage, animation.encouragementCycle);
    return () => clearInterval(interval);
  }, [cycleMessage]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.inner, animatedStyle]}>
        <Text style={styles.text}>
          {'\u201C'}
          {message}
          {'\u201D'}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1815',
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: '#2a2415',
    marginHorizontal: spacing['2xl'],
    marginBottom: spacing['3xl'],
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fontFamily.display.italic,
    fontSize: 17,
    color: '#e2e0d6',
    letterSpacing: 0.2,
    lineHeight: 27,
    textAlign: 'center',
  },
});
