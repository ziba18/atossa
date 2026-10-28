// Design tokens — "Iris" (round 3, mockups in atossa-hq agents/design/mockups/round3) (spec: reports/Atossa app design research.md §Visual system;
// exact values: design/lovable-reference/styles.css). Light only. See design/KIT.md for usage rules.
import type { TextStyle, ViewStyle } from 'react-native';

/** The palette. Every colour on screen comes from here. */
export const colors = {
  canvas: '#FAF9FD', // app background
  surface: '#FFFFFF', // cards, sheets, PDF
  washTop: '#FAF9FD', // same as canvas: no visible wash behind headers (restraint)
  sunken: '#EFEEF3', // input wells, segmented track, disabled primary (use ink2 text on it, never ink3)
  hairline: '#DCD2EE', // card borders, dividers — decorative only
  borderStrong: '#7F7292', // input + chip outlines (3:1 UI contrast)
  ink: '#2A1838', // body text, Sam's words
  ink2: '#5E4F70', // secondary text, Atossa's tidy values
  ink3: '#6B5A7A', // labels, "why I'm asking", timestamps, chevrons
  plum: '#4C31B5', // ACTION ONLY: primary buttons, mic, selected tab, links, selection
  plumPressed: '#3D2594',
  plumTint: '#EFEBFA', // selected chips / segments, user bubble
  clay: '#C23B4E', // BLEEDING ONLY: calendar fill, entry edge, droplet icon, PDF band
  clayTint: '#FBE1E5', // period-day band in charts
  saved: '#2E6A4F', // system "saved" status — never describes a body
  savedTint: '#E2EEE6',
  error: '#A12A2A', // app errors only (network, mic permission)
  errorTint: '#F6E0DE',
  white: '#FFFFFF',
  /** Scrim behind sheets (ink at 20%). */
  scrim: 'rgba(42,24,56,0.2)',
  /** Tab bar surface. */
  tabBar: 'rgba(255,255,255,0.94)',
} as const;

/** Single-hue severity ramp for 0–2, 3–4, 5–6, 7–8, 9–10. Always shown with the digit. */
export const severityRamp = ['#E6DDFB', '#C4B2F6', '#A08AF2', '#6A48E8', '#3F23A8'] as const;

/** Ramp step (0–4) for a 0–10 score. */
export function severityStep(n: number): 0 | 1 | 2 | 3 | 4 {
  const v = Math.max(0, Math.min(10, Math.round(n)));
  if (v <= 2) return 0;
  if (v <= 4) return 1;
  if (v <= 6) return 2;
  if (v <= 8) return 3;
  return 4;
}

/** Fill + legible text colour for a 0–10 score (steps 0–2 take ink, 3–4 take white; ink on step 2 is 5.76:1, white on #8E72EE was 3.63). */
export function severityColor(n: number): { bg: string; fg: string } {
  const step = severityStep(n);
  return { bg: severityRamp[step], fg: step <= 2 ? colors.ink : colors.white };
}

/** Font family names, as registered in app/_layout.tsx. Serif is the ITALIC face and never takes a weight. */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  serif: 'Fraunces_400Regular',
} as const;

export type TypeVariant =
  | 'largeTitle' | 'hero' | 'title' | 'quote' | 'headline'
  | 'body' | 'secondary' | 'caption' | 'numeral' | 'tab'
  | 'fieldLabel' | 'groupLabel';

/**
 * The type scale. `hero` and `quote` are Fraunces (upright) and are ONLY for
 * Sam's own words, the Today hero prompt and the summary title. No 700 weight anywhere.
 */
export const type: Record<TypeVariant, TextStyle> = {
  largeTitle: { fontFamily: fonts.semibold, fontSize: 34, lineHeight: 41, letterSpacing: -0.17, color: colors.ink },
  hero: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, color: colors.ink },
  title: { fontFamily: fonts.semibold, fontSize: 24, lineHeight: 30, color: colors.ink },
  quote: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 28, color: colors.ink },
  headline: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 24, color: colors.ink },
  secondary: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, color: colors.ink2 },
  caption: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 19, letterSpacing: 0.2, color: colors.ink3 },
  numeral: { fontFamily: fonts.medium, fontSize: 44, lineHeight: 48, fontVariant: ['tabular-nums'], color: colors.ink },
  tab: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 18, color: colors.ink3 },
  // ---- text hierarchy (review 1, V4/V5/V10) ----
  /** The ONE form-field label style (FieldLabel): "What's happening?", "Usually", "Name". */
  fieldLabel: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, color: colors.ink },
  /** Group header above a run of cards (Timeline week headers "This week"). Distinct from card titles. */
  groupLabel: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, color: colors.ink2 },
};

