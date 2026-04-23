// ─────────────────────────────────────────────────────────────────────────────
// Attosa Design System — Soft Pastel Palette
// Dusty rose · Sage green · Warm yellow · Muted lavender · Blush cream
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // ── Dusty Rose (primary brand — replaces cherry/red) ─────────────────────
  cherry: '#C76E72',           // dusty rose — primary CTA, active states
  cherryLight: '#D4878A',      // lighter rose
  cherryLighter: '#FDF0F0',    // soft rose tinted backgrounds, chips
  cherryDark: '#A05558',       // deep rose — gradients

  // ── Dark surfaces (kept for overlays / dark mode) ─────────────────────────
  bordeaux: '#2A1C18',         // deep warm brown — overlays only
  bordeauxMid: '#F5EDE5',      // maps to background in light mode
  bordeauxLight: '#FDFAF8',    // maps to elevated surface

  // ── Lavender (accent — replaces gold) ────────────────────────────────────
  gold: '#9B8EC4',             // muted lavender accent
  goldLight: '#B0A3D4',        // lighter lavender
  goldLighter: '#F0EDF8',      // lavender tinted bg
  goldDark: '#7A6EA0',         // deep lavender text

  // ── Blush Cream (backgrounds) ─────────────────────────────────────────────
  cream: '#F5EDE5',            // warm blush cream bg
  creamDark: '#EDE4DC',        // slightly deeper cream

  // ── Sage Green (secondary / follicular) ───────────────────────────────────
  forest: '#5E9E6A',           // sage green
  forestDark: '#FFFFFF',       // tab bar background (white)
  forestMuted: '#8DBF8A',      // light sage
  forestLighter: '#EDF5ED',    // sage tinted bg

  // ── Whiskey (mapped to Dusty Rose for consistency) ────────────────────────
  whiskey: '#C76E72',          // = dusty rose (used for active tab)
  whiskeyLight: '#D4878A',
  whiskeyLighter: '#FDF0F0',
  whiskeyDark: '#A05558',

  // ── Emerald ───────────────────────────────────────────────────────────────
  emerald: '#6ABF8A',
  emeraldLight: '#8DD4A8',
  emeraldLighter: '#EDF8F2',
  emeraldDark: '#4A9A6A',

  // ── Silver ────────────────────────────────────────────────────────────────
  silver: '#E0D8D0',
  silverDark: '#B8AEA8',

  // ── Backgrounds ───────────────────────────────────────────────────────────
  background: '#F5EDE5',       // warm blush cream
  backgroundDark: '#2A1C18',
  surface: '#FFFFFF',
  surfaceDark: '#2A1C18',
  surfaceElevated: '#FDFAF8',  // warm elevated surface
  surfaceElevatedDark: '#3A2820',

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary: '#2A1C18',      // dark warm brown
  textPrimaryDark: '#F5EDE5',
  textSecondary: '#7A6860',    // muted warm brown
  textSecondaryDark: '#C4A89C',
  textMuted: '#A09080',
  textMutedDark: '#7A6860',

  // ── Borders ───────────────────────────────────────────────────────────────
  border: 'rgba(180, 150, 140, 0.2)',
  borderStrong: 'rgba(180, 150, 140, 0.4)',
  borderDark: 'rgba(180, 150, 140, 0.25)',

  // ── Cycle phase colours — soft pastels ───────────────────────────────────
  menstrual: '#D4878A',        // dusty rose
  predictedPeriod: '#FDF0F0',  // soft rose tint
  follicular: '#8DBF8A',       // sage green
  ovulation: '#D4C870',        // warm yellow
  luteal: '#9B8EC4',           // muted lavender

  // ── Status ────────────────────────────────────────────────────────────────
  success: '#6ABF8A',
  warning: '#D4C870',
  error: '#C76E72',
  info: '#7AB0D4',

  // ── Utility ───────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(42, 28, 24, 0.5)',
  overlayLight: 'rgba(199, 110, 114, 0.06)',
} as const;

export type ColorKey = keyof typeof Colors;
