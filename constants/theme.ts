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

// ─── Layout ──────────────────────────────────────────────────────────────────
// Phone-style content is centred in a column at this width on tablets, so screens
// don't stretch to ~1180pt on an iPad and break paged carousels / charts.
export const MAX_CONTENT_WIDTH = 600;

// ─── Border radius ───────────────────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
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
// Single-typeface system: Fraunces — a modern variable serif with distinctive
// ball-terminal letterforms (notice the lowercase g, y, e, a — they're what
// makes the app's text feel hand-crafted instead of generic). Italic variants
// for hero/display text; non-italic for body, labels, and small UI. Sans*
// aliases stay mapped to Fraunces so legacy callers don't break.
export const FontFamily = {
  sans:           'Fraunces_400Regular',
  sansMedium:     'Fraunces_500Medium',
  sansSemibold:   'Fraunces_600SemiBold',
  display:        'Fraunces_500Medium_Italic',
  displayMedium:  'Fraunces_500Medium',
  displayItalic:  'Fraunces_500Medium_Italic',
  displaySemibold:'Fraunces_600SemiBold_Italic',
  bodyItalic:     'Fraunces_400Regular_Italic',
  sansSystem:     'System',
  displaySystem:  'System',
} as const;

// ─── Shadows — soft ──────────────────────────────────────────────────────────
export const Shadow = {
  sm: {
    shadowColor: '#2A1F26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#2A1F26',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#2A1F26',
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
  secondary: Colors.cherryDark,
  accent: Colors.gold,
  tabBar: Colors.surface,
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
  primary: Colors.cherryLight,
  secondary: Colors.cherryDark,
  accent: Colors.gold,
  tabBar: Colors.surfaceDark,
  tabActive: Colors.cherryLight,
  tabInactive: 'rgba(245,235,232,0.45)',
  isDark: true,
};

export type Theme = typeof lightTheme;