/**
 * Text hierarchy, in one place (review 1):
 * - row label in a card (NotedRow, "Your latest note") → `caption` (13 ink3)
 * - the value / answer under it → `body` (17 ink) — grey label, INK content
 * - form field label → `fieldLabel` via the kit's FieldLabel (17/600 ink, " · Optional" 15 ink2)
 * - group header over cards → `groupLabel` (15/600 ink2), 32 above / 8 below
 * - meta (dates, fact lines on cards) → `secondary` (15 ink2)
 */

/** 4-pt grid. Use these instead of ad-hoc numbers. */
export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40, huge: 56 } as const;

export const radii = { input: 16, card: 24, sheet: 32, pill: 999 } as const;

export const heights = {
  primary: 56, secondary: 48, chip: 44, addChip: 36, segmented: 36, datePill: 36, minHit: 44,
  /** Tab bar content height, excluding the bottom safe-area inset. */
  tabBar: 62,
  /** One-line toast (kit only). */
  toast: 48,
  /**
   * Bottom padding every ScreenLarge scroll ends with, so the last control (e.g. "Restore sample
   * data") can always scroll clear of the toast zone above the tab bar (review 1/2, UX #30).
   * = toast (48, up to ~68 when it wraps) + its 8 gap + 24.
   */
  toastClearance: 80,
} as const;

/** Only the Today hero and the document preview get a shadow. */
export const shadows: { hero: ViewStyle; card: ViewStyle; sheet: ViewStyle; toast: ViewStyle; thumb: ViewStyle } = {
  hero: { boxShadow: '0 2px 16px rgba(31,27,24,0.06)' }, // y 2, blur 16, ink at 6%
  /** Resting card: two soft layers so white cards lift off the cream canvas. */
  card: { boxShadow: '0 1px 3px rgba(31,27,24,0.08), 0 6px 20px rgba(31,27,24,0.05)' },
  sheet: { boxShadow: '0 -8px 32px rgba(31,27,24,0.12)' },
  /** The floating toast (kit only). */
  toast: { boxShadow: '0 6px 24px rgba(31,27,24,0.12)' },
  /** Micro-shadow on the SegmentedControl's selected thumb (kit only, as iOS does). */
  thumb: { boxShadow: '0 1px 2px rgba(31,27,24,0.10)' },
};

export const motion = { fast: 200, base: 240, sheet: 260, toastMs: 3000 } as const;

export const layout = { gutter: 20, maxContentWidth: 600 } as const;

/**
 * Legacy aggregate. `UI.colors.*` keeps the OLD key names (used by auth / onboarding /
 * profile sub-screens) but maps them onto the new palette, so those screens re-skin
 * without code changes. New code should import `colors`, `type`, `space`, … directly.
 */
export const UI = {
  colors: {
    ...colors,
    background: colors.canvas,
    foreground: colors.ink,
    card: colors.surface,
    primary: colors.plum,
    primaryStrong: colors.plum,
    primaryForeground: colors.white,
    secondary: colors.plumTint,
    secondaryForeground: colors.plum,
    muted: colors.sunken,
    mutedForeground: colors.ink2,
    accent: colors.plumTint,
    accentForeground: colors.plum,
    destructive: colors.error,
    border: colors.hairline,
    success: colors.saved,
    successSoft: colors.savedTint,
    coralSoft: colors.errorTint,
    blueSoft: colors.plumTint,
    bleeding: colors.clay,
    bleedingLight: colors.clay,
    bleedingDark: colors.clay,
  },
  font: {
    display: fonts.serif,
    body: fonts.regular,
    medium: fonts.medium,
    semibold: fonts.semibold,
    /** No 700 in this system — "bold" maps to 600. */
    bold: fonts.semibold,
  },
  size: { body: 17, small: 15, tiny: 13, h3: 17, h2: 24, display: 34 },
  /** Legacy single radius → input radius. Cards use radii.card. */
  radius: radii.input,
  minTap: heights.primary,
  gutter: layout.gutter,
  /** On tablets the app is centred in a column this wide instead of stretching. */
  maxContentWidth: layout.maxContentWidth,
} as const;
