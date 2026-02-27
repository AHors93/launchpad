// LaunchPad Design System — React Native
// Faithful translation of the web prototype's visual language

import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─────────────────────────────────────────────
// COLOURS
// ─────────────────────────────────────────────

export const colors = {
  bg: {
    primary: '#111114',
    surface: '#1e1e22',
    surfacePressed: '#282830',
    input: '#141418',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  text: {
    primary: '#f0efe8',
    secondary: '#aaaaaa',
    muted: '#888888',
    inverse: '#1a1a1e',
    warm: '#e2e0d6',
  },

  amber: {
    50: '#1a1810',
    100: '#1e1c13',
    200: '#272316',
    300: '#3a321a',
    400: '#f59e0b',
    500: '#fbbf24',
  },

  status: {
    spark: '#f59e0b',
    exploring: '#8b5cf6',
    building: '#3b82f6',
    shipped: '#10b981',
  },

  purple: { 100: '#1e1533', 200: '#2d1f4e', 300: '#4c3580', 400: '#8b5cf6', 500: '#6d28d9' },
  green: { 400: '#10b981', 500: '#059669' },
  red: { 300: '#2a1519', 400: '#f43f5e' },
  blue: { 300: '#93c5fd', 400: '#3b82f6' },

  border: {
    subtle: '#1c1c20',
    medium: '#2a2a2e',
  },
} as const;

// Gradient presets for expo-linear-gradient
export const gradients = {
  amber: ['#fbbf24', '#f59e0b'] as const,
  purple: ['#8b5cf6', '#6d28d9'] as const,
  green: ['#10b981', '#059669'] as const,
  encouragementBg: ['#1f1c12', '#1a1620'] as const,
  userBubble: ['#201a2e', '#191d2a'] as const,
  headerText: ['#f0efe8', '#fbbf24'] as const,
  background: ['#111114', '#1a1520', '#1e1528', '#181a2a', '#141e24', '#111114'] as const,
} as const;

// ─────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────

export const fontFamily = {
  display: {
    regular: 'EBGaramond_400Regular',
    italic: 'EBGaramond_400Regular_Italic',
    semiBold: 'EBGaramond_600SemiBold',
    bold: 'EBGaramond_700Bold',
  },
  mono: {
    regular: 'SpaceMono_400Regular',
    bold: 'SpaceMono_700Bold',
  },
} as const;

export const typography = {
  h1: {
    fontFamily: fontFamily.display.bold,
    fontSize: 32,
    letterSpacing: -0.5,
    color: colors.text.primary,
  },
  h2: {
    fontFamily: fontFamily.display.bold,
    fontSize: 24,
    color: colors.text.primary,
  },
  h3: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 18,
    color: colors.text.primary,
  },
  body: {
    fontFamily: fontFamily.display.regular,
    fontSize: 16,
    lineHeight: 26,
    color: colors.text.primary,
  },
  bodySmall: {
    fontFamily: fontFamily.display.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  label: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: colors.text.muted,
  },
  stat: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 24,
  },
  tag: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
  },
  button: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 14,
  },
  input: {
    fontFamily: fontFamily.display.regular,
    fontSize: 14,
    color: colors.text.primary,
  },
  chatMessage: {
    fontFamily: fontFamily.display.regular,
    fontSize: 14,
    lineHeight: 23,
    color: colors.text.warm,
  },
  chatLabel: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: colors.amber[500],
  },
} as const;

// ─────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const;

// ─────────────────────────────────────────────
// RADIUS
// ─────────────────────────────────────────────

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  '2xl': 16,
  pill: 20,
  full: 9999,
} as const;

// ─────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    android: { elevation: 8 },
  }),
  amberGlow: Platform.select({
    ios: {
      shadowColor: '#fbbf24',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
  }),
  purpleGlow: Platform.select({
    ios: {
      shadowColor: '#8b5cf6',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
  }),
} as const;

// ─────────────────────────────────────────────
// ANIMATION
// ─────────────────────────────────────────────

export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  encouragementCycle: 7000,
  encouragementFade: 400,
} as const;

// ─────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────

export const layout = {
  screenPadding: 24,
  maxContentWidth: 600,
  tabBarHeight: 80,
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
} as const;

// ─────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────

export const statusConfig = [
  { value: 'spark' as const, label: '\u{1F4A1} Just a spark', color: colors.status.spark },
  { value: 'exploring' as const, label: '\u{1F50D} Exploring it', color: colors.status.exploring },
  {
    value: 'building' as const,
    label: '\u{1F528} Started building',
    color: colors.status.building,
  },
  { value: 'shipped' as const, label: '\u{1F680} Shipped!', color: colors.status.shipped },
] as const;
