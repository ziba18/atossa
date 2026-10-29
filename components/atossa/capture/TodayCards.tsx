// Today's building blocks: hero capture card, starter chips, Rough day quick log, latest note.
// No stat tiles, rings, streaks or charts — the screen's one number is the note count.
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Button, Card, Chip, FactLine, HeroNumber, InlineError, QuickTile, PressableCard, Quote, SeverityRow, SeverityTag, Txt, showToast, useReduceMotion,
} from '../kit';
import { colors, layout, radii, severityRamp, space } from '../../../constants/atossaUI';
import { openCapture } from '../../../lib/captureStore';
import { haptics } from '../../../lib/haptics';
import { todayKey } from '../../../lib/records/dates';
import { STARTER_CHIPS } from '../../../lib/records/fields';
import {
  compareNotesNewestFirst, formatDay, formatTimeOfDay, formatWhere, joinFacts, labelEscape, noteCount, noteStamp, noteWrittenAt, notesLabel,
  typicalOf, worstOf,
} from '../../../lib/records/format';
import { useRecordsStore } from '../../../stores/recordsStore';
import type { Rec, SymptomData } from '../../../types/records';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onsetWords } from '../../../lib/records/onset';
import { ONSET_GROUP_LABEL, ONSET_TYPE, onsetFromHistory, onsetGroupFor } from '../../../lib/records/summary';
import { MicButton } from './MicButton';
import { nextAppointment } from './AppointmentCard';
import { type IconName } from '../../ui/Icon';
import { MONTH_NAMES, addDays, diffDays, parseKey } from '../../../lib/records/dates';

const PROMPT = 'What’s been going on with your body?';

export function HeroCard() {
  return (
    <Card tone="hero" style={styles.hero}>
      <Txt variant="hero" style={styles.center} accessibilityRole="header" aria-level={2} accessibilityLabel={PROMPT}>
        {PROMPT}
      </Txt>
      {Platform.OS === 'web' ? (
        // Browsers have no voice capture here: lead with the typed note instead of a mic that opens the Type tab.
        <Button label="Type a note" onPress={() => openCapture({ mode: 'type' })} style={{ marginTop: space.md, alignSelf: 'stretch' }} />
      ) : (
        <>
          <View style={styles.heroMic}>
            <MicButton
              invite
              onPress={() => openCapture({ mode: 'speak', startRecording: true })}
              accessibilityLabel="Tap to talk"
              accessibilityHint="Opens a new note and starts recording"
            />
            {/* The primary action's label outranks the secondary link (V7). */}
            <Txt variant="headline" style={styles.micLabel} aria-hidden>
              Tap to talk
            </Txt>
          </View>
          <Button label="Type instead" variant="text" small onPress={() => openCapture({ mode: 'type' })} style={{ marginTop: space.xxs }} />
        </>
      )}
    </Card>
  );
}

/** Horizontal starter chips that scroll inside the screen (right-edge fade); the page never scrolls sideways. */
export function StarterChips({ onPeriod }: { onPeriod: () => void }) {
  return (
    <View style={styles.chipsWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        accessibilityLabel="Ways to start"
      >
        {STARTER_CHIPS.map((label) => (
          <Chip
            key={label}
            label={label}
            onPress={() => (label === 'My period' ? onPeriod() : openCapture({ mode: 'speak', tag: label }))}
          />
        ))}
      </ScrollView>
      <LinearGradient
        colors={[`${colors.canvas}00`, `${colors.canvas}E6`, colors.canvas]}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.fade, { pointerEvents: 'none' }]}
      />
    </View>
  );
}

