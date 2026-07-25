// ─────────────────────────────────────────────────────────────────────────────
// Atossa Design System — cottagecore / botanical herbalist
// Paper · Cream · Moss · Bark · Amber · Ink
//
// Mood: the knowledgeable herbalist, earthy, warm, close to the soil.
// Gender-neutral; no pink/girly framing anywhere.
//
// Palette tokens from the verdant-cycles design:
//   paper #f7f3eb · cream #fdf8f1 · moss #3a4d39 · bark #4a3728
//   amber-brand #b45309 · ink #1c1e1c
//
// Naming convention: legacy aliases (cherry, gold, whiskey, forest, etc.)
// are kept so existing components don't break — only the underlying hex
// values changed. New code should prefer the semantic names at the bottom.
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // ── Primary brand (moss — herbalist green) ───────────────────────────────
  cherry: '#3a4d39',            // primary CTA, active states
  cherryLight: '#4d6b4c',       // lighter moss border/accent
  cherryLighter: '#e6ede4',     // very soft moss tint (chat bg)
  cherryDark: '#273327',        // deep moss, pressed states

  // ── Dashboard accent (bark brown) ─────────────────────────────────────────
  dashboardGreen: '#4a3728',
  dashboardGreenLight: '#7a5c46',
  dashboardGreenLighter: '#f0e8dc',
  dashboardGreenSoft: '#e2d5c3',

  // ── Report accent (amber / warm gold) ─────────────────────────────────────
  reportBlue: '#b45309',
  reportBlueLight: '#d97706',
  reportBlueLighter: '#fef3c7',
  reportBlueSoft: '#fde68a',

  // ── Ink surfaces ──────────────────────────────────────────────────────────
  bordeaux: '#1c1e1c',          // near-black ink (text)
  bordeauxMid: '#f7f3eb',       // paper (background mapping)
  bordeauxLight: '#FFFFFF',     // surface mapping

  // ── Accent (lighter moss / dried herb) ────────────────────────────────────
  gold: '#4d6b4c',
  goldLight: '#7a9678',
  goldLighter: '#e9efe7',
  goldDark: '#3a4d39',

  // ── Paper backgrounds ─────────────────────────────────────────────────────
  cream: '#f7f3eb',             // paper bg
  creamDark: '#ede7d9',         // slightly deeper parchment

  // ── Forest (moss tones) ───────────────────────────────────────────────────
  forest: '#4d6b4c',            // lighter moss
  forestDark: '#1c1e1c',        // near-black ink (dark surfaces)
  forestMuted: '#8ea38c',       // light forest
  forestLighter: '#e6ede4',     // forest tinted bg

  // ── Oxblood (status/phase — period colour) ────────────────────────────────
  whiskey: '#6E1F1F',           // deep oxblood — alias for primary danger/period
  whiskeyLight: '#A85C5C',
  whiskeyLighter: '#F4E3E0',
  whiskeyDark: '#3D0F0F',

  // ── Emerald (success) — brighter for contrast ─────────────────────────────
  emerald: '#3F7D58',
  emeraldLight: '#7FB08A',
  emeraldLighter: '#E5F0E7',
  emeraldDark: '#234A33',

  // ── Plum (informational / mystic) ─────────────────────────────────────────
  silver: '#5B4B73',
  silverDark: '#3A2E4D',

  // ── Backgrounds ───────────────────────────────────────────────────────────
  background: '#f7f3eb',        // paper
  backgroundDark: '#14110E',    // near-black warm dark
  surface: '#FFFFFF',
  surfaceDark: '#1F1A16',
  surfaceElevated: '#fdf8f1',   // cream
  surfaceElevatedDark: '#2A231D',

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary: '#1c1e1c',
  textPrimaryDark: '#F0E9DC',
  textSecondary: '#4a3728',     // bark
  textSecondaryDark: '#C9BFAE',
  textMuted: '#7a6e60',
  textMutedDark: '#8C8071',

  // ── Borders ───────────────────────────────────────────────────────────────
  border: 'rgba(28,30,28,0.12)',
  borderStrong: 'rgba(28,30,28,0.24)',
  borderDark: 'rgba(240,233,220,0.12)',

  // ── Cycle phase colours ───────────────────────────────────────────────────
  menstrual: '#6E1F1F',         // oxblood
  predictedPeriod: '#F4E3E0',   // soft oxblood tint
  follicular: '#3a4d39',        // moss
  ovulation: '#b45309',         // amber-brand
  luteal: '#5B4B73',            // plum

  // ── Direct semantic palette (preferred for new code) ─────────────────────
  matcha: '#8ea38c',            // light moss
  matchaDeep: '#4d6b4c',        // lighter moss
  rose: '#A85C5C',              // dusty oxblood-light
  roseDeep: '#6E1F1F',          // oxblood
  sky: '#5B4B73',               // plum
  skyDeep: '#3A2E4D',           // deep plum
  ink: '#1c1e1c',               // near-black
  lavender: '#5B4B73',          // plum
  apricot: '#b45309',           // amber

  // ── Verdant-cycles palette tokens (new code should use these) ────────────
  paper: '#f7f3eb',             // page background
  paperCream: '#fdf8f1',        // surface / elevated
  moss: '#3a4d39',              // primary brand
  bark: '#4a3728',              // secondary / bark brown
  amberBrand: '#b45309',        // report / amber glow

  // ── Status ────────────────────────────────────────────────────────────────
  success: '#3F7D58',
  warning: '#C9A227',
  error: '#6E1F1F',
  info: '#5B4B73',

  // ── Severity scale (pain slider) ──────────────────────────────────────────
  severity1: '#3F7D58',
  severity4: '#C9A227',
  severity7: '#8B3A3A',
  severity10: '#3D0F0F',

  // ── Translucent glass surfaces ────────────────────────────────────────────
  glassBg: 'rgba(255,255,255,0.78)',
  glassBgSoft: 'rgba(255,255,255,0.68)',
  glassBgSubtle: 'rgba(255,255,255,0.55)',
  glassBgFaint: 'rgba(255,255,255,0.30)',
  glassBorder: 'rgba(28,30,28,0.08)',

  // ── Utility ───────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(28,30,28,0.5)',
  overlayLight: 'rgba(58,77,57,0.08)',
} as const;

export type ColorKey = keyof typeof Colors;
