import { TextStyle } from 'react-native';

/**
 * Typographic system — per-page scales.
 *
 * Each page has its own typographic rhythm tuned to what that page does:
 *
 *   Cycle      — dramatic & ceremonial. Biggest hero (42pt), tightest
 *                kerning, statement section heads. Brand showcase.
 *   Calendar   — almanac with many small objects (month, year, weekday,
 *                day, legend, hint). Hero scaled DOWN so the grid stars.
 *   Home       — conversational greeting. Medium hero. Suggestion cards
 *                use a slightly heavier card title so they're scannable.
 *   Health     — clinical-but-warm. Tightest scale, modest hero, smaller
 *                body to fit dense form/symptom data without overwhelming.
 *   Education  — reading-first. Biggest body (16pt) for article excerpts;
 *                literary hero (Medium italic, the one page that uses 500
 *                for the hero); article titles boosted for scannability.
 *   Profile    — quietest. Smallest hero. All text gentle, almost a
 *                letterhead.
 *
 * Across all pages:
 *   • Hierarchy = size + italic, never bold weight.
 *   • Body always uses Ink.primary (#2F2229, AAA on cream).
 *   • Tracking only on small uppercase. Tight kerning on display.
 *   • Line-height: display ~1.15-1.18, subhead ~1.35-1.40, body ~1.55-1.60.
 *   • Every accent verified WCAG AA on cream #FAF6F1.
 */

// ── Body ink palette ────────────────────────────────────────────────────────
const Ink = {
  primary:   '#2F2229',  // 12.0:1  (AAA)
  secondary: '#5C4B55',  //  6.8:1  (AA)
  muted:     '#7F6E78',  //  4.2:1  (AA large)
  faint:     '#A89BA1',  // decorative only
} as const;

// ── Per-page accent palette ─────────────────────────────────────────────────
const Accent = {
  home:      { deep: '#7A4A3D', soft: '#A37456' },  // terracotta
  cycle:     { deep: '#6B1F30', soft: '#A0455B' },  // bordeaux + cherry
  calendar:  { deep: '#5F4F6E', soft: '#876F8A' },  // editorial mauve
  health:    { deep: '#3F5A48', soft: '#5E7E62' },  // matcha
  education: { deep: '#4F3A52', soft: '#6F5F76' },  // aubergine
  profile:   { deep: '#3D3239', soft: '#7F6E78' },  // graphite
} as const;

// ── Common base styles ──────────────────────────────────────────────────────
const baseItalic = 'Fraunces_400Regular_Italic';
const baseRegular = 'Fraunces_400Regular';
const baseMedium  = 'Fraunces_500Medium';
const baseLight   = 'Fraunces_300Light';

// ============================================================================
//  CYCLE — dramatic & ceremonial
//  Scale ratio ~1.30. Tightest hero kerning. Statement section heads.
// ============================================================================
const cycle = {
  kicker:        { fontSize: 10,   fontFamily: baseLight,   color: Accent.cycle.soft, letterSpacing: 2.8 } as TextStyle,
  title:         { fontSize: 42,   lineHeight: 48, fontFamily: baseItalic, color: Accent.cycle.deep, letterSpacing: -0.6 } as TextStyle,
  section:       { fontSize: 22,   lineHeight: 30, fontFamily: baseItalic, color: Accent.cycle.deep, letterSpacing: -0.2 } as TextStyle,
  cardTitle:     { fontSize: 16,   lineHeight: 22, fontFamily: baseMedium,  color: Ink.primary } as TextStyle,
  body:          { fontSize: 14.5, lineHeight: 23, fontFamily: baseRegular, color: Ink.primary } as TextStyle,
  small:         { fontSize: 12.5, lineHeight: 19, fontFamily: baseRegular, color: Ink.secondary } as TextStyle,
  label:         { fontSize: 11,   lineHeight: 16, fontFamily: baseRegular, color: Ink.muted } as TextStyle,
  // Specialised roles for the Cycle screen:
  sectionLabel:  { fontSize: 9.5,  fontFamily: baseLight, color: Accent.cycle.soft, letterSpacing: 3 } as TextStyle,
  phaseLabel:    { fontSize: 20,   lineHeight: 26, fontFamily: baseItalic, color: Accent.cycle.deep } as TextStyle,
  phaseSubtitle: { fontSize: 12.5, lineHeight: 17, fontFamily: baseItalic, color: Ink.secondary } as TextStyle,
  chip:          { fontSize: 11,   fontFamily: baseRegular, color: Ink.primary } as TextStyle,
  statValue:     { fontSize: 30,   fontFamily: baseRegular, color: Ink.primary, letterSpacing: -0.6 } as TextStyle,
  statLabel:     { fontSize: 10.5, fontFamily: baseLight, color: Ink.muted, letterSpacing: 1.6 } as TextStyle,
} as const;

