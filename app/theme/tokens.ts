// LaunchPad Design System — React Native
// Light theme, warm & playful

import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─────────────────────────────────────────────
// COLOURS
// ─────────────────────────────────────────────

export const colors = {
  bg: {
    primary: '#fefcf9',
    surface: '#ffffff',
    surfacePressed: '#f5f0eb',
    input: '#ffffff',
    overlay: 'rgba(45, 35, 25, 0.3)',
  },

  text: {
    primary: '#2d2319',
    secondary: '#6b5c4d',
    muted: '#7d6e5e',
    inverse: '#ffffff',
    warm: '#3d3027',
  },

  // Primary accent — warm amber (Honeycomb inspired)
  primary: {
    50: '#fff8f0',
    100: '#feecd4',
    200: '#fdd8a8',
    300: '#f9bf74',
    400: '#e8913a',
    500: '#b87028',
    600: '#96581e',
  },

  // Secondary accent — coral (errors, destructive)
  coral: {
    50: '#fff5f3',
    100: '#ffe0db',
    200: '#ffbfb3',
    300: '#ff9685',
    400: '#e8534a',
    500: '#d4403a',
  },

  status: {
    spark: '#f0b429',
    exploring: '#9b6dff',
    building: '#4a9eff',
    shipped: '#2ec98e',
  },

  purple: { 100: '#f6f2ff', 200: '#ece4ff', 300: '#c9b3ff', 400: '#9b6dff', 500: '#7f48e8' },
  green: { 400: '#2ec98e', 500: '#18a86d' },
  red: { 300: '#ffbfb3', 400: '#f04e3e' },
  blue: { 300: '#8ec5ff', 400: '#4a9eff' },

  // Legacy amber — kept for status colors and backwards compat
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f0b429',
  },

  border: {
    subtle: '#f3ede6',
    medium: '#e8dfd5',
  },
} as const;

// Gradient presets for expo-linear-gradient
export const gradients = {
  primary: ['#e8913a', '#b87028'] as const,
  coral: ['#e8534a', '#d4403a'] as const,
  purple: ['#9b6dff', '#7f48e8'] as const,
  green: ['#2ec98e', '#18a86d'] as const,
  encouragementBg: ['#fff8f0', '#f6f2ff'] as const,
  userBubble: ['#fff8f0', '#fef6ee'] as const,
  headerText: ['#96581e', '#b87028'] as const,
  background: ['#fefcf9', '#fff4e6', '#fef0dc', '#fefcf9'] as const,
} as const;

// ─────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────

export const fontFamily = {
  display: {
    regular: 'Nunito_400Regular',
    medium: 'Nunito_500Medium',
    semiBold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    italic: 'Nunito_400Regular',
  },
  mono: {
    regular: 'Nunito_500Medium',
    bold: 'Nunito_700Bold',
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
    fontFamily: fontFamily.display.semiBold,
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
    fontFamily: fontFamily.display.semiBold,
    fontSize: 13,
    letterSpacing: 0.3,
    color: colors.text.muted,
  },
  stat: {
    fontFamily: fontFamily.display.bold,
    fontSize: 24,
  },
  tag: {
    fontFamily: fontFamily.display.medium,
    fontSize: 12,
  },
  button: {
    fontFamily: fontFamily.display.semiBold,
    fontSize: 14,
  },
  input: {
    fontFamily: fontFamily.display.regular,
    fontSize: 16,
    color: colors.text.primary,
  },
  chatMessage: {
    fontFamily: fontFamily.display.regular,
    fontSize: 16,
    lineHeight: 26,
    color: colors.text.warm,
  },
  chatLabel: {
    fontFamily: fontFamily.display.semiBold,
    fontSize: 12,
    letterSpacing: 0.3,
    color: colors.primary[500],
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
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  pill: 9999,
  full: 9999,
} as const;

// ─────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#6b5c4d',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#6b5c4d',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    android: { elevation: 3 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#6b5c4d',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
  }),
  primaryGlow: Platform.select({
    ios: {
      shadowColor: '#b87028',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
  }),
  purpleGlow: Platform.select({
    ios: {
      shadowColor: '#9b6dff',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
  }),
  amberGlow: Platform.select({
    ios: {
      shadowColor: '#b87028',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
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

import { getStatusesForTrack, type StatusConfig } from '@/constants/tracks';
import type { TrackType } from '@/types/idea';

export function getStatusConfig(trackType: TrackType): StatusConfig[] {
  return getStatusesForTrack(trackType);
}

// Backwards-compatible export — side_project statuses
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
