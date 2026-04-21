// ─────────────────────────────────────────────────────────────────────────────
// Attosa Design System — exact match to AttosaWeb Tailwind palette
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // ── Cherry (primary brand — deep dark burgundy) ──────────────────────────
  cherry: '#390517',          // primary CTA, active states
  cherryLight: '#6B1530',     // hover
  cherryLighter: '#F2E6EA',   // tinted backgrounds, chips
  cherryDark: '#1E030C',      // deepest shade, hero gradients

  // ── Forest (secondary — deep green) ──────────────────────────────────────
  forest: '#16302B',          // secondary buttons, tags
  forestDark: '#03110D',      // tab bar, sidebar, hero dark end
  forestMuted: '#4A6B63',     // muted text on dark bg
  forestLighter: '#E3EDEB',   // light green tint backgrounds

  // ── Whiskey (accent — champagne gold) ────────────────────────────────────
  whiskey: '#A38560',         // accents, active tab, badge borders
  whiskeyLight: '#C4A882',    // hover
  whiskeyLighter: '#F5EDE0',  // warm tinted backgrounds
  whiskeyDark: '#7A6245',     // dark gold text

  // ── Emerald (health success / low-risk indicator) ────────────────────────
  emerald: '#50C878',
  emeraldLight: '#7FE8A2',
  emeraldLighter: '#E4F9EC',
  emeraldDark: '#3A9A5C',

  // ── Silver ────────────────────────────────────────────────────────────────
  silver: '#E0E0E0',
  silverDark: '#B0B0B0',

  // ── Backgrounds ───────────────────────────────────────────────────────────
  background: '#EFE5D2',      // warm linen — main app background
  backgroundDark: '#362822',  // dark mode background
  surface: '#FFFFFF',         // card / input backgrounds
  surfaceDark: '#4a3530',
  surfaceElevated: '#F8F2E8', // slightly warm elevated surface
  surfaceElevatedDark: '#543d37',

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary: '#1a1a1a',
  textPrimaryDark: '#F5EDE0',
  textSecondary: '#6b7280',
  textSecondaryDark: '#D2B491',
  textMuted: '#9ca3af',
  textMutedDark: '#8A7060',

  // ── Borders ───────────────────────────────────────────────────────────────
  border: 'rgba(163, 133, 96, 0.18)',       // warm golden border (main)
  borderStrong: 'rgba(163, 133, 96, 0.4)',  // stronger border
  borderDark: 'rgba(163, 133, 96, 0.22)',

  // ── Cycle phase colours (calendar) ────────────────────────────────────────
  menstrual: '#390517',         // period days — cherry
  predictedPeriod: '#F2E6EA',   // predicted period days — light cherry tint
  follicular: '#16302B',        // follicular — forest
  ovulation: '#A38560',         // ovulation peak — whiskey gold
  luteal: '#7B4D8C',            // luteal — muted purple

  // ── Status ────────────────────────────────────────────────────────────────
  success: '#50C878',
  warning: '#A38560',
  error: '#390517',
  info: '#4A90D9',

  // ── Utility ───────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(57, 5, 23, 0.5)',
  overlayLight: 'rgba(57, 5, 23, 0.06)',
} as const;

export type ColorKey = keyof typeof Colors;
