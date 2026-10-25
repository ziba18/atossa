// Today's building blocks: hero capture card, starter chips, Rough day quick log, latest note.
// No stat tiles, rings, streaks or charts — the screen's one number is the note count.
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
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

// Warm wash (V6): a faint plum-tint blush at the very top that settles into the warm canvas,
// then white — the hero is never cooler than the paper around it. Top 40% only.
const WASH = [`${colors.plumTint}80`, `${colors.canvas}CC`, `${colors.surface}00`] as const;
const WASH_STOPS = [0, 0.18, 0.4] as const;

const PROMPT = 'What’s been going on with your body?';
/** Below ~400 pt the prompt rags as "…going on with / your body?"; break it evenly instead (V29). */
const PROMPT_NARROW = 'What’s been going on\nwith your body?';

/** The guided follow-ups that fill the structured fields, previewed so the hero reads as step one of three. */
const NEXT_STEPS = ['When', 'How strong', 'Where'] as const;

export function HeroCard() {
  const { width } = useWindowDimensions();
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
        {width < 400 ? PROMPT_NARROW : PROMPT}
      </Txt>
      <View style={styles.heroMic}>
        <MicButton
          onPress={() => openCapture({ mode: 'speak', startRecording: true })}
          accessibilityLabel="Tap to talk"
          accessibilityHint="Opens a new note and starts recording"
        />
        {/* The primary action's label outranks the secondary link (V7). */}
        <Txt variant="headline" style={styles.micLabel} importantForAccessibility="no" accessibilityElementsHidden>
          Tap to talk
        </Txt>
      </View>
      <Button label="Type instead" variant="text" small onPress={() => openCapture({ mode: 'type' })} style={{ marginTop: space.xxs }} />
      <View style={styles.next} accessible accessibilityLabel="After you speak, Atossa asks only for what’s missing: when, how strong, and where.">
        <Txt variant="caption" maxFontSizeMultiplier={1.4} style={{ marginRight: space.sm }}>Next:</Txt>
        {NEXT_STEPS.map((label, i) => (
          <View key={label} style={styles.nextItem}>
            {i > 0 ? <View style={styles.nextDot} /> : null}
            <Txt variant="caption" maxFontSizeMultiplier={1.4}>{label}</Txt>
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
        colors={[`${colors.canvas}00`, colors.canvas]}
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

const styles = StyleSheet.create({
  hero: { paddingTop: space.xxl, paddingBottom: space.xl + space.xxs, paddingHorizontal: space.xl, alignItems: 'center' },
  center: { textAlign: 'center' },
  heroMic: { alignItems: 'center', marginTop: space.xl, gap: space.sm },
  micLabel: { textAlign: 'center' },
  next: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
    marginTop: space.md, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline,
  },
  nextItem: { flexDirection: 'row', alignItems: 'center' },
  nextDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.ink3, marginHorizontal: space.sm },
  chipsWrap: { marginHorizontal: -layout.gutter },
  chipsRow: { flexDirection: 'row', gap: space.xs, paddingHorizontal: layout.gutter, paddingRight: layout.gutter + space.xl },
  fade: { position: 'absolute', top: 0, bottom: 0, right: 0, width: space.xl },
  factRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
