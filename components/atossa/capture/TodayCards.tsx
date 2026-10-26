// Today's building blocks: hero capture card, starter chips, Rough day quick log, latest note.
// No stat tiles, rings, streaks or charts — the screen's one number is the note count.
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Button, Card, Chip, FactLine, InlineError, PressableCard, Quote, SeverityRow, SeverityTag, Txt, showToast,
} from '../kit';
import { colors, layout, space } from '../../../constants/atossaUI';
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
import { MicButton } from './MicButton';
import { nextAppointment } from './AppointmentCard';
import { Icon, type IconName } from '../../ui/Icon';
import { addDays, diffDays } from '../../../lib/records/dates';

// Warm wash (V6): a faint plum-tint blush at the very top that settles into the warm canvas,
// then white — the hero is never cooler than the paper around it. Top 40% only.
const WASH = [`${colors.plumTint}80`, `${colors.canvas}CC`, `${colors.surface}00`] as const;
const WASH_STOPS = [0, 0.18, 0.4] as const;

const PROMPT = 'What’s been going on with your body?';
/** Broken evenly at every width: unforced it either rags ("…with / your body?") or leaves "body?" alone on line 2 (V29). */
const PROMPT_BALANCED = 'What’s been going on\nwith your body?';

/** The guided follow-ups that fill the structured fields, previewed so the hero reads as step one of three. */
const NEXT_STEPS = ['When', 'How strong', 'Where'] as const;

export function HeroCard() {
  return (
    <Card tone="hero" style={styles.hero}>
      <LinearGradient
        colors={WASH}
        locations={WASH_STOPS}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
      />
      <Txt variant="hero" style={styles.center} accessibilityRole="header" accessibilityLabel={PROMPT}>
        {PROMPT_BALANCED}
      </Txt>
      <View style={styles.heroMic}>
        <MicButton
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
      <View style={styles.next} accessible accessibilityLabel="After you speak, Atossa asks only for what’s missing: when, how strong, and where.">
        <Txt variant="caption" maxFontSizeMultiplier={1.4} style={{ marginRight: space.xs }}>Next:</Txt>
        {NEXT_STEPS.map((label, i) => (
          <View key={label} style={styles.nextItem}>
            <Txt variant="caption" maxFontSizeMultiplier={1.4}>{label}</Txt>
            {/* Separator trails its label, so a wrapped line never starts with a stray dot. */}
            {i < NEXT_STEPS.length - 1 ? <View style={styles.nextDot} /> : null}
          </View>
        ))}
      </View>
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
      await create('symptom', {
        date: todayKey(), words: '', where: '', typical: null, worst: value, score: value,
        duration: '', stopped: null, stoppedWords: '', source: 'quick', createdAt: noteStamp(todayKey()),
      });
      haptics.success();
      setValue(null);
      showToast(`Saved. ${notesLabel(noteCount(useRecordsStore.getState().records.symptom))} ready for your GP.`);
    } catch {
      setError("That didn't save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ gap: space.md }}>
      <View style={{ gap: space.xxs }}>
        <Txt variant="headline" accessibilityRole="header">Rough day?</Txt>
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
        <Txt variant="caption">{`Your latest note · ${date}`}</Txt>
        {words ? <Quote numberOfLines={4}>{words}</Quote> : <Txt variant="headline">Rough day</Txt>}
        {worst != null || facts ? (
          <View style={styles.factRow}>
            {worst != null ? <SeverityTag value={worst} suffix={suffix} /> : null}
            {facts ? <View style={{ flex: 1 }}><FactLine parts={[facts]} numberOfLines={2} /></View> : null}
          </View>
        ) : null}
      </View>
    </PressableCard>
  );
}

/** The screen's one big number: days to the next appointment, else notes in the last 7 days. */
export function HeroNumberCard() {
  const router = useRouter();
  const symptoms = useRecordsStore((s) => s.records.symptom);
  const appts = useRecordsStore((s) => s.records.appointment);
  const today = todayKey();
  const next = nextAppointment(appts);
  const total = noteCount(symptoms);
  let big: string; let line: string; let sub: string; let target: string;
  if (next) {
    const days = diffDays(today, next.data.date);
    big = days === 0 ? '' : String(days);
    line = days === 0 ? 'Your appointment is today' : days === 1 ? 'day until your appointment' : 'days until your appointment';
    sub = total > 0 ? `${notesLabel(total)} ready for your summary` : 'Add a note and it appears in your summary';
    target = '/(tabs)/doctor';
  } else if (total === 0) {
    big = '0';
    line = 'notes so far';
    sub = 'Your first note starts your record';
    target = '';
  } else {
    const week = noteCount(symptoms, { from: addDays(today, -6), to: today });
    big = String(week);
    line = week === 1 ? 'note this week' : 'notes this week';
    sub = `${notesLabel(total)} in all`;
    target = '/(tabs)/timeline';
  }
  const body = (
    <View style={styles.heroNum}>
      {big ? <Txt variant="numeral" style={{ fontSize: 48, lineHeight: 52 }}>{big}</Txt> : null}
      <View style={{ flex: 1, gap: space.xxs }}>
        <Txt variant="headline">{line}</Txt>
        <Txt variant="secondary">{sub}</Txt>
      </View>
    </View>
  );
  if (!target) return <Card>{body}</Card>;
  return (
    <PressableCard
      onPress={() => router.push(target as any)}
      accessibilityHint={next ? 'Opens For my doctor' : 'Opens Timeline'}
    >
      {body}
    </PressableCard>
  );
}

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
        <Pressable
          key={r.label}
          onPress={() => (r.label === 'Bleeding' ? onPeriod() : openCapture({ mode: 'speak', tag: r.tag }))}
          accessibilityRole="button"
          accessibilityLabel={r.label}
          style={({ pressed }) => [styles.qtile, pressed && { backgroundColor: colors.canvas }]}
        >
          <View aria-hidden style={styles.qicon}><Icon name={r.icon} size={20} color={colors.ink} /></View>
          <Txt variant="secondary" style={{ flex: 1, color: colors.ink }} maxFontSizeMultiplier={1.4}>{r.label}</Txt>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heroNum: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  qgrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  qtile: {
    flexBasis: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 56,
    paddingHorizontal: space.sm, paddingVertical: space.xs, borderRadius: 16, backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline,
  },
  qicon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.plumTint, alignItems: 'center', justifyContent: 'center' },
  hero: { paddingTop: space.xxl, paddingBottom: space.xl + space.xxs, paddingHorizontal: space.xl, alignItems: 'center' },
  center: { textAlign: 'center' },
  heroMic: { alignItems: 'center', marginTop: space.xl, gap: space.sm },
  micLabel: { textAlign: 'center' },
  next: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
    marginTop: space.md, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline,
  },
  nextItem: { flexDirection: 'row', alignItems: 'center' },
  nextDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.ink3, marginHorizontal: 5 },
  chipsWrap: { marginHorizontal: -layout.gutter },
  chipsRow: { flexDirection: 'row', gap: space.xs, paddingHorizontal: layout.gutter, paddingRight: layout.gutter + space.xxl },
  fade: { position: 'absolute', top: 0, bottom: 0, right: 0, width: space.xxl },
  factRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
