import { TextStyle } from 'react-native';

/**
 * Per-page typography themes.
 *
 * Each tab/screen has its own "voice" — a coordinated palette of font
 * weights, italic/roman mix, colors, and sizes. Emphasis comes from
 * color contrast and italic variation, not from bold weight (the whole
 * app deliberately uses no SemiBold or heavier).
 *
 * Naming convention: `Type.{page}.{role}`
 *   - kicker  → small all-caps eyebrow above the title
 *   - title   → page hero heading
 *   - section → mid-size accents inside the page
 *   - body    → standard reading text
 *   - label   → small labels/captions
 */

type Role = 'kicker' | 'title' | 'section' | 'body' | 'label';
type PageThemeMap = Record<Role, TextStyle> & Record<string, TextStyle>;

// ── Soft text-color palette ─────────────────────────────────────────────────
// Avoid near-black ink anywhere — every page picks a colored ink that
// matches its mood. Each value sits between 60% and 75% saturation on
// the warm side of the wheel so they harmonise with the cream background.
const Ink = {
  bordeauxDeep: '#7A2A3D',  // deep romantic rose (cycle hero)
  cherrySoft:   '#B0455A',  // primary rose accent
  apricot:      '#C49B89',  // dusty rose / amber (home accents)
  terracotta:   '#8B5C4A',  // warm earthy (home titles)
  sage:         '#4F6F54',  // deep matcha (health)
  sageSoft:     '#7A9C7E',  // softer sage accents
  mauveDeep:    '#7C6E89',  // editorial mauve (calendar, education hero)
  mauveSoft:    '#A89AB5',  // softer mauve (calendar months)
  plum:         '#3F2F4A',  // the only "near-ink" tone — reserved for big day numbers
  warmGrey:     '#6B5560',  // body text
  mutedMauve:   '#9C8590',  // captions
} as const;

// ── HOME — "Morning Salon" ──────────────────────────────────────────────────
// Warm amber + terracotta. The greeting sets a welcoming tone.
const home: PageThemeMap = {
  kicker:  { fontSize: 9,  fontFamily: 'Fraunces_300Light',        color: Ink.apricot,       letterSpacing: 4.5 },
  title:   { fontSize: 32, fontFamily: 'Fraunces_400Regular_Italic', color: Ink.terracotta,   lineHeight: 38 },
  tagline: { fontSize: 17, fontFamily: 'Fraunces_400Regular_Italic', color: Ink.apricot,      lineHeight: 23 },
  section: { fontSize: 11, fontFamily: 'Fraunces_300Light',        color: Ink.terracotta,   letterSpacing: 2.5 },
  body:    { fontSize: 14, fontFamily: 'Fraunces_400Regular',      color: Ink.warmGrey,     lineHeight: 21 },
  label:   { fontSize: 11, fontFamily: 'Fraunces_400Regular_Italic', color: Ink.mutedMauve },
};

// ── CYCLE — "Pulse / Romance" ───────────────────────────────────────────────
// Deep bordeaux + cherry. Largest hero on the app, italic with tight kerning.
const cycle: PageThemeMap = {
  kicker:  { fontSize: 10, fontFamily: 'Fraunces_300Light',        color: Ink.cherrySoft,   letterSpacing: 5 },
  title:   { fontSize: 44, fontFamily: 'Fraunces_400Regular_Italic', color: Ink.bordeauxDeep, lineHeight: 50, letterSpacing: -0.8 },
  section: { fontSize: 9.5, fontFamily: 'Fraunces_300Light',       color: Ink.cherrySoft,   letterSpacing: 3.5 },
  body:    { fontSize: 14, fontFamily: 'Fraunces_400Regular',      color: Ink.warmGrey,     lineHeight: 21 },
  label:   { fontSize: 11, fontFamily: 'Fraunces_400Regular',      color: Ink.mutedMauve },
  // Cycle-specific: the big day number inside the orb is the one place
  // we use plum (near-ink) at large size, so it reads as a numeral
  // monument rather than a tinted word.
  dayNum:  { fontSize: 78, fontFamily: 'Fraunces_400Regular',      color: Ink.plum },
};

