import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface OrbConfig {
  color: string;
  size: number;
  topPct: number;
  leftPct: number;
  duration: number;
  dx: number;
  dy: number;
}

const ORB_CONFIGS: OrbConfig[] = [
  {
    color: 'rgba(251, 191, 36, 0.08)',
    size: 200,
    topPct: 10,
    leftPct: 70,
    duration: 18000,
    dx: 40,
    dy: -50,
  },
  {
    color: 'rgba(139, 92, 246, 0.07)',
    size: 320,
    topPct: 60,
    leftPct: 10,
    duration: 22000,
    dx: -50,
    dy: 40,
  },
  {
    color: 'rgba(59, 130, 246, 0.06)',
    size: 440,
    topPct: 30,
    leftPct: 50,
    duration: 26000,
    dx: 25,
    dy: -30,
  },
  {
    color: 'rgba(16, 185, 129, 0.07)',
    size: 560,
    topPct: 70,
    leftPct: 80,
    duration: 30000,
    dx: -30,
    dy: 25,
  },
  {
    color: 'rgba(244, 63, 94, 0.06)',
    size: 680,
    topPct: 15,
    leftPct: 25,
    duration: 34000,
    dx: 20,
    dy: -40,
  },
];

function Orb({ config }: { config: OrbConfig }) {
  const { height, width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const easing = Easing.inOut(Easing.sin);

    translateX.value = withRepeat(
      withSequence(
        withTiming(config.dx, { duration: config.duration / 2, easing }),
        withTiming(0, { duration: config.duration / 2, easing }),
      ),
      -1,
      true,
    );

    translateY.value = withRepeat(
      withSequence(
        withTiming(config.dy, { duration: config.duration / 2, easing }),
        withTiming(0, { duration: config.duration / 2, easing }),
      ),
      -1,
      true,
    );
  }, [translateX, translateY, config]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  const orbSize = config.size;
  const top = (config.topPct / 100) * height - orbSize / 2;
  const left = (config.leftPct / 100) * width - orbSize / 2;

  return (
    <Animated.View
      style={[styles.orb, { width: orbSize, height: orbSize, top, left }, animatedStyle]}
    >
      <LinearGradient
        colors={[config.color, 'transparent']}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={{ width: orbSize, height: orbSize, borderRadius: orbSize / 2 }}
      />
    </Animated.View>
  );
}

export function FloatingOrbs() {
  return (
    <Animated.View style={styles.container} pointerEvents="none">
      {ORB_CONFIGS.map((config, i) => (
        <Orb key={i} config={config} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  orb: {
    position: 'absolute',
  },
});
