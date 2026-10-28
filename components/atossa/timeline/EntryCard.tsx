// One Timeline entry (symptom note, bleeding day or run of days, appointment, medicine). Every
// card opens something: its own detail screen. Hierarchy (review 1, V11): a quiet caption top line
// (glyph + date), then the content (Sam's words in the serif, or a title), then facts led by the
// worst score as a SeverityTag (ramp colour + digit, never colour alone).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FactLine, GlyphLine, PressableCard, Quote, SeverityTag, Txt } from '../kit';
import type { IconName } from '../../ui/Icon';
import { colors, radii, space } from '../../../constants/atossaUI';
import { urgentSignpost } from '../../../lib/urgentWording';
import { textOf } from '../UrgentNote';
import { addDays, toKey, todayKey } from '../../../lib/records/dates';
import {
  BLEEDING_STATUS_LABEL, bleedingFacts, bleedingStatus, firstLine, formatDay, formatRange, formatRecordDate,
  formatRecordDateInline, formatWhere, labelEscape, typicalOf, worstOf,
} from '../../../lib/records/format';
import type { PeriodDayData, Rec, SymptomData } from '../../../types/records';
import type { ListItem } from './feed';

/**
 * "14:10" when the note was written on the day it's about (a back-dated note has no real time,
 * N12). Reads the capture's own stamp first (`data.time` "HH:MM" or `data.createdAt` ISO, written
 * by the capture lane), then the record's server `createdAt`. A note about today that was created
 * today counts too, which also covers the design preview's pinned "today".
 */
function isRecentDay(date: string): boolean {
  const today = todayKey();
  return date === today || date === addDays(today, -1);
}

function timeOf(rec: { createdAt?: string; data: object }, date: string): string {
  const own = rec.data as { time?: unknown; createdAt?: unknown };
  if (typeof own.time === 'string' && /^\d{1,2}:\d{2}$/.test(own.time)) return own.time.padStart(5, '0');
  const iso = typeof own.createdAt === 'string' ? own.createdAt : rec.createdAt;
  if (!iso) return '';
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '';
  const made = toKey(t.getFullYear(), t.getMonth(), t.getDate());
  const now = new Date();
  const madeToday = made === toKey(now.getFullYear(), now.getMonth(), now.getDate());
  if (made !== date && !(date === todayKey() && madeToday)) return '';
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
}


const symptomGlyph = (s: SymptomData): IconName => (s.source === 'voice' ? 'mic' : 'pen-line');

/** "Rough day" for a quick log; a note with no words otherwise reads "Note". Never a quote. */
const wordlessTitle = (s: SymptomData) => (s.source === 'quick' ? 'Rough day' : 'Note');

/** Keeps a short fact on one line ("9/10 at worst" never breaks as "9/10 at / worst"). */
const keep = (t: string) => t.replace(/ /g, '\u00A0');

/**
 * Card facts for a note. The leading number (worst, else usually) goes in the SeverityTag;
 * `tagWord` says which one it is. Where / strength escape answers carry their field name via
 * `labelEscape` ("Where: it varies · How strong: not sure", UX #12); "Skip" shows nothing.
 */
export function symptomCardFacts(s: SymptomData): { tag: number | null; tagWord: string; facts: string } {
  const worst = worstOf(s);
  const typical = typicalOf(s);
  const quick = s.source === 'quick';
  let tag: number | null = null;
  let tagWord = '';
  const strength: string[] = [];
  if (worst != null) {
    tag = worst;
    tagWord = quick ? '' : 'at worst';
    if (typical != null && !quick) strength.push(`${typical}/10 usually`);
  } else if (typical != null) {
    tag = typical;
    tagWord = 'usually';
  }
  if (s.strengthText) strength.push(labelEscape('How strong', s.strengthText));

  const whereRaw = formatWhere(s);
  const where = !whereRaw || whereRaw === 'Skip' ? '' : labelEscape('Where', whereRaw);

  const facts = [where, ...strength.map(keep)].filter(Boolean).join(' · ');
  return { tag, tagWord, facts };
}