// ============================================================================
//  CALENDAR — almanac, many small typographic objects, grid is the star
//  Hero deliberately scaled DOWN. Months/days do the talking.
// ============================================================================
const calendar = {
  kicker:        { fontSize: 10,   fontFamily: baseLight,   color: Accent.calendar.soft, letterSpacing: 2.8 } as TextStyle,
  title:         { fontSize: 36,   lineHeight: 42, fontFamily: baseItalic, color: Accent.calendar.deep, letterSpacing: -0.3 } as TextStyle,
  section:       { fontSize: 19,   lineHeight: 26, fontFamily: baseItalic, color: Accent.calendar.deep } as TextStyle,
  cardTitle:     { fontSize: 15,   lineHeight: 21, fontFamily: baseMedium,  color: Ink.primary } as TextStyle,
  body:          { fontSize: 13,   lineHeight: 20, fontFamily: baseRegular, color: Ink.primary } as TextStyle,
  small:         { fontSize: 12,   lineHeight: 18, fontFamily: baseRegular, color: Ink.secondary } as TextStyle,
  label:         { fontSize: 11,   lineHeight: 16, fontFamily: baseRegular, color: Ink.muted } as TextStyle,
  legend:        { fontSize: 11.5, fontFamily: baseRegular, color: Ink.primary } as TextStyle,
  hintTitle:     { fontSize: 15,   fontFamily: baseItalic, color: Accent.calendar.deep, letterSpacing: -0.1 } as TextStyle,
} as const;

// ============================================================================
//  HOME — welcoming, conversational
//  Greeting reads as a sentence (32pt italic). Suggestion cards have
//  scannable cardTitles. Hero phase mid-size for warmth.
// ============================================================================
const home = {
  kicker:        { fontSize: 9.5,  fontFamily: baseLight,   color: Accent.home.soft, letterSpacing: 3 } as TextStyle,
  title:         { fontSize: 32,   lineHeight: 38, fontFamily: baseItalic, color: Accent.home.deep, letterSpacing: -0.3 } as TextStyle,
  section:       { fontSize: 18,   lineHeight: 25, fontFamily: baseItalic, color: Accent.home.deep } as TextStyle,
  cardTitle:     { fontSize: 15.5, lineHeight: 21, fontFamily: baseMedium,  color: Ink.primary } as TextStyle,
  body:          { fontSize: 14,   lineHeight: 22, fontFamily: baseRegular, color: Ink.primary } as TextStyle,
  small:         { fontSize: 12.5, lineHeight: 19, fontFamily: baseRegular, color: Ink.secondary } as TextStyle,
  label:         { fontSize: 11.5, lineHeight: 16, fontFamily: baseRegular, color: Ink.muted } as TextStyle,
  // Specialised:
  date:          { fontSize: 10.5, fontFamily: baseLight, color: Accent.home.soft, letterSpacing: 3 } as TextStyle,
  tagline:       { fontSize: 16,   lineHeight: 24, fontFamily: baseItalic, color: Ink.secondary } as TextStyle,
  heroPhase:     { fontSize: 24,   lineHeight: 30, fontFamily: baseItalic, color: Accent.home.deep, letterSpacing: -0.2 } as TextStyle,
  smallcaps:     { fontSize: 10.5, fontFamily: baseLight, color: Ink.muted, letterSpacing: 1.8 } as TextStyle,
  statValue:     { fontSize: 24,   fontFamily: baseRegular, color: Ink.primary, letterSpacing: -0.4 } as TextStyle,
  statLabel:     { fontSize: 10.5, fontFamily: baseLight, color: Ink.muted, letterSpacing: 1.4 } as TextStyle,
} as const;

