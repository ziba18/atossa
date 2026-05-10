// ─────────────────────────────────────────────────────────────────────────────
// Atossa Design System — warm rose + bordeaux palette
// Soft blush · Deep rose · Bordeaux · Warm cream · Ink
//
// Naming convention: the legacy aliases (cherry, gold, whiskey, forest, etc.)
// are kept as keys so existing components don't break — only the underlying
// hex values change. New code should prefer the semantic names at the bottom
// (rose, roseDeep, bordeaux, blush, etc.).
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // ── Primary brand (deep rose) ─────────────────────────────────────────────
  // Was sage green — now deep rose so CTAs feel warm and feminine without
  // tipping into pastel.
  cherry: '#B0455A',            // primary CTA, active states (deep rose)
  cherryLight: '#E8A5B0',       // soft blush
  cherryLighter: '#FBEEF1',     // very soft rose tint
  cherryDark: '#7A2A3D',        // bordeaux gradients

  // ── Ink surfaces ──────────────────────────────────────────────────────────
  bordeaux: '#2A1F26',          // near-black with warm undertone (text)
  bordeauxMid: '#FAF6F1',       // warm cream (background mapping)
  bordeauxLight: '#FFFFFF',     // surface mapping

  // ── Accent (warm taupe / dusty rose) ──────────────────────────────────────
  // Was muted lavender — replaced with a warm dusty rose that complements
  // the bordeaux primary.
  gold: '#C49B89',              // dusty rose accent
  goldLight: '#E8C8B8',         // soft blush-tan
  goldLighter: '#FAF1ED',       // tinted bg
  goldDark: '#8B5C4A',          // deep terracotta text

  // ── Cream backgrounds ─────────────────────────────────────────────────────
  cream: '#FAF6F1',             // warm cream bg
  creamDark: '#F2EBE2',         // slightly deeper cream

  // ── Sage Green (kept for follicular phase, but desaturated) ───────────────
  // Reduced saturation so it sits in the warm rose palette without clashing.
  forest: '#8FA88E',            // muted sage
  forestDark: '#FFFFFF',        // tab bar background (white)
  forestMuted: '#B5C8B5',       // light muted sage
  forestLighter: '#EFF3EE',     // sage tinted bg

  // ── Rose family (status/phase) ────────────────────────────────────────────
  whiskey: '#B0455A',           // alias for primary deep rose
  whiskeyLight: '#E8A5B0',
  whiskeyLighter: '#FBEEF1',
  whiskeyDark: '#7A2A3D',

  // ── Emerald (success) — kept distinguishable but warm ─────────────────────
  emerald: '#7A9C7E',
  emeraldLight: '#A5BFA8',
  emeraldLighter: '#EFF3EE',
  emeraldDark: '#4F6F54',

  // ── Silver / mauve (informational) ────────────────────────────────────────
  silver: '#E2D6DC',
  silverDark: '#9C8590',

  // ── Backgrounds ───────────────────────────────────────────────────────────
  background: '#FAF6F1',        // warm cream
  backgroundDark: '#241A21',    // deep bordeaux-tinted dark
  surface: '#FFFFFF',
  surfaceDark: '#2E2229',
  surfaceElevated: '#FFFCF8',
  surfaceElevatedDark: '#3A2A33',

  // ── Text ──────────────────────────────────────────────────────────────────
  // High-contrast black-with-warm-undertone for primary, warm grey for secondary,
  // muted warm grey for tertiary. No colored text by default.
  textPrimary: '#2A1F26',       // near-black (deep bordeaux)
  textPrimaryDark: '#F5EBE8',
  textSecondary: '#6B5560',     // warm grey
  textSecondaryDark: '#C5B0B8',
  textMuted: '#9C8590',         // soft mauve grey
  textMutedDark: '#8A7782',

  // ── Borders ───────────────────────────────────────────────────────────────
  border: 'rgba(42,31,38,0.10)',
  borderStrong: 'rgba(42,31,38,0.20)',
  borderDark: 'rgba(245,235,232,0.12)',

  // ── Cycle phase colours ───────────────────────────────────────────────────
  // All phase colours sit in the warm rose palette family, but stay
  // distinguishable from each other.
  menstrual: '#B0455A',         // deep rose
  predictedPeriod: '#FBEEF1',   // soft rose tint
  follicular: '#8FA88E',        // muted sage
  ovulation: '#D4A65C',         // warm honey
  luteal: '#A89AB5',            // soft mauve

  // ── Direct semantic palette (preferred for new code) ──────────────────────
  matcha: '#B5C8B5',            // legacy alias → light muted sage
  matchaDeep: '#8FA88E',        // legacy alias → muted sage
  rose: '#E8A5B0',              // soft blush
  roseDeep: '#B0455A',          // primary deep rose
  sky: '#A89AB5',               // legacy alias → soft mauve
  skyDeep: '#7C6E89',           // legacy alias → deep mauve
  ink: '#2A1F26',               // near-black warm
  lavender: '#A89AB5',          // legacy alias → soft mauve
  apricot: '#D4A65C',           // warm honey

  // ── Status ────────────────────────────────────────────────────────────────
  success: '#7A9C7E',           // muted sage (warm)
  warning: '#D4A65C',           // warm honey
  error: '#B0455A',             // deep rose
  info: '#7C6E89',              // deep mauve

  // ── Severity scale (pain slider) ──────────────────────────────────────────
  severity1: '#7A9C7E',         // low — muted sage
  severity4: '#D4A65C',         // moderate — warm honey
  severity7: '#B0455A',         // high — deep rose
  severity10: '#7A2A3D',        // severe — bordeaux

  // ── Translucent glass surfaces ────────────────────────────────────────────
  glassBg: 'rgba(255,255,255,0.78)',          // hero / main glass card
  glassBgSoft: 'rgba(255,255,255,0.68)',      // stat tiles, alert card
  glassBgSubtle: 'rgba(255,255,255,0.55)',    // small tiles
  glassBgFaint: 'rgba(255,255,255,0.30)',     // chips on coloured banners
  glassBorder: 'rgba(42,31,38,0.08)',         // glass card border

  // ── Utility ───────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(42,31,38,0.5)',
  overlayLight: 'rgba(176,69,90,0.06)',
} as const;

export type ColorKey = keyof typeof Colors;
