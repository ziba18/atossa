import { Colors } from './colors';

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Border radius ───────────────────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,   // cycle-bloom "2rem" — main card radius
  full: 9999,
} as const;

// ─── Font sizes ───────────────────────────────────────────────────────────────
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 38,
} as const;

// ─── Font weights ─────────────────────────────────────────────────────────────
export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ─── Font families ────────────────────────────────────────────────────────────
export const FontFamily = {
  sans: 'Jost_400Regular',
  sansMedium: 'Jost_500Medium',
  sansSemibold: 'Jost_600SemiBold',
  display: 'CormorantGaramond_600SemiBold',
  displayItalic: 'CormorantGaramond_600SemiBold_Italic',
  sansSystem: 'System',
  displaySystem: 'Georgia',
} as const;

// ─── Shadows — soft ──────────────────────────────────────────────────────────
export const Shadow = {
  sm: {
    shadowColor: '#333244',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#333244',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#333244',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 30,
    elevation: 8,
  },
} as const;

// ─── Themes ───────────────────────────────────────────────────────────────────
export const lightTheme = {
  background: Colors.background,
  surface: Colors.surface,
  surfaceElevated: Colors.surfaceElevated,
  text: Colors.textPrimary,
  textSecondary: Colors.textSecondary,
  textMuted: Colors.textMuted,
  border: Colors.border,
  borderStrong: Colors.borderStrong,
  primary: Colors.cherry,
  secondary: Colors.forest,
  accent: Colors.gold,
  tabBar: Colors.forestDark,
  tabActive: Colors.cherry,
  tabInactive: Colors.textMuted,
  isDark: false,
};

export const darkTheme = {
  background: Colors.backgroundDark,
  surface: Colors.surfaceDark,
  surfaceElevated: Colors.surfaceElevatedDark,
  text: Colors.textPrimaryDark,
  textSecondary: Colors.textSecondaryDark,
  textMuted: Colors.textMutedDark,
  border: Colors.borderDark,
  borderStrong: Colors.borderDark,
  primary: Colors.cherry,
  secondary: Colors.forest,
  accent: Colors.whiskey,
  tabBar: Colors.forestDark,
  tabActive: Colors.whiskey,
  tabInactive: 'rgba(224,224,224,0.35)',
  isDark: true,
};

export type Theme = typeof lightTheme;
