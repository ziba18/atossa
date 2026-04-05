export const Colors = {
  // Primary palette
  cherry: '#DC143C',
  cherryLight: '#FF6B8A',
  cherryLighter: '#FFE4EB',
  cherryDark: '#A50E2D',

  emerald: '#50C878',
  emeraldLight: '#7FE8A2',
  emeraldLighter: '#E4F9EC',
  emeraldDark: '#3A9A5C',

  whiskey: '#D4A017',
  whiskeyLight: '#F0C740',
  whiskeyLighter: '#FDF3CC',
  whiskeyDark: '#A37800',

  // Neutrals
  white: '#FFFFFF',
  background: '#FFF8F9',
  backgroundDark: '#1A0A0E',
  surface: '#FFFFFF',
  surfaceDark: '#2D1219',
  surfaceElevated: '#FFF0F3',
  surfaceElevatedDark: '#3D1A24',

  // Text
  textPrimary: '#1A0A0E',
  textPrimaryDark: '#F5E6EA',
  textSecondary: '#6B3A47',
  textSecondaryDark: '#C8939F',
  textMuted: '#9E6977',
  textMutedDark: '#8A5563',

  // Borders
  border: '#F0D6DB',
  borderDark: '#4A2030',
  borderStrong: '#D4A0AD',

  // Cycle phase colors
  menstrual: '#DC143C',      // cherry — period days
  follicular: '#50C878',     // emerald — post-period
  ovulation: '#D4A017',      // whiskey gold — ovulation peak
  luteal: '#9B59B6',         // purple — pre-period phase
  predictedPeriod: '#DC143C66', // semi-transparent cherry

  // Status colors
  success: '#50C878',
  warning: '#D4A017',
  error: '#DC143C',
  info: '#4A90D9',

  // Severity gradient (pain, flow)
  severity1: '#50C878',
  severity4: '#D4A017',
  severity7: '#E8742A',
  severity10: '#DC143C',

  // Transparent overlays
  overlay: 'rgba(26, 10, 14, 0.5)',
  overlayLight: 'rgba(220, 20, 60, 0.08)',
} as const;

export type ColorKey = keyof typeof Colors;
