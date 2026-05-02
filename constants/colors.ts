// ─────────────────────────────────────────────────────────────────────────────
// Atossa Design System — cycle-bloom palette
// Matcha · Rose · Sky · Cream · Ink · Lavender · Apricot
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // ── Matcha (primary brand — sage green) ───────────────────────────────────
  cherry: '#4E9E5A',            // matcha-deep — primary CTA, active states
  cherryLight: '#8DC98F',       // matcha — lighter sage
  cherryLighter: '#EBF5EB',     // soft sage tinted backgrounds, chips
  cherryDark: '#3A7A44',        // deep sage — gradients

  // ── Ink surfaces (dark overlays) ──────────────────────────────────────────
  bordeaux: '#333244',          // ink — deep blue-gray overlays
  bordeauxMid: '#FAF8F2',       // maps to background in light mode
  bordeauxLight: '#FEFEFE',     // maps to elevated surface

  // ── Lavender (accent) ─────────────────────────────────────────────────────
  gold: '#9B88C4',              // muted lavender accent
  goldLight: '#C4B5D9',         // lighter lavender
  goldLighter: '#F0EDF8',       // lavender tinted bg
  goldDark: '#7A6EAA',          // deep lavender text

  // ── Cream (backgrounds) ───────────────────────────────────────────────────
  cream: '#FAF7EF',             // warm cream bg
  creamDark: '#F2EFE4',         // slightly deeper cream

  // ── Sage Green (secondary / follicular) ───────────────────────────────────
  forest: '#4E9E5A',            // sage green (= matcha-deep)
  forestDark: '#FFFFFF',        // tab bar background (white)
  forestMuted: '#8DC98F',       // light sage
  forestLighter: '#EBF5EB',     // sage tinted bg

  // ── Rose (mapped to rose-deep for phase/status) ───────────────────────────
  whiskey: '#CB7575',           // rose-deep
  whiskeyLight: '#EDCACA',
  whiskeyLighter: '#FAF0F0',
  whiskeyDark: '#A85A5A',

  // ── Emerald ───────────────────────────────────────────────────────────────
  emerald: '#5BA571',
  emeraldLight: '#8DC9A0',
  emeraldLighter: '#E8F5EE',
  emeraldDark: '#3D8055',

  // ── Silver ────────────────────────────────────────────────────────────────
  silver: '#E0DCF0',
  silverDark: '#B0A8C8',

  // ── Backgrounds ───────────────────────────────────────────────────────────
  background: '#FAF8F2',        // warm cream
  backgroundDark: '#1E1C2E',
  surface: '#FFFFFF',
  surfaceDark: '#252338',
  surfaceElevated: '#FEFEFE',
  surfaceElevatedDark: '#2D2B42',

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary: '#333244',       // ink — dark blue-gray
  textPrimaryDark: '#F0EEF8',
  textSecondary: '#5C5A70',     // ink/60
  textSecondaryDark: '#A8A6C0',
  textMuted: '#8A889E',         // ink/40
  textMutedDark: '#6E6C88',

  // ── Borders ───────────────────────────────────────────────────────────────
  border: 'rgba(51,50,68,0.10)',
  borderStrong: 'rgba(51,50,68,0.20)',
  borderDark: 'rgba(240,238,248,0.12)',

  // ── Cycle phase colours ───────────────────────────────────────────────────
  menstrual: '#CB7575',         // rose-deep
  predictedPeriod: '#FAF0F0',   // soft rose tint
  follicular: '#8DC98F',        // matcha
  ovulation: '#EDD1A0',         // apricot
  luteal: '#BBCFE8',            // sky

  // ── Direct brand palette references ──────────────────────────────────────
  matcha: '#8DC98F',
  matchaDeep: '#4E9E5A',
  rose: '#EDCACA',
  roseDeep: '#CB7575',
  sky: '#BBCFE8',
  skyDeep: '#68A2C8',
  ink: '#333244',
  lavender: '#D5ABE0',
  apricot: '#EDD1A0',

  // ── Status ────────────────────────────────────────────────────────────────
  success: '#5BA571',
  warning: '#E8C87A',
  error: '#CB7575',
  info: '#68A2C8',

  // ── Severity scale (pain slider) ─────────────────────────────────────────
  severity1: '#5BA571',   // low — green
  severity4: '#D4AD62',   // moderate — apricot
  severity7: '#CB7575',   // high — rose
  severity10: '#A84040',  // severe — deep red

  // ── Translucent glass surfaces (overridden in dark theme) ────────────────
  glassBg: 'rgba(255,255,255,0.72)',          // hero / main glass card
  glassBgSoft: 'rgba(255,255,255,0.65)',      // stat tiles, alert card
  glassBgSubtle: 'rgba(255,255,255,0.5)',     // small tiles
  glassBgFaint: 'rgba(255,255,255,0.25)',     // chips on coloured banners
  glassBorder: 'rgba(51,50,68,0.08)',         // glass card border

  // ── Utility ───────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(51,50,68,0.5)',
  overlayLight: 'rgba(78,158,90,0.06)',
} as const;

export type ColorKey = keyof typeof Colors;
