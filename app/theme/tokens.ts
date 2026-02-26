export const colors = {
  bg: {
    primary: '#111114',
    surface: 'rgba(30, 30, 34, 0.85)',
    surfaceHover: 'rgba(40, 40, 46, 0.95)',
    input: 'rgba(20, 20, 24, 0.8)',
  },
  text: {
    primary: '#f0efe8',
    secondary: '#aaaaaa',
    muted: '#888888',
    inverse: '#1a1a1e',
  },
  amber: {
    50: 'rgba(251, 191, 36, 0.04)',
    100: 'rgba(251, 191, 36, 0.08)',
    200: 'rgba(251, 191, 36, 0.15)',
    300: 'rgba(251, 191, 36, 0.25)',
    400: '#f59e0b',
    500: '#fbbf24',
  },
  status: {
    spark: '#f59e0b',
    exploring: '#8b5cf6',
    building: '#3b82f6',
    shipped: '#10b981',
  },
  purple: { 400: '#8b5cf6', 500: '#6d28d9' },
  green: { 400: '#10b981', 500: '#059669' },
  red: { 300: 'rgba(244, 63, 94, 0.2)', 400: '#f43f5e' },
  blue: { 300: '#93c5fd', 400: '#3b82f6' },
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    medium: 'rgba(255, 255, 255, 0.1)',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const fonts = {
  mono: 'SpaceMono',
} as const;
