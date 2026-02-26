import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

export function GradientBackground() {
  return (
    <LinearGradient
      colors={['#111114', '#1a1520', '#1e1528', '#181a2a', '#141e24', '#111114']}
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