export function RoughDayCard() {
  const create = useRecordsStore((s) => s.create);
  const [value, setValue] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (value == null || saving) return;
    setSaving(true);
    setError('');
    try {
      const saved = await create('symptom', {
        date: todayKey(), words: '', where: '', typical: null, worst: value, score: value,
        duration: '', stopped: null, stoppedWords: '', source: 'quick', createdAt: noteStamp(todayKey()),
      });
      haptics.success();
      setValue(null);
      showToast(saved.pending ? 'Saved on this phone. It will save to your account when you’re back online.' : `Saved. ${notesLabel(noteCount(useRecordsStore.getState().records.symptom))} ready for your doctor.`);
    } catch {
      setError("That didn’t save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ gap: space.md }}>
      <View style={{ gap: space.xxs }}>
        <Txt variant="headline" accessibilityRole="header" aria-level={2}>Rough day?</Txt>
        <Txt variant="secondary">Just the number is enough.</Txt>
      </View>
      <SeverityRow value={value} onChange={setValue} label="How rough, from 0 to 10" showLabel={false} />
      <InlineError message={error} />
      {/* Disabled = sunken + ink2; once a number is chosen it is clearly the action (UX #23). */}
      <Button label="Save" onPress={save} disabled={value == null} loading={saving} />
    </Card>
  );
}

/** Most recent symptom note (by date, then by when it was saved). */
export function latestNote(symptoms: Rec<SymptomData>[]): Rec<SymptomData> | undefined {
  return [...symptoms].sort(compareNotesNewestFirst)[0];
}

/** First run: what a saved note will look like here, clearly marked as an example. */
export function GhostNoteCard() {
  return (
    <View style={styles.ghost} accessible accessibilityLabel="Example of a saved note. Sharp low belly pain since Tuesday, worse in the evening. 7 out of 10 at worst. Your notes will appear here.">
      <Txt variant="caption">Example · your notes will appear here</Txt>
      <View style={{ opacity: 0.85 }} aria-hidden>
        <Quote numberOfLines={2}>Sharp low belly pain since Tuesday, worse in the evening.</Quote>
        <View style={[styles.factRow, { marginTop: space.sm }]}>
          <SeverityTag value={7} suffix="/10 at worst" />
          <Txt variant="secondary">Lower belly</Txt>
        </View>
      </View>
    </View>
  );
}

export function LatestNoteCard({ note }: { note: Rec<SymptomData> }) {
  const router = useRouter();
  const s = note.data;
  const words = (s.words ?? '').trim();
  const worst = worstOf(s);
  const quick = s.source === 'quick';
  // Same reading as Timeline's EntryCard (N7): the worst value leads as a SeverityTag with its
  // words inside the pill, then where / an escape answer on the same line.
  const suffix = quick || typicalOf(s) == null ? '/10' : '/10 at worst';
  const facts = joinFacts(
    labelEscape('Where', formatWhere(s)),
    s.strengthText ? labelEscape('How strong', s.strengthText) : '',
  );
  const time = formatTimeOfDay(noteWrittenAt(note));
  const date = joinFacts(formatDay(s.date), time);
  const strength = worst != null ? `${worst}/10${suffix === '/10' ? '' : ' at worst'}` : '';
  return (
    <PressableCard
      onPress={() => router.push(`/(tabs)/timeline/entry/${note.id}?from=Today` as any)}
      accessibilityLabel={`Your latest note, ${date}. ${words || 'Rough day'}. ${joinFacts(strength, facts)}`}
      accessibilityHint="Opens the note"
    >
      <View style={{ gap: space.sm }}>
        {/* Non-breaking spaces keep the date together, so at 320 it wraps before it rather than orphaning the time. */}
        <Txt variant="caption">{`Your latest note · ${date.replace(/ /g, '\u00A0')}`}</Txt>
        {words ? <Quote numberOfLines={4}>{words}</Quote> : <Txt variant="headline">Rough day</Txt>}
        {worst != null || facts ? (
          <View style={styles.factRow}>
            {worst != null ? <SeverityTag value={worst} suffix={suffix} /> : null}
            {facts ? <View style={{ flex: 1, minWidth: 110 }}><FactLine parts={[facts]} numberOfLines={2} /></View> : null}
          </View>
        ) : null}
      </View>
    </PressableCard>
  );
}

const ONSET_SKIP_KEY = 'atossa.onsetSkipped';

/**
 * One quiet row under the latest note when it holds a "since …" phrase. Her words, verbatim, are saved as
 * when this started only if she says so; "Not now" is remembered on this phone and never asks again for the note.
 */
export function OnsetConfirmRow({ note }: { note: Rec<SymptomData> }) {
  const create = useRecordsStore((s) => s.create);
  const history = useRecordsStore((s) => s.records.history);
  const [skipped, setSkipped] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    AsyncStorage.getItem(ONSET_SKIP_KEY).then((v) => setSkipped(v ? JSON.parse(v) : [])).catch(() => setSkipped([]));
  }, []);
  const phrase = onsetWords(note.data.words ?? '');
  const group = onsetGroupFor(note.data);
  if (!phrase || !group || skipped == null || skipped.includes(note.id) || onsetFromHistory(history)[group]) return null;
  const skip = () => {
    const next = [...skipped, note.id].slice(-50);
    setSkipped(next);
    AsyncStorage.setItem(ONSET_SKIP_KEY, JSON.stringify(next)).catch(() => {});
  };
  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await create('history', { type: ONSET_TYPE, date: todayKey(), datePrecision: 'exact', told: phrase, done: group, result: '' });
      haptics.success();
      showToast('Saved. It will show on your doctor summary in your words.');
    } catch {
      setError("That didn’t save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <View style={styles.onset} accessible={false}>
      <Txt variant="body">{`Save “${phrase}” as when your ${ONSET_GROUP_LABEL[group]} started?`}</Txt>
      <Txt variant="caption">It goes on your doctor summary in your words. You can delete it under Health history.</Txt>
      <InlineError message={error} />
      <View style={styles.onsetActions}>
        <Button label="Save" small onPress={save} loading={saving} />
        <Button label="Not now" variant="text" small onPress={skip} disabled={saving} />
      </View>
    </View>
  );
}

