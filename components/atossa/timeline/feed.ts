// Turns the records store into Timeline feed items: merged, reverse-chronological, grouped.
// Approximate dates (appointments / medicines "Around April 2019") are grouped by month or year,
// never into a made-up exact week.
import type {
  AppointmentData, DatePrecision, MedicineData, PeriodDayData, Rec, SymptomData,
} from '../../../types/records';
import { MONTH_NAMES, addDays, mondayOf, parseKey, toKey } from '../../../lib/records/dates';
import { noteSortTime, weekLabel } from '../../../lib/records/format';
import { wordMentions } from '../../../lib/records/counts';
import type { TimelineFilter } from './session';

export type FeedItem =
  | { kind: 'symptom'; key: string; date: string; precision: 'exact'; sort: string; rec: Rec<SymptomData> }
  | { kind: 'bleeding'; key: string; date: string; precision: 'exact'; sort: string; rec: Rec<PeriodDayData> }
  | { kind: 'appointment'; key: string; date: string; precision: DatePrecision; sort: string; rec: Rec<AppointmentData> }
  | { kind: 'medicine'; key: string; date: string; precision: DatePrecision; sort: string; rec: Rec<MedicineData> };

/**
 * List-only: consecutive bleeding days shown as one card ("Period · 21–26 Aug"). `date` = the
 * FIRST day, so the run sits under the week it started in (N13), not the week it ended.
 */
export interface BleedingRunItem {
  kind: 'bleedingRun';
  key: string;
  date: string;
  start: string;
  precision: 'exact';
  sort: string;
  /** Oldest first. */
  days: Rec<PeriodDayData>[];
}

export type ListItem = FeedItem | BleedingRunItem;

export interface FeedSources {
  symptom: Rec<SymptomData>[];
  period_day: Rec<PeriodDayData>[];
  appointment: Rec<AppointmentData>[];
  medicine: Rec<MedicineData>[];
}

export function buildFeed(src: FeedSources): FeedItem[] {
  const items: FeedItem[] = [
    ...src.symptom.map((rec) => ({
      kind: 'symptom' as const, key: `s-${rec.id}`, date: rec.data.date, precision: 'exact' as const, sort: noteSortTime(rec), rec,
    })),
    ...src.period_day.map((rec) => ({
      kind: 'bleeding' as const, key: `b-${rec.id}`, date: rec.data.date, precision: 'exact' as const, sort: '', rec,
    })),
    ...src.appointment.map((rec) => ({
      kind: 'appointment' as const, key: `a-${rec.id}`, date: rec.data.date, precision: rec.data.datePrecision ?? 'exact', sort: rec.createdAt ?? '', rec,
    })),
    ...src.medicine.map((rec) => ({
      kind: 'medicine' as const, key: `m-${rec.id}`, date: rec.data.started, precision: rec.data.startedPrecision ?? 'exact', sort: rec.createdAt ?? '', rec,
    })),
  ].filter((i) => Boolean(i.date));
  // Newest first; same day: later first (notes by `noteSortTime`, the same order as Today's latest note).
  return items.sort((a, b) => b.date.localeCompare(a.date) || b.sort.localeCompare(a.sort));
}

const FILTER_KIND: Record<Exclude<TimelineFilter, 'All' | 'Bowel or bladder' | 'Tiredness'>, FeedItem['kind']> = {
  Symptoms: 'symptom',
  Bleeding: 'bleeding',
  Appointments: 'appointment',
  Medicines: 'medicine',
};

/**
 * Bleeding runs: consecutive logged days → [oldest … newest]. Single days stay single.
 * Used by the List (one card per run) and the run screen.
 */
export function bleedingRuns(days: Rec<PeriodDayData>[]): Rec<PeriodDayData>[][] {
  const sorted = [...days].filter((d) => Boolean(d.data.date)).sort((a, b) => a.data.date.localeCompare(b.data.date));
  const runs: Rec<PeriodDayData>[][] = [];
  for (const d of sorted) {
    const last = runs[runs.length - 1];
    const prev = last?.[last.length - 1];
    if (prev && addDays(prev.data.date, 1) === d.data.date) last.push(d);
    else if (prev && prev.data.date === d.data.date) continue; // duplicate day: keep the first
    else runs.push([d]);
  }
  return runs;
}

