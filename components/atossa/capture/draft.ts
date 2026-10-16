// The in-progress note inside the capture sheet, and how it turns into a saved SymptomData.
// Unanswered = null / empty everywhere; nothing is ever defaulted.
import { noteStamp, realImpacts } from '../../../lib/records/format';
import type { CaptureSource, StrengthText, SymptomData } from '../../../types/records';
import type { Answered } from './infer';

export interface Draft {
  date: string;
  /** Sam's own words (typed or transcribed). The only text shown in quotes. */
  words: string;
  zones: string[];
  /** Free "where": her own words, or 'Not sure' / 'It varies'. */
  whereText: string;
  typical: number | null;
  worst: number | null;
  strengthText: StrengthText | null;
  /** "When" — period timing: a WHEN_OPTIONS value, her own timing phrase, or 'Not sure' / 'It varies'. */
  when: string;
  /** "How long" — her words for how long it's been going on ("Since Tuesday"). Never mixed into `when`. */
  duration: string;
  /** What she has tried, in her words. */
  tried: string;
  /** IMPACT_OPTIONS values, her own phrase, or ['Not sure'] / ['It varies']. */
  impacts: string[];
  /** Her own words for what got in the way (from "Type or say something else"). */
  stoppedWords: string;
}

export const emptyDraft = (date: string): Draft => ({
  date, words: '', zones: [], whereText: '', typical: null, worst: null, strengthText: null,
  when: '', duration: '', tried: '', impacts: [], stoppedWords: '',
});

export const ESCAPES = ['Not sure', 'It varies'] as const;
export const isEscape = (v: string) => (ESCAPES as readonly string[]).includes(v);

export function answeredOf(d: Draft): Answered {
  return {
    strength: d.typical != null || d.worst != null || d.strengthText != null,
    where: d.zones.length > 0 || d.whereText.trim() !== '',
    when: d.when.trim() !== '',
    impact: d.impacts.length > 0,
  };
}

/** Anything worth asking "Keep this note?" about. */
export function hasContent(d: Draft): boolean {
  const a = answeredOf(d);
  return d.words.trim() !== '' || a.strength || a.where || a.when || a.impact
    || d.duration.trim() !== '' || d.tried.trim() !== '';
}

// ---- tidy display values (each shown once, never quoted) ----------------------------------

export function whereLabel(d: Draft): string {
  return [d.zones.join(', '), d.whereText.trim()].filter(Boolean).join(' · ');
}

export function strengthLabel(d: Pick<Draft, 'typical' | 'worst' | 'strengthText'>): string {
  return [
    d.typical != null ? `${d.typical}/10 usually` : '',
    d.worst != null ? `${d.worst}/10 at worst` : '',
    d.strengthText ?? '',
  ].filter(Boolean).join(' · ');
}

/** "Nothing today" reads "Nothing that day" on a back-dated note. */
export function impactLabel(v: string, past: boolean): string {
  return past && v === 'Nothing today' ? 'Nothing that day' : v;
}

export function impactsLabel(d: Draft, past: boolean): string {
  return d.impacts.map((i) => impactLabel(i, past)).join(' · ');
}

// ---- save ---------------------------------------------------------------------------------

export function toSymptom(d: Draft, source: CaptureSource, tag?: string): SymptomData {
  const where = whereLabel(d);
  const base: SymptomData = {
    date: d.date,
    words: d.words.trim(),
    where,
    typical: d.typical,
    worst: d.worst,
    score: d.worst, // older builds read `score` as "at worst"
    duration: d.duration.trim(),
    stopped: null,
    stoppedWords: d.stoppedWords.trim(),
    source,
  };
  if (d.strengthText) base.strengthText = d.strengthText;
  if (d.zones.length) base.zones = [...d.zones];
  if (d.whereText.trim()) base.whereText = d.whereText.trim();
  if (d.tried.trim()) base.tried = d.tried.trim();
  if (d.when.trim()) base.when = d.when.trim();
  if (d.impacts.length) {
    base.impacts = [...d.impacts];
    // Unanswered stays null; "Nothing today" / Not sure / It varies are answers but not impacts.
    base.stopped = realImpacts(base).length > 0 ? true : d.impacts.includes('Nothing today') ? false : null;
  }
  if (tag) base.tag = tag;
  // When it was written (same-day notes only) — Timeline shows "· 15:10", the GP page sorts by it (N12).
  const stamp = noteStamp(d.date);
  if (stamp) base.createdAt = stamp;
  return base;
}