/** Counts up to `target` once on first show (about half a second); straight to the number under Reduce Motion. */
export function useCountUp(target: number): number {
  const reduce = useReduceMotion();
  const [n, setN] = useState(reduce ? target : 0);
  useEffect(() => {
    if (reduce || target <= 1) { setN(target); return; }
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / 500);
      setN(Math.round(target * (1 - (1 - t) * (1 - t))));
      if (t >= 1) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [target, reduce]);
  return n;
}

/** The screen's one big number: days to the next appointment, else notes in the last 7 days. */
export function HeroNumberCard() {
  const router = useRouter();
  const symptoms = useRecordsStore((s) => s.records.symptom);
  const appts = useRecordsStore((s) => s.records.appointment);
  const today = todayKey();
  const next = nextAppointment(appts);
  const total = noteCount(symptoms);
  const week = noteCount(symptoms, { from: addDays(today, -6), to: today });
  const noteDays = new Set(symptoms.map((x) => x.data.date)).size;
  const daysAway = next ? diffDays(today, next.data.date) : -1;
  // Blueprint 3.3: an appointment inside 60 days leads; past that a count reads as noise, so the notes lead and the date rides in the caption.
  const soon = next && daysAway >= 0 && daysAway <= 60;
  const who = next?.data.who.trim() ?? '';
  const apptDate = next ? parseKey(next.data.date) : null;
  let target = ''; let hint = ''; let bigN = 0; let line = ''; let sub = '';
  if (soon && daysAway === 0) {
    bigN = total; target = '/(tabs)/doctor'; hint = 'Opens For my doctor';
    line = total === 1 ? 'note ready for today’s appointment' : 'notes ready for today’s appointment';
    const tail = total > 0 ? 'Opens your summary' : 'Add a note and it appears in your summary';
    sub = who ? `${who} · ${tail}` : tail;
  } else if (soon) {
    bigN = daysAway; target = '/(tabs)/doctor'; hint = 'Opens For my doctor';
    line = daysAway === 1 ? 'day until your appointment' : 'days until your appointment';
    const notes = total > 0 ? `${notesLabel(total)} ready for your summary` : 'Add a note and it appears in your summary';
    sub = who ? `${who} · ${notes}` : notes;
  } else if (week > 0) {
    bigN = week; target = '/(tabs)/timeline'; hint = 'Opens Timeline';
    line = week === 1 ? 'note in the last 7 days' : 'notes in the last 7 days';
    sub = total === week ? 'Open them in your Timeline' : `${noteDays} ${noteDays === 1 ? 'day' : 'days'} with a note in all`;
  } else if (total > 0) {
    bigN = noteDays; target = '/(tabs)/timeline'; hint = 'Opens Timeline';
    line = noteDays === 1 ? 'day with a note so far' : 'days with a note so far';
    sub = `${notesLabel(total)} in all. Open your Timeline`;
  }
  if (next && !soon && apptDate) sub += ` · Appointment ${apptDate.d} ${MONTH_NAMES[apptDate.m0]}`;
  const count = useCountUp(bigN);
  // First run: a big "0" says nothing, so the card is one plain sentence instead of a number.
  if (!soon && total === 0) {
    return (
      <Card style={{ gap: space.xxs }}>
        <Txt variant="headline">Nothing saved yet</Txt>
        <Txt variant="secondary">Your first note starts your record.{next && apptDate ? ` Appointment ${apptDate.d} ${MONTH_NAMES[apptDate.m0]}.` : ''}</Txt>
      </Card>
    );
  }
  return (
    <HeroNumber
      big={String(count)} line={line} sub={sub}
      onPress={() => router.push(target as any)}
      accessibilityHint={hint}
    />
  );
}

