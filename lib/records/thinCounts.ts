// First-week rules 7 and 8 (pm/prd/first-week-states.md; Safety run57 C98 rows 10-12): under 7 written days a row of
// zeros reads as 'mild' to a GP, and ranked bars invent a pattern from too few days. Pure, so every screen and the A4
// use the same cut-off. Counts and her own words only; never a cause or a condition name.

/** Written days needed before zero counts and ranked bars are shown. */
export const THIN_DAYS = 7;

export interface CountRow {
  label: string;
  days: number;
}

export interface ThinView {
  thin: boolean;
  /** 'N day(s) written so far' when thin; '' otherwise (the normal header stays). */
  line: string;
  /** Thin: only the non-zero rows, in the order given (not ranked). Normal: every row as given. */
  rows: CountRow[];
  /** Thin: plain list, no ranked or coloured bars. */
  bars: boolean;
  /** Thin and there is something to list: one line saying when bars appear. */
  barsNote: string;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function thinView(daysWritten: number, rows: CountRow[]): ThinView {
  const n = Math.max(0, Math.floor(daysWritten));
  if (n >= THIN_DAYS) return { thin: false, line: '', rows, bars: true, barsNote: '' };
  const kept = n === 0 ? [] : rows.filter((r) => r.days > 0);
  return {
    thin: true,
    line: n === 0 ? '' : `${plural(n, 'day')} written so far`,
    rows: kept,
    bars: false,
    barsNote: kept.length ? `Bars appear after ${THIN_DAYS} written days` : '',
  };
}
