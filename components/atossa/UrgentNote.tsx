// The fixed 999 / 111 line under a free-text field, shown on the phone with no network when the words
// look urgent (same lists as the capture sheet; see lib/urgentWording.ts). Never says what is wrong.
import React from 'react';
import { Card, Txt } from './kit';
import { urgentSignpost } from '../../lib/urgentWording';
import { isHistoryDate } from '../../lib/records/dates';

/** `text` may be one string or every text value of a record; empty or ordinary text renders nothing.
 *  `date` is the day the record is about: older than yesterday it is history, not how she is now, so no line
 *  (same rule as the Timeline card). No date, a future date or a month-only date still checks the words. */
export function UrgentNote({ text, date, precision }: { text: string; date?: string; precision?: string }) {
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && isHistoryDate(date, precision)) return null;
  const line = urgentSignpost(text);
  if (!line) return null;
  return (
    <Card tone="sunken">
      <Txt accessibilityRole="alert">{line}</Txt>
    </Card>
  );
}

/** Joins the string values of a record so one banner covers all its text fields. */
export const textOf = (d: object): string =>
  Object.values(d).filter((v): v is string => typeof v === 'string').join('. ');