/** Short phones (320x568): the same number as HeroNumberCard as one line above the prompt, so the appointment signal is not pushed off the first screen. */
const QUICK_ROWS: { label: string; icon: IconName; tag?: string }[] = [
  { label: 'Pain', icon: 'zap', tag: 'Pain today' },
  { label: 'Bleeding', icon: 'droplet' },
  { label: 'Tummy, bowel or bladder', icon: 'activity', tag: 'Tummy, bowel or bladder' },
  { label: 'Tired', icon: 'moon', tag: 'Tired' },
  { label: 'Mood', icon: 'heart', tag: 'Mood' },
  { label: 'Skin or hair', icon: 'sparkles', tag: 'Skin or hair' },
  { label: 'Something new', icon: 'plus', tag: 'Something new' },
];

/** Icon + label tiles, two across (replace the four outline chips); each opens a note already started on that topic. */
export function QuickRows({ onPeriod }: { onPeriod: () => void }) {
  return (
    <View style={styles.qgrid}>
      {QUICK_ROWS.map((r) => (
        <QuickTile
          key={r.label}
          label={r.label}
          icon={r.icon}
          onPress={() => (r.label === 'Bleeding' ? onPeriod() : openCapture({ mode: 'speak', tag: r.tag }))}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingVertical: space.xs, paddingHorizontal: space.md, alignItems: 'flex-start', marginBottom: space.sm },
  chipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: space.sm },
  ramp: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 18 },
  qgrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  hero: { paddingTop: space.lg, paddingBottom: space.lg, paddingHorizontal: space.lg, alignItems: 'flex-start' },
  center: { textAlign: 'left' },
  onset: { gap: space.xs, padding: space.md, borderRadius: radii.card, backgroundColor: colors.plumTint },
  onsetActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm, marginTop: space.xs },
  ghost: { gap: space.sm, padding: space.md, borderRadius: radii.card, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.hairline },
  heroMic: { alignItems: 'center', marginTop: space.xl, gap: space.sm },
  micLabel: { textAlign: 'center' },
  chipsWrap: { marginHorizontal: -layout.gutter },
  chipsRow: { flexDirection: 'row', gap: space.xs, paddingHorizontal: layout.gutter, paddingRight: layout.gutter + space.xxl },
  fade: { position: 'absolute', top: 0, bottom: 0, right: 0, width: space.xxl },
  factRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.xs },
});
