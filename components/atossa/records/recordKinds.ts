// Records (Profile → Records, and record details opened from Timeline): kinds, labels and the
// display text for each record. All dates go through lib/records/format.ts, so approximate
// dates always read approximate ("Around April 2019"), never as a made-up exact day.
import type {
  AppointmentData, DatePrecision, HistoryData, HistoryType, MedicineData, Rec,
} from '../../../types/records';
import { parseKey } from '../../../lib/records/dates';
import { formatRecordDate, formatRecordDateInline, joinFacts } from '../../../lib/records/format';

/** Store kinds that are "records". */
export type RecordDataKind = 'medicine' | 'appointment' | 'history';
/** Route segment used by the Profile list screens: /(tabs)/profile/records/<slug>. */
export type RecordSlug = 'medicines' | 'appointments' | 'history';

export const HISTORY_TYPES: HistoryType[] = [
  'Told to me by a doctor', 'Test or scan', 'Procedure or surgery', 'Emergency visit',
  'Allergies (in my words)',
];
/** Onset phrases (written from the Today confirm row) are not a list item she adds by hand. */
export const PICKABLE_HISTORY_TYPES = HISTORY_TYPES.filter((t) => t !== 'When it started (in my words)');

import { ALLERGY_TYPE } from '../../../lib/records/summary';
export { ALLERGY_TYPE };

export const KIND_INFO: Record<RecordDataKind, {
  slug: RecordSlug;
  /** List screen title + the BackChevron label pointing at it. */
  listTitle: string;
  /** Detail screen title for an existing record. */
  title: string;
  /** Detail screen title for a new record. */
  newTitle: string;
  empty: string;
  addLabel: string;
  saved: string;
  deleted: string;
}> = {
  medicine: {
    slug: 'medicines', listTitle: 'Medicines', title: 'Medicine', newTitle: 'Add a medicine',
    empty: 'No medicines yet.', addLabel: 'Add a medicine', saved: 'Medicine saved.', deleted: 'Medicine deleted.',
  },
  appointment: {
    slug: 'appointments', listTitle: 'Appointments', title: 'Appointment', newTitle: 'Add an appointment',
    empty: 'No appointments yet.', addLabel: 'Add an appointment', saved: 'Appointment saved.', deleted: 'Appointment deleted.',
  },
  history: {
    slug: 'history', listTitle: 'Health history', title: 'Health history', newTitle: 'Add to health history',
    empty: 'No health history yet.', addLabel: 'Add to health history', saved: 'Saved to health history.', deleted: 'Entry deleted.',
  },
};

/**
 * Accepts the list slug ("medicines"), the store kind ("medicine") or Timeline's plural
 * ("appointments") — whatever a route passes. Unknown → null.
 */
export function toDataKind(raw: string | string[] | undefined): RecordDataKind | null {
  const v = (Array.isArray(raw) ? raw[0] : raw)?.toLowerCase();
  if (v === 'medicine' || v === 'medicines') return 'medicine';
  if (v === 'appointment' || v === 'appointments') return 'appointment';
  if (v === 'history' || v === 'health' || v === 'health-history') return 'history';
  return null;
}

export const firstParam = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? v[0] : v) ?? '';

// ---- display text -------------------------------------------------------------------------

/**
 * "Around April 2019" for a one-off (identical start/stop collapse),
 * "Started around June 2015 · Stopped around June 2016", "Started Thu 24 Sep".
 */
export function medicineDates(m: MedicineData): string {
  const started = formatRecordDateInline(m.started, m.startedPrecision);
  const stopped = formatRecordDateInline(m.stopped, m.stoppedPrecision);
  if (!started) return stopped ? `Stopped ${stopped}` : '';
  if (m.stopped && m.stopped === m.started && m.stoppedPrecision === m.startedPrecision) {
    return formatRecordDate(m.started, m.startedPrecision);
  }
  return joinFacts(`Started ${started}`, stopped ? `Stopped ${stopped}` : '');
}

export function recordTitle(kind: RecordDataKind, data: MedicineData | AppointmentData | HistoryData): string {
  if (kind === 'medicine') return (data as MedicineData).name?.trim() || 'Medicine';
  if (kind === 'appointment') return (data as AppointmentData).who?.trim() || 'Appointment';
  return (data as HistoryData).type || 'Health history';
}

/** The FactLine under a record's title in lists. */
export function recordFacts(kind: RecordDataKind, data: MedicineData | AppointmentData | HistoryData): string {
  if (kind === 'medicine') return joinFacts(medicineDates(data as MedicineData), (data as MedicineData).dose);
  if (kind === 'appointment') {
    const a = data as AppointmentData;
    return formatRecordDate(a.date, a.datePrecision);
  }
  // Health history: the category is the title, so lead the facts with the date and the first
  // thing Sam wrote ("Around March 2023 · MRI was clear") so similar rows can be told apart.
  const h = data as HistoryData;
  if (h.type === ALLERGY_TYPE) return (h.told ?? '').trim().split('\n')[0];
  const said = [h.told, h.done, h.result].map((t) => (t ?? '').trim()).find(Boolean) ?? '';
  return joinFacts(formatRecordDate(h.date, h.datePrecision), said.split('\n')[0]);
}

/** Sort key (newest first): the record's own date. Approximate dates sort by their placeholder day. */
export function recordSortKey(kind: RecordDataKind, data: MedicineData | AppointmentData | HistoryData): string {
  return kind === 'medicine' ? (data as MedicineData).started : (data as AppointmentData | HistoryData).date;
}

export function sortRecords<T extends MedicineData | AppointmentData | HistoryData>(kind: RecordDataKind, recs: Rec<T>[]): Rec<T>[] {
  return [...recs].sort((a, b) => (recordSortKey(kind, b.data) || '').localeCompare(recordSortKey(kind, a.data) || ''));
}

/**
 * Is date `a` before date `b`, compared only as finely as the coarser of the two precisions?
 * ("Around 2019" is not before "Thu 4 Apr 2019".)
 */
export function isBeforeAtPrecision(a: string, pa: DatePrecision, b: string, pb: DatePrecision): boolean {
  if (!a || !b) return false;
  const A = parseKey(a);
  const B = parseKey(b);
  if (pa === 'year' || pb === 'year') return A.y < B.y;
  if (pa === 'month' || pb === 'month') return A.y * 12 + A.m0 < B.y * 12 + B.m0;
  return a < b;
}