// ============================================================================
//  HEALTH — clinical-but-warm. Tightest scale, room for dense data.
// ============================================================================
const health = {
  kicker:        { fontSize: 10,   fontFamily: baseLight,   color: Accent.health.soft, letterSpacing: 2.8 } as TextStyle,
  title:         { fontSize: 28,   lineHeight: 34, fontFamily: baseItalic, color: Accent.health.deep, letterSpacing: -0.2 } as TextStyle,
  section:       { fontSize: 16,   lineHeight: 22, fontFamily: baseItalic, color: Accent.health.deep } as TextStyle,
  cardTitle:     { fontSize: 14,   lineHeight: 19, fontFamily: baseMedium,  color: Ink.primary } as TextStyle,
  body:          { fontSize: 13.5, lineHeight: 21, fontFamily: baseRegular, color: Ink.primary } as TextStyle,
  small:         { fontSize: 12,   lineHeight: 17, fontFamily: baseRegular, color: Ink.secondary } as TextStyle,
  label:         { fontSize: 11,   lineHeight: 16, fontFamily: baseRegular, color: Ink.muted } as TextStyle,
  // Specialised:
  date:          { fontSize: 11.5, fontFamily: baseItalic, color: Accent.health.soft, letterSpacing: 0.6 } as TextStyle,
  bannerTitle:   { fontSize: 14.5, fontFamily: baseMedium, color: Ink.primary } as TextStyle,
  bannerDesc:    { fontSize: 12.5, lineHeight: 18, fontFamily: baseRegular, color: Ink.secondary } as TextStyle,
  metricValue:   { fontSize: 22,   fontFamily: baseRegular, color: Ink.primary, letterSpacing: -0.4 } as TextStyle,
  metricLabel:   { fontSize: 11,   fontFamily: baseLight, color: Ink.muted, letterSpacing: 1.4 } as TextStyle,
} as const;

// ============================================================================
//  EDUCATION — library, reading-first
//  Biggest body (16pt) so articles are pleasant to read. Article titles
//  get extra italic weight. Hero is the one place we use 500Medium italic.
// ============================================================================
const education = {
  kicker:        { fontSize: 10,   fontFamily: baseLight,   color: Accent.education.soft, letterSpacing: 2.8 } as TextStyle,
  title:         { fontSize: 34,   lineHeight: 40, fontFamily: 'Fraunces_500Medium_Italic', color: Accent.education.deep, letterSpacing: -0.3 } as TextStyle,
  section:       { fontSize: 21,   lineHeight: 28, fontFamily: baseItalic, color: Accent.education.deep } as TextStyle,
  cardTitle:     { fontSize: 18.5, lineHeight: 24, fontFamily: 'Fraunces_500Medium_Italic', color: Accent.education.deep, letterSpacing: -0.2 } as TextStyle,
  body:          { fontSize: 16,   lineHeight: 26, fontFamily: baseRegular, color: Ink.primary } as TextStyle,
  small:         { fontSize: 14,   lineHeight: 22, fontFamily: baseRegular, color: Ink.secondary } as TextStyle,
  label:         { fontSize: 12,   lineHeight: 17, fontFamily: baseRegular, color: Ink.muted } as TextStyle,
  // Specialised:
  category:      { fontSize: 10,   fontFamily: baseRegular, color: Accent.cycle.soft, letterSpacing: 2 } as TextStyle,
  meta:          { fontSize: 12,   fontFamily: baseItalic, color: Ink.muted } as TextStyle,
  heading1:      { fontSize: 24,   lineHeight: 32, fontFamily: 'Fraunces_500Medium_Italic', color: Accent.education.deep } as TextStyle,
  heading2:      { fontSize: 20,   lineHeight: 26, fontFamily: baseItalic, color: Accent.education.deep } as TextStyle,
  heading3:      { fontSize: 16,   lineHeight: 22, fontFamily: 'Fraunces_500Medium_Italic', color: Ink.primary } as TextStyle,
} as const;

