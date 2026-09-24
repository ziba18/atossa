import type { DatePrecision } from '../../types/records';

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

export function todayKey(): string {
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

export function formatRecordDate(key: string, precision: DatePrecision): string {
  if (!key) return 'Not entered';
  const { y, m0 } = parseKey(key);
  if (precision === 'year') return `Around ${y}`;
  if (precision === 'month') return `Around ${MONTH_NAMES[m0]} ${y}`;
  return formatDate(key);
}

export function isFuture(key: string): boolean {
  return Boolean(key) && key > todayKey();
}

/** Short day + month for the header, e.g. "24 Sep". */
export function headerDate(): string {
  const { m0, d } = parseKey(todayKey());
  return `${d} ${MONTH_NAMES[m0].slice(0, 3)}`;
}