// ── CALENDAR — "Almanac" ────────────────────────────────────────────────────
// Editorial mauve. Year set in tracked Roman caps for that magazine feel.
const calendar: PageThemeMap = {
  kicker:  { fontSize: 10,  fontFamily: 'Fraunces_300Light',        color: Ink.mauveDeep,   letterSpacing: 4.5 },
  title:   { fontSize: 40,  fontFamily: 'Fraunces_400Regular_Italic', color: Ink.mauveDeep, lineHeight: 46 },
  section: { fontSize: 9.5, fontFamily: 'Fraunces_300Light',        color: Ink.mauveSoft,   letterSpacing: 3 },
  body:    { fontSize: 13,  fontFamily: 'Fraunces_400Regular',      color: Ink.warmGrey },
  label:   { fontSize: 11,  fontFamily: 'Fraunces_400Regular',      color: Ink.mutedMauve },
  month:   { fontSize: 28,  fontFamily: 'Fraunces_400Regular_Italic', color: Ink.mauveSoft, lineHeight: 32 },
  year:    { fontSize: 11,  fontFamily: 'Fraunces_400Regular',      color: Ink.mutedMauve,  letterSpacing: 4 },
  weekday: { fontSize: 9,   fontFamily: 'Fraunces_300Light',        color: Ink.mauveSoft,   letterSpacing: 2.5 },
  day:     { fontSize: 14,  fontFamily: 'Fraunces_400Regular',      color: Ink.plum },
};

// ── HEALTH — "Field Notebook" ───────────────────────────────────────────────
// Sage greens. Balanced, grounded. Section labels italic for warmth.
const health: PageThemeMap = {
  kicker:  { fontSize: 10, fontFamily: 'Fraunces_300Light',        color: Ink.sage,         letterSpacing: 4 },
  title:   { fontSize: 36, fontFamily: 'Fraunces_400Regular_Italic', color: Ink.sage,       lineHeight: 42 },
  section: { fontSize: 13, fontFamily: 'Fraunces_400Regular_Italic', color: Ink.sageSoft },
  body:    { fontSize: 14, fontFamily: 'Fraunces_400Regular',      color: Ink.warmGrey,     lineHeight: 21 },
  label:   { fontSize: 11, fontFamily: 'Fraunces_400Regular',      color: Ink.mutedMauve },
  date:    { fontSize: 11, fontFamily: 'Fraunces_400Regular_Italic', color: Ink.sageSoft,   letterSpacing: 1 },
};

// ── EDUCATION — "Library" ───────────────────────────────────────────────────
// Slightly heavier here (500Medium_Italic for hero) — gives a literary
// weight that contrasts with the lighter Cycle/Calendar headings.
const education: PageThemeMap = {
  kicker:   { fontSize: 10, fontFamily: 'Fraunces_300Light',        color: Ink.mauveSoft,   letterSpacing: 4 },
  title:    { fontSize: 38, fontFamily: 'Fraunces_500Medium_Italic', color: Ink.mauveDeep,  lineHeight: 44 },
  section:  { fontSize: 11, fontFamily: 'Fraunces_400Regular',      color: Ink.bordeauxDeep, letterSpacing: 2 },
  body:     { fontSize: 15, fontFamily: 'Fraunces_400Regular',      color: Ink.warmGrey,    lineHeight: 24 },
  label:    { fontSize: 11, fontFamily: 'Fraunces_400Regular',      color: Ink.mutedMauve },
  category: { fontSize: 10, fontFamily: 'Fraunces_400Regular',      color: Ink.cherrySoft,  letterSpacing: 2 },
  article:  { fontSize: 22, fontFamily: 'Fraunces_500Medium_Italic', color: Ink.bordeauxDeep, lineHeight: 28 },
};

// ── PROFILE — "Letterhead" ──────────────────────────────────────────────────
// Quietest of all. Plum + warmGrey. Roman, not italic, for the
// information-dense rows. Italic reserved for the section dividers.
const profile: PageThemeMap = {
  kicker:  { fontSize: 10, fontFamily: 'Fraunces_300Light',        color: Ink.mutedMauve, letterSpacing: 4 },
  title:   { fontSize: 30, fontFamily: 'Fraunces_400Regular_Italic', color: Ink.plum,     lineHeight: 36 },
  section: { fontSize: 14, fontFamily: 'Fraunces_400Regular_Italic', color: Ink.mauveDeep, letterSpacing: 0.5 },
  body:    { fontSize: 14, fontFamily: 'Fraunces_400Regular',      color: Ink.warmGrey },
  label:   { fontSize: 11, fontFamily: 'Fraunces_300Light',        color: Ink.mutedMauve, letterSpacing: 1.5 },
};

export const Type = { home, cycle, calendar, health, education, profile } as const;
export { Ink };