/** List view: replaces runs of 2+ consecutive bleeding days with one run item at the run's first day. */
export function mergeBleedingRuns(feed: FeedItem[]): ListItem[] {
  const runs = bleedingRuns(feed.flatMap((i) => (i.kind === 'bleeding' ? [i.rec] : [])));
  const runOf = new Map<string, Rec<PeriodDayData>[]>();
  for (const run of runs) if (run.length > 1) for (const d of run) runOf.set(d.id, run);
  const out: ListItem[] = [];
  for (const item of feed) {
    if (item.kind !== 'bleeding') { out.push(item); continue; }
    const run = runOf.get(item.rec.id);
    if (!run) { out.push(item); continue; }
    // Shown once, at its first day: the feed is newest first, so it lands where the period began.
    if (item.rec.id !== run[0].id) continue;
    out.push({
      kind: 'bleedingRun', key: `r-${run[0].id}`, date: run[0].data.date, start: run[0].data.date,
      precision: 'exact', sort: '', days: run,
    });
  }
  return out;
}

/** Symptom notes that belong to an area chip. Tiredness is her own words (a word count, never a tag). */
export function inArea(i: FeedItem, filter: 'Bowel or bladder' | 'Tiredness'): boolean {
  if (i.kind !== 'symptom') return false;
  const s = i.rec.data;
  return filter === 'Tiredness'
    ? wordMentions([s], 'tired').notes > 0
    : s.bowelPain === true || s.urinePain === true || (s.zones ?? []).includes('Bottom');
}

export function filterFeed(feed: FeedItem[], filter: TimelineFilter): FeedItem[] {
  if (filter === 'All') return feed;
  if (filter === 'Bowel or bladder' || filter === 'Tiredness') return feed.filter((i) => inArea(i, filter));
  const kind = FILTER_KIND[filter];
  return feed.filter((i) => i.kind === kind);
}

export const EMPTY_FILTER_TEXT: Record<Exclude<TimelineFilter, 'All'>, string> = {
  Symptoms: 'No symptom notes yet.',
  Bleeding: 'No bleeding logged yet.',
  Appointments: 'No appointments yet.',
  Medicines: 'No medicines yet.',
  'Bowel or bladder': 'No notes about this yet.',
  Tiredness: 'No notes mention feeling tired yet.',
};

export interface FeedGroup {
  key: string;
  label: string;
  items: ListItem[];
}

/** Exact dates → their week ("This week", "27 Jul–2 Aug"); approximate → "April 2019" / "2019". */
function groupOf(item: ListItem): { key: string; label: string } {
  const { y, m0 } = parseKey(item.date);
  if (item.precision === 'year') return { key: `y:${y}`, label: String(y) };
  if (item.precision === 'month') return { key: `m:${toKey(y, m0, 1)}`, label: `${MONTH_NAMES[m0]} ${y}` };
  const monday = mondayOf(item.date);
  return { key: `w:${monday}`, label: weekLabel(monday) };
}

/** Groups in feed order (feed must already be sorted newest first). Empty weeks simply don't appear. */
export function groupFeed(feed: ListItem[]): FeedGroup[] {
  const groups: FeedGroup[] = [];
  const byKey = new Map<string, FeedGroup>();
  for (const item of feed) {
    const g = groupOf(item);
    let group = byKey.get(g.key);
    if (!group) {
      group = { key: g.key, label: g.label, items: [] };
      byKey.set(g.key, group);
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

/** Items that belong on one calendar day (DaySheet). Approximate-date records never do. */
export function itemsOnDay(feed: FeedItem[], day: string): FeedItem[] {
  return feed.filter((i) => i.precision === 'exact' && i.date === day);
}
