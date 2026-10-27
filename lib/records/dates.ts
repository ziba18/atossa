import type { DatePrecision } from '../../types/records';
import { IS_PREVIEW, PREVIEW_TODAY } from '../preview/flag';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const pad = (n: number) => String(n).padStart(2, '0');

export function toKey(year: number, month0: number, day: number): string {
  return `${year}-${pad(month0 + 1)}-${pad(day)}`;
}

export function parseKey(key: string): { y: number; m0: number; d: number } {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m0: (m || 1) - 1, d: d || 1 };
}

/**
 * Today's date key. The ONLY source of "today" in the app — never call `new Date()` for it,
 * because design-preview mode pins today to 2026-09-24 to match the seeded persona.
 */
export function todayKey(): string {
  if (IS_PREVIEW) {
    // Design preview only: /doctor?today=2026-09-18 shows the days-before-the-appointment states.
    const q = typeof window !== 'undefined' ? /[?&]today=(\d{4}-\d{2}-\d{2})\b/.exec(window.location?.search ?? '') : null;
    return q ? q[1] : PREVIEW_TODAY;
  }
  const n = new Date();
  return toKey(n.getFullYear(), n.getMonth(), n.getDate());
}

function utcMs(key: string): number {
  const { y, m0, d } = parseKey(key);
  return Date.UTC(y, m0, d);
}

export function addDays(key: string, n: number): string {
  const t = new Date(utcMs(key) + n * 86_400_000);
  return toKey(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
}

export function diffDays(from: string, to: string): number {
  return Math.round((utcMs(to) - utcMs(from)) / 86_400_000);
}

export function inclusiveDays(start: string, end: string): number {
  return diffDays(start, end) + 1;
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

/** 0 = Monday … 6 = Sunday, for the first day of the month. */
export function firstWeekdayOffset(year: number, month0: number): number {
  return (new Date(Date.UTC(year, month0, 1)).getUTCDay() + 6) % 7;
}

export function formatDate(key: string, short = false): string {
  const { y, m0, d } = parseKey(key);
  const month = short ? MONTH_NAMES[m0].slice(0, 3) : MONTH_NAMES[m0];
  return `${d} ${month} ${y}`;
}

/** Legacy long form ("24 September 2026" for exact). New UI uses `formatRecordDate` in ./format. */
export function formatRecordDate(key: string, precision: DatePrecision): string {
  if (!key) return 'Not entered';
  const { y, m0 } = parseKey(key);
  if (precision === 'year') return `Around ${y}`;
  if (precision === 'month') return `Around ${MONTH_NAMES[m0]} ${y}`;
  return formatDate(key);
}

/** Monday (date key) of the week containing `key`. */
export function mondayOf(key: string): string {
  const { y, m0, d } = parseKey(key);
  const dow = (new Date(Date.UTC(y, m0, d)).getUTCDay() + 6) % 7;
  return addDays(key, -dow);
}

export function isFuture(key: string): boolean {
  return Boolean(key) && key > todayKey();
}

/** Short day + month for the header, e.g. "24 Sep". */
export function headerDate(): string {
  const { m0, d } = parseKey(todayKey());
  return `${d} ${MONTH_NAMES[m0].slice(0, 3)}`;
}