/** Medicine dates: "Started around April 2019 · Stopped around June 2016" (stop only when it differs). */
export function medicineDates(started: string, sp: ListItem['precision'], stopped: string, stp: ListItem['precision']): string {
  const start = formatRecordDateInline(started, sp);
  if (!start) return '';
  const stop = stopped ? formatRecordDateInline(stopped, stp) : '';
  if (!stop) return `Started ${start}`;
  if (stop === start) return `Started and stopped ${start}`;
  return `Started ${start} · Stopped ${stop}`;
}

/** "Period · 21–26 Aug" title + "Medium, Heavy" (distinct flows in order, None skipped). */
export function runSummary(days: Rec<PeriodDayData>[]): { title: string; range: string; flows: string } {
  const allSpotting = days.every((d) => bleedingStatus(d.data) === 'spotting');
  const flows: string[] = [];
  for (const d of days) {
    const f = d.data.flow;
    if (f && f !== 'None' && !flows.includes(f)) flows.push(f);
  }
  return {
    title: allSpotting ? BLEEDING_STATUS_LABEL.spotting : 'Period',
    range: formatRange(days[0].data.date, days[days.length - 1].data.date),
    flows: flows.join(', '),
  };
}

export function EntryCard({
  item, onPress, hideDate = false,
}: {
  item: ListItem;
  onPress: () => void;
  /** Inside the DaySheet the sheet title already names the day — don't repeat it on every card. */
  hideDate?: boolean;
}) {
  switch (item.kind) {
    case 'symptom': {
      const s = item.rec.data;
      const words = firstLine(s);
      const { tag, tagWord, facts } = symptomCardFacts(s);
      // Only for notes from today or yesterday (Safety ruling): a 999 line on an older entry is noise.
      const urgent = isRecentDay(s.date) ? urgentSignpost(textOf(s)) : null;
      const kindWord = s.source === 'voice' ? 'Voice note' : s.source === 'quick' ? 'Rough day' : 'Note';
      const time = timeOf(item.rec, s.date);
      const top = hideDate ? (time || kindWord) : [formatDay(s.date), time].filter(Boolean).join(' · ');
      const strengthA11y = tag != null ? `${tag} out of 10${tagWord ? ` ${tagWord}` : ''}` : '';
      return (
        <PressableCard
          onPress={onPress}
          accessibilityLabel={[kindWord, hideDate ? '' : top, item.rec.pending ? 'Saved on this phone, will send when you are online' : '', words, strengthA11y, facts, urgent ?? ''].filter(Boolean).join('. ')}
          accessibilityHint="Opens the note"
        >
          <View style={styles.stack}>
            <GlyphLine icon={symptomGlyph(s)} text={top} />
            {item.rec.pending ? <GlyphLine icon="clock" text="Saved on this phone · will send when you’re online" /> : null}
            {words ? <Quote numberOfLines={2}>{words}</Quote> : <Txt variant="headline">{wordlessTitle(s)}</Txt>}
            {tag != null || facts ? (
              // The severity words sit INSIDE the pill ("9/10 at worst", N7); long facts wrap below it
              <View style={styles.facts}>
                {tag != null ? <SeverityTag value={tag} suffix={keep(`/10${tagWord ? ` ${tagWord}` : ''}`)} /> : null}
                {facts ? (
                  <Txt variant="secondary" numberOfLines={3} style={styles.factText}>{facts}</Txt>
                ) : null}
              </View>
            ) : null}
            {urgent ? (
              <View style={styles.urgent}>
                <Txt variant="secondary" style={{ color: colors.ink2 }}>{urgent}</Txt>
              </View>
            ) : null}
          </View>
        </PressableCard>
      );
    }
    case 'bleeding': {
      const d = item.rec.data;
      const title = bleedingFacts(d);
      const day = formatDay(d.date);
      const note = (d.note ?? '').trim(); // Sam's own words for the day → a Quote
      const a11y = [hideDate ? title : `${title}. ${day}`, note].filter(Boolean).join('. ');
      return (
        <PressableCard edge="clay" style={styles.clayInset} onPress={onPress} accessibilityLabel={a11y} accessibilityHint="Opens this bleeding day">
          <View style={styles.stack}>
            <GlyphLine icon="droplet" clay text={hideDate ? 'Bleeding' : day} />
            <Txt variant="headline">{title}</Txt>
            {note ? <Quote numberOfLines={2}>{note}</Quote> : null}
          </View>
        </PressableCard>
      );
    }
    case 'bleedingRun': {
      const { title, range, flows } = runSummary(item.days);
      const n = item.days.length;
      return (
        <PressableCard
          edge="clay"
          style={styles.clayInset}
          onPress={onPress}
          accessibilityLabel={[`${title}, ${range}`, `${n} days logged`, flows].filter(Boolean).join('. ')}
          accessibilityHint="Shows these days"
        >
          <View style={styles.stack}>
            <GlyphLine icon="droplet" clay text={`${range} · ${n} days`} />
            <Txt variant="headline">{title}</Txt>
            <FactLine parts={[flows]} />
          </View>
        </PressableCard>
      );
    }
    case 'appointment': {
      const a = item.rec.data;
      const when = formatRecordDate(a.date, item.precision);
      const who = a.who?.trim() || 'Appointment';
      const told = a.told?.trim();
      const stackDate = who.length + when.length > 26;
      return (
        <PressableCard
          style={styles.appointment}
          onPress={onPress}
          accessibilityLabel={[`Appointment, ${who}`, hideDate ? '' : when, told ? `I was told: ${told}` : ''].filter(Boolean).join('. ')}
          accessibilityHint="Opens the appointment"
        >
          <View style={styles.stack}>
            {/* One line, on a tinted card, so an appointment never reads as one more note. */}
            {/* Long name + date: the date goes on its own line instead of leaving a dot at the end of line one. */}
            <GlyphLine icon="calendar-days" variant="secondary" text={hideDate ? who : stackDate ? who : `${who} · ${keep(when)}`} />
            {!hideDate && stackDate ? <Txt variant="secondary">{when}</Txt> : null}
            {told ? <Txt variant="secondary" numberOfLines={2}>{`I was told: ${told}`}</Txt> : null}
          </View>
        </PressableCard>
      );
    }
    case 'medicine': {
      const m = item.rec.data;
      const when = formatRecordDate(m.started, item.precision);
      const dates = medicineDates(m.started, item.precision, m.stopped, m.stoppedPrecision ?? 'exact');
      const name = [m.name?.trim() || 'Medicine', m.dose?.trim()].filter(Boolean).join(' ');
      return (
        <PressableCard
          onPress={onPress}
          accessibilityLabel={[`Medicine, ${name}`, dates, m.helped ? `Did it help? ${m.helped}` : ''].filter(Boolean).join('. ')}
          accessibilityHint="Opens the medicine"
        >
          <View style={styles.stack}>
            <GlyphLine icon="pill" text={hideDate ? 'Medicine' : when} />
            <Txt variant="headline">{name}</Txt>
            <FactLine parts={[dates, m.helped ? `Did it help? ${m.helped}` : '']} />
          </View>
        </PressableCard>
      );
    }
  }
}

const styles = StyleSheet.create({
  stack: { gap: space.xs },
  // Same words and place; a quiet rule instead of a filled box so her own words get the first read (Safety OK pending before a hosted build).
  urgent: { borderLeftWidth: 2, borderLeftColor: colors.plum, paddingLeft: space.sm },
  facts: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: space.xs, rowGap: space.xs },
  factText: { flexShrink: 1, minWidth: 0 },
  // N11: the 4 pt clay edge sits inside the card's own padding, so bleeding content lines up
  // with every other card (x 41, not 45).
  clayInset: { paddingLeft: space.lg },
  appointment: { backgroundColor: colors.plumTint, borderColor: colors.plumTint },
});
