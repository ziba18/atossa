import {
  parseISO,
  differenceInDays,
  addDays,
  format,
  isAfter,
  isBefore,
  isWithinInterval,
  startOfDay,
} from 'date-fns';

export const toDate = (dateStr: string): Date => parseISO(dateStr);
export const toDateStr = (date: Date): string => format(date, 'yyyy-MM-dd');
export const today = (): string => toDateStr(new Date());

export function daysBetween(a: string, b: string): number {
  return differenceInDays(toDate(b), toDate(a));
}

export function addDaysToStr(dateStr: string, days: number): string {
  return toDateStr(addDays(toDate(dateStr), days));
}

export function isDateAfter(dateStr: string, referenceStr: string): boolean {
  return isAfter(toDate(dateStr), toDate(referenceStr));
}

export function isDateBefore(dateStr: string, referenceStr: string): boolean {
  return isBefore(toDate(dateStr), toDate(referenceStr));
}

export function isDateInRange(dateStr: string, startStr: string, endStr: string): boolean {
  return isWithinInterval(startOfDay(toDate(dateStr)), {
    start: startOfDay(toDate(startStr)),
    end: startOfDay(toDate(endStr)),
  });
}

export function formatDisplayDate(dateStr: string): string {
  return format(toDate(dateStr), 'MMMM d, yyyy');
}

export function formatShortDate(dateStr: string): string {
  return format(toDate(dateStr), 'MMM d');
}

export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - avg, 2));
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1));
}

export function weightedAverage(values: number[], weights: number[]): number {
  const weightedSum = values.reduce((sum, v, i) => sum + v * (weights[i] ?? 1), 0);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  return weightedSum / totalWeight;
}
