import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontFamily, radius, spacing } from '@/theme/tokens';

const TAB_META: Record<string, { label: string; desc: string }> = {
  ideas: { label: '\u{1F4A1} Ideas', desc: 'Track & build' },
  coach: { label: '\u{1F5E3}\u{FE0F} Bob', desc: 'Your side coach' },
  explore: { label: '\u{1F50D} Explore', desc: 'Find paths' },
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      tabBar={({ state, navigation }) => {
        if (state === undefined) return null;
        return (
          <View
            style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          >
            <View style={styles.tabBar}>
              {state.routes.map((route: { key: string; name: string }, index: number) => {
                const meta = TAB_META[route.name];
                if (meta === undefined) return null;

                const isActive = state.index === index;

                return (
                  <Pressable
                    key={route.key}
                    accessibilityRole="button"
                    accessibilityState={isActive ? { selected: true } : undefined}
                    onPress={() => {
                      if (!isActive) {
                        navigation.navigate(route.name);
                      }
                    }}
                    style={[styles.tab, isActive && styles.tabActive]}
                  >
                    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                      {meta.label}
                    </Text>
                    <Text style={[styles.tabDesc, isActive && styles.tabDescActive]}>
                      {meta.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      }}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="ideas" />
      <Tabs.Screen name="coach" />
      <Tabs.Screen name="explore" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.sm,
    backgroundColor: colors.bg.primary,
  },
  tabBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.bg.input,
    borderRadius: radius.xl,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 11,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.amber[100],
  },
  tabLabel: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 13,
    color: colors.text.muted,
  },
  tabLabelActive: {
    fontFamily: fontFamily.mono.bold,
    color: colors.amber[500],
  },
  tabDesc: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 10,
    color: colors.text.muted,
    opacity: 0.6,
    marginTop: 2,
  },
  tabDescActive: {
    color: colors.amber[500],
  },
});
