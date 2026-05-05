export const colors = {
  primary: '#EA580C',
  primaryDark: '#C2410C',
  primaryLight: '#FB923C',
  primaryBg: '#FFF7ED',

  accent: '#16A34A',
  accentDark: '#15803D',
  accentLight: '#4ADE80',
  accentBg: '#F0FDF4',

  danger: '#EF4444',
  dangerBg: '#FEF2F2',

  warning: '#EAB308',
  warningBg: '#FEFCE8',

  info: '#3B82F6',
  infoBg: '#EFF6FF',

  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  white: '#FFFFFF',
  black: '#000000',
} as const

export type ColorKey = keyof typeof colors
