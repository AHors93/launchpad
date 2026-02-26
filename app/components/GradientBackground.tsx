import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { gradients } from '@/theme/tokens';

export function GradientBackground() {
  return (
    <LinearGradient
      colors={[...gradients.background]}
      locations={[0, 0.15, 0.35, 0.55, 0.75, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    />
  );
}

const styles = StyleSheet.create({
  gradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
