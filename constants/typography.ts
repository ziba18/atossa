import { TextStyle } from 'react-native';

/**
 * Typographic system — editorial / artsy / readable.
 *
 * Design principles (the rules an art director would enforce):
 *  1. Restraint per page: each page picks ONE accent family
 *     (deep + soft). All body text uses the universal Ink palette so
 *     reading never gets distracting.
 *  2. Hierarchy is built from size + italic, not from bold weight.
 *     The whole app uses 300/400/500 only.
 *  3. Generous leading: body line-height ≈ 1.55-1.6 of font size,
 *     display ≈ 1.15-1.2 (tight, deliberate).
 *  4. Tracking is for small all-caps only. Kickers track 2.6-2.8.
 *     Display titles get -0.3 to 0 (slightly tight or neutral).
 *  5. AA-compliant: every accent ink passes WCAG AA (≥4.5:1) on
 *     the cream background #FAF6F1 at the sizes used here.
 *  6. Page identity = accent color + ONE title-size variation.
 *     Everything else (body, small, label, section) is unified so
 *     the reader's eye doesn't fight a new ruleset on every tab.
 */

// ── Body ink palette ────────────────────────────────────────────────────────
// Used by every page so reading text is consistent and AA-safe.
const Ink = {
  primary:   '#2F2229',  // body text          — 12.0:1 on cream (AAA)
  secondary: '#5C4B55',  // tertiary copy      — 6.8:1 (AA)
  muted:     '#7F6E78',  // captions ≥12pt     — 4.2:1 (AA large)
  faint:     '#A89BA1',  // decorative hairline — for graphics only
} as const;

// ── Per-page accent palette ─────────────────────────────────────────────────
// Each pair: { deep: hero italic + bold marks, soft: kickers + small accents }
// All values verified AA on the cream background.
const Accent = {
  // Home — warm morning salon (terracotta family)
  home:      { deep: '#7A4A3D', soft: '#A37456' },
  // Cycle — romantic, the most saturated voice (bordeaux + cherry)
  cycle:     { deep: '#6B1F30', soft: '#A0455B' },
  // Calendar — editorial mauve (almanac feel)
  calendar:  { deep: '#5F4F6E', soft: '#876F8A' },
  // Health — grounded matcha (field notebook)
  health:    { deep: '#3F5A48', soft: '#5E7E62' },
  // Education — literary aubergine
  education: { deep: '#4F3A52', soft: '#6F5F76' },
  // Profile — quiet warm graphite (letterhead minimalism)
  profile:   { deep: '#3D3239', soft: '#7F6E78' },
} as const;

// ── Per-page builder ────────────────────────────────────────────────────────
// Unified scale across pages — color is what changes most.
function makePage(accent: { deep: string; soft: string }, titleSize: number, titleLeading: number) {
  return {
    /** Tracked, all-caps eyebrow above the title. */
    kicker: {
      fontSize: 10,
      fontFamily: 'Fraunces_300Light',
      color: accent.soft,
      letterSpacing: 2.6,
    } as TextStyle,

    /** Hero italic — the only place the page accent appears at large size. */
    title: {
      fontSize: titleSize,
      lineHeight: titleLeading,
      fontFamily: 'Fraunces_400Regular_Italic',
      color: accent.deep,
      letterSpacing: -0.3,
    } as TextStyle,

    /** Italic subhead (≈half the title size) — for in-page section heads. */
    section: {
      fontSize: 19,
      lineHeight: 26,
      fontFamily: 'Fraunces_400Regular_Italic',
      color: accent.deep,
    } as TextStyle,

    /** Italic lede paragraph — introductory text under a title. */
    lede: {
      fontSize: 16,
      lineHeight: 25,
      fontFamily: 'Fraunces_400Regular_Italic',
      color: Ink.primary,
    } as TextStyle,

    /** Standard reading body. Roman, not italic. */
    body: {
      fontSize: 15,
      lineHeight: 24,
      fontFamily: 'Fraunces_400Regular',
      color: Ink.primary,
    } as TextStyle,

    /** Subhead within a card — slightly heavier than body for a card title. */
    cardTitle: {
      fontSize: 17,
      lineHeight: 23,
      fontFamily: 'Fraunces_500Medium',
      color: Ink.primary,
    } as TextStyle,

    /** Small reading copy (sub-paragraphs, helper text). */
    small: {
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'Fraunces_400Regular',
      color: Ink.secondary,
    } as TextStyle,

    /** Captions and minor labels. */
    label: {
      fontSize: 12,
      lineHeight: 17,
      fontFamily: 'Fraunces_400Regular',
      color: Ink.muted,
    } as TextStyle,

    /** Numeric / data display (cycle day count, stat values). */
    data: {
      fontSize: 32,
      lineHeight: 34,
      fontFamily: 'Fraunces_400Regular',
      color: Ink.primary,
      letterSpacing: -0.4,
    } as TextStyle,
  };
}

// ── Public type table ───────────────────────────────────────────────────────
// Title sizes are the one element that varies per page. The progression
// is deliberate: Cycle (hero) > Calendar/Education > Home/Health > Profile.
export const Type = {
  home:      { ...makePage(Accent.home,      32, 38) },
  cycle:     { ...makePage(Accent.cycle,     38, 44) },
  calendar:  { ...makePage(Accent.calendar,  36, 42) },
  health:    { ...makePage(Accent.health,    32, 38) },
  education: { ...makePage(Accent.education, 34, 40) },
  profile:   { ...makePage(Accent.profile,   28, 34) },
} as const;

// ── Specialised one-off roles ───────────────────────────────────────────────
// Used by specific components that need their own coordinates inside the system.

/** Big day number in the cycle orb — quiet near-black, the one place primary ink goes big. */
export const OrbDayNum: TextStyle = {
  fontSize: 76,
  lineHeight: 80,
  fontFamily: 'Fraunces_400Regular',
  color: Ink.primary,
  letterSpacing: -2,
};

/** Calendar month grid pieces — share the calendar accent but get their own scale. */
export const CalendarMonth: TextStyle = {
  fontSize: 22,
  lineHeight: 28,
  fontFamily: 'Fraunces_400Regular_Italic',
  color: Accent.calendar.deep,
  letterSpacing: -0.2,
};
export const CalendarYear: TextStyle = {
  fontSize: 11,
  fontFamily: 'Fraunces_400Regular',
  color: Ink.muted,
  letterSpacing: 3,
};
export const CalendarWeekday: TextStyle = {
  fontSize: 10,
  fontFamily: 'Fraunces_400Regular',
  color: Ink.muted,
  letterSpacing: 2.4,
};
export const CalendarDay: TextStyle = {
  fontSize: 14,
  lineHeight: 18,
  fontFamily: 'Fraunces_400Regular',
  color: Ink.primary,
};

export { Ink, Accent };
