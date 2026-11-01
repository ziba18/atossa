import type { IconName } from '../../ui/Icon';
import { nextAppointment } from '../capture/AppointmentCard';
import { ALLERGY_TYPE, recordTitle, sortRecords, type RecordDataKind } from './recordKinds';
import { formatRecordDateInline, formatShortDate } from '../../../lib/records/format';
import type { useRecordsStore } from '../../../stores/recordsStore';

export const RECORD_KINDS: RecordDataKind[] = ['medicine', 'appointment', 'history'];
export const RECORD_ICONS: Record<RecordDataKind, IconName> = { medicine: 'pill', appointment: 'calendar', history: 'file-text' };

/** One line under a Records row: the newest item (or the next appointment), so the row says something before it is opened. */
export function previewLine(kind: RecordDataKind, records: ReturnType<typeof useRecordsStore.getState>['records']): string | undefined {
  if (kind === 'appointment') {
    const next = nextAppointment(records.appointment);
    if (next) return `Next: ${formatShortDate(next.data.date)}${next.data.who.trim() ? ` · ${next.data.who.trim()}` : ''}`;
  }
  // An allergy line is a standing statement, not a dated event: it never leads the 'Latest' preview.
  const sorted = sortRecords(kind, (records[kind] as any[]).filter((r) => r.data.type !== ALLERGY_TYPE && r.data.type !== 'When it started (in my words)'));
  // A medicine still being taken leads the row; otherwise the newest one.
  const current = kind === 'medicine' ? sorted.find((r: any) => !r.data.stopped) : undefined;
  const newest = current ?? sorted[0];
  if (!newest) return kind === 'history' && records.history.some((r) => r.data.type === ALLERGY_TYPE) ? 'Allergies in your words' : undefined;
  const d = newest.data as any;
  const date = formatRecordDateInline(kind === 'medicine' ? d.started : d.date, kind === 'medicine' ? d.startedPrecision : d.datePrecision);
  const title = recordTitle(kind, d);
  return `${current ? 'Current' : 'Latest'}: ${title.length > 24 ? `${title.slice(0, 23).trimEnd()}…` : title}${date ? ` · ${kind === 'medicine' ? `${current ? 'since' : 'started'} ` : ''}${date}` : ''}`;
}
