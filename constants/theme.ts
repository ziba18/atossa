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
  md: 12,   // rounded-xl equivalent
  lg: 16,
  xl: 20,
  xxl: 24,  // rounded-2xl — used on cards (matching web)
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
// Web uses: Jost (sans) + Cormorant Garamond (display/serif)
// Install with: npx expo install @expo-google-fonts/jost @expo-google-fonts/cormorant-garamond expo-font
export const FontFamily = {
  sans: 'Jost_400Regular',
  sansMedium: 'Jost_500Medium',
  sansSemibold: 'Jost_600SemiBold',
  display: 'CormorantGaramond_600SemiBold',
  displayItalic: 'CormorantGaramond_600SemiBold_Italic',
  // System fallbacks (used until fonts load)
  sansSystem: 'System',
  displaySystem: 'Georgia',
} as const;

// ─── Shadows — soft warm ─────────────────────────────────────────────────────
export const Shadow = {
  sm: {
    shadowColor: '#A09080',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#A09080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#A09080',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ─── Themes ───────────────────────────────────────────────────────────────────
export const lightTheme = {
  background: Colors.background,      // #F5EDE5 — warm blush cream
  surface: Colors.surface,            // #FFFFFF
  surfaceElevated: Colors.surfaceElevated,
  text: Colors.textPrimary,
  textSecondary: Colors.textSecondary,
  textMuted: Colors.textMuted,
  border: Colors.border,
  borderStrong: Colors.borderStrong,
  primary: Colors.cherry,             // #C76E72 dusty rose
  secondary: Colors.forest,           // #5E9E6A sage green
  accent: Colors.gold,                // #9B8EC4 lavender
  tabBar: Colors.forestDark,          // #FFFFFF
  tabActive: Colors.cherry,           // #C76E72
  tabInactive: 'rgba(160,144,128,0.55)',
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