// ============================================================================
//  PROFILE — quiet, minimal. Letterhead feel.
// ============================================================================
const profile = {
  kicker:        { fontSize: 9,    fontFamily: baseLight,   color: Accent.profile.soft, letterSpacing: 3.5 } as TextStyle,
  title:         { fontSize: 26,   lineHeight: 32, fontFamily: baseItalic, color: Accent.profile.deep, letterSpacing: -0.2 } as TextStyle,
  section:       { fontSize: 15,   lineHeight: 21, fontFamily: baseItalic, color: Accent.profile.deep } as TextStyle,
  cardTitle:     { fontSize: 13.5, fontFamily: baseMedium, color: Ink.primary } as TextStyle,
  body:          { fontSize: 13,   lineHeight: 20, fontFamily: baseRegular, color: Ink.primary } as TextStyle,
  small:         { fontSize: 12,   lineHeight: 17, fontFamily: baseRegular, color: Ink.secondary } as TextStyle,
  label:         { fontSize: 11,   lineHeight: 16, fontFamily: baseRegular, color: Ink.muted } as TextStyle,
  // Specialised:
  name:          { fontSize: 28,   lineHeight: 34, fontFamily: baseItalic, color: '#FFFFFF', letterSpacing: -0.3 } as TextStyle,
  email:         { fontSize: 13,   fontFamily: baseRegular, color: 'rgba(255,255,255,0.85)' } as TextStyle,
  memberSince:   { fontSize: 11,   fontFamily: baseItalic, color: 'rgba(255,255,255,0.75)' } as TextStyle,
  statValue:     { fontSize: 22,   fontFamily: baseRegular, color: Ink.primary, letterSpacing: -0.4 } as TextStyle,
  statLabel:     { fontSize: 10.5, fontFamily: baseLight, color: Ink.muted, letterSpacing: 1.4 } as TextStyle,
  sectionTitle:  { fontSize: 10,   fontFamily: baseLight, color: Accent.profile.soft, letterSpacing: 2.8 } as TextStyle,
  rowLabel:      { fontSize: 13,   fontFamily: baseRegular, color: Ink.secondary } as TextStyle,
  rowValue:      { fontSize: 13,   fontFamily: baseItalic, color: Ink.primary } as TextStyle,
} as const;

// ── Public Type table ───────────────────────────────────────────────────────
export const Type = { home, cycle, calendar, health, education, profile } as const;

// ── Specialised one-off roles (used by reusable components, not pages) ──────

/** Big day number in the cycle orb. Quiet warm-near-black; the one moment
 *  primary ink goes large. Lives on the glass sphere so it must read against
 *  a faintly tinted background. */
export const OrbDayNum: TextStyle = {
  fontSize: 76,
  lineHeight: 80,
  fontFamily: baseRegular,
  color: Ink.primary,
  letterSpacing: -2.5,
};

/** Phase chip inside the cycle orb (e.g., "Menstrual"). */
export const OrbPhase: TextStyle = {
  fontSize: 19,
  lineHeight: 24,
  fontFamily: baseItalic,
  color: Accent.cycle.deep,
  letterSpacing: -0.2,
};

/** Calendar month grid component — its own coordinates inside the system. */
export const CalendarMonth: TextStyle = {
  fontSize: 22,
  lineHeight: 28,
  fontFamily: baseItalic,
  color: Accent.calendar.deep,
  letterSpacing: -0.2,
};
export const CalendarYear: TextStyle = {
  fontSize: 11,
  fontFamily: baseRegular,
  color: Ink.muted,
  letterSpacing: 3,
};
export const CalendarWeekday: TextStyle = {
  fontSize: 10,
  fontFamily: baseRegular,
  color: Ink.muted,
  letterSpacing: 2.4,
};
export const CalendarDayText: TextStyle = {
  fontSize: 14,
  lineHeight: 18,
  fontFamily: baseRegular,
  color: Ink.primary,
};

export { Ink, Accent };
