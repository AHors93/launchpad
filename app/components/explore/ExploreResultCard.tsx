import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import { ExploreResult } from '@/types/explore';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bullet}>{'\u2022'}</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: color + '15', borderColor: color + '33' }]}>
      <Text style={[styles.tagText, { color }]}>{text}</Text>
    </View>
  );
}

interface ExploreResultCardProps {
  result: ExploreResult;
}

export function ExploreResultCard({ result }: ExploreResultCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{result.title}</Text>

      <View style={styles.quickStats}>
        <Tag text={result.salaryRange} color={colors.primary[400]} />
        <Tag text={result.timeframe} color={colors.coral[400]} />
      </View>

      <Section title="Overview">
        <Text style={styles.bodyText}>{result.overview}</Text>
      </Section>

      <Section title="Day to day">
        <Text style={styles.bodyText}>{result.dayToDay}</Text>
      </Section>

      <Section title="How to get started">
        <View style={styles.stepsList}>
          {result.gettingStarted.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </Section>

      <View style={styles.prosConsRow}>
        <View style={styles.prosConsCol}>
          <Text style={[styles.sectionTitle, { color: colors.primary[400] }]}>Pros</Text>
          <BulletList items={result.pros} />
        </View>
        <View style={styles.prosConsDivider} />
        <View style={styles.prosConsCol}>
          <Text style={[styles.sectionTitle, { color: colors.red[400] }]}>Cons</Text>
          <BulletList items={result.cons} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing['2xl'],
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing['2xl'],
    borderRadius: radius.xl,
    backgroundColor: colors.bg.surface,
  },
  title: {
    fontFamily: fontFamily.display.bold,
    fontSize: 26,
    lineHeight: 34,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  quickStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tagText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fontFamily.display.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontFamily: fontFamily.display.regular,
    fontSize: 16,
    lineHeight: 26,
    color: colors.text.secondary,
  },
  stepsList: {
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[400] + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 12,
    color: colors.primary[400],
  },
  stepText: {
    flex: 1,
    fontFamily: fontFamily.display.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.text.secondary,
  },
  prosConsRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  prosConsCol: {
    flex: 1,
  },
  prosConsDivider: {
    width: 1,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.lg,
  },
  bulletList: {
    gap: spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bullet: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontFamily: fontFamily.display.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.text.secondary,
  },
});
