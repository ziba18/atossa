// One gap follow-up in the capture sheet: plain question, "Why I'm asking" right under it,
// the answer chips, ghost escapes (Not sure / It varies / Skip — saved as values, Skip saves
// nothing), and a "Type or say something else" field with its own mic.
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Button, Chip, ChipGroup, FieldLabel, Txt } from '../kit';
import { colors, fonts, radii, space } from '../../../constants/atossaUI';
import { IMPACT_OPTIONS, WHEN_OPTIONS } from '../../../lib/records/fields';
import { type Draft, impactLabel, isEscape } from './draft';
import type { Question } from './infer';
import { MicButton } from './MicButton';
import { StrengthEditor } from './StrengthEditor';
import { ZoneEditor } from './ZoneEditor';

export const WHY_ASKING = 'Why I’m asking: GPs usually ask this, so it helps to have it ready.';

export function questionTitle(q: Question, past: boolean): string {
  switch (q) {
    case 'strength': return past ? 'How strong was it, usually and at its worst?' : 'How strong is it, usually and at its worst?';
    case 'where': return past ? 'Where did you feel it?' : 'Where do you feel it?';
    case 'when': return 'Is it only around your period, at other times too, or all the time?';
    case 'impact': return past ? 'Did it get in the way of anything that day?' : 'Did it get in the way of anything today?';
  }
}

/** Apply free text typed/said in "something else" to the current question. */
export function applyOther(q: Question, text: string, d: Draft): Partial<Draft> {
  const t = text.trim();
  if (!t) return {};
  switch (q) {
    case 'strength': {
      const n = t.match(/\b(10|[0-9])\b/);
      if (n) return { worst: Number(n[1]), strengthText: null };
      // Not a number: keep her words with the rest of what she said.
      return { words: d.words.trim() ? `${d.words.trim()}\n${t}` : t };
    }
    case 'where': return { whereText: t };
    // "since Tuesday" typed here is how long, not period timing — never mix the two (UX #4).
    case 'when': return /^(since|for)\b/i.test(t) ? { duration: t } : { when: t };
    case 'impact': return {
      impacts: [...d.impacts.filter((i) => !isEscape(i) && i !== 'Nothing today'), t],
      stoppedWords: d.stoppedWords.trim() ? `${d.stoppedWords.trim()}. ${t}` : t,
    };
  }
}

export function FollowUp({
  question, draft, past, onChange, onNext, other, onOtherChange, voiceSupported, recordingOther, onOtherMic,
}: {
  question: Question;
  draft: Draft;
  past: boolean;
  onChange: (patch: Partial<Draft>) => void;
  onNext: () => void;
  other: string;
  onOtherChange: (t: string) => void;
  voiceSupported: boolean;
  recordingOther: boolean;
  onOtherMic: () => void;
}) {
  const advance = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pickedWhen, setPickedWhen] = useState(false);
  useEffect(() => () => { if (advance.current) clearTimeout(advance.current); }, []);

  const escapeSelected = (a: string) => {
    switch (question) {
      case 'strength': return draft.strengthText === a;
      case 'where': return draft.whereText === a && draft.zones.length === 0;
      case 'when': return draft.when === a;
      case 'impact': return draft.impacts.length === 1 && draft.impacts[0] === a;
    }
  };

  const chooseEscape = (a: string) => {
    if (a !== 'Skip') {
      if (question === 'strength') onChange({ typical: null, worst: null, strengthText: a as Draft['strengthText'] });
      if (question === 'where') onChange({ zones: [], whereText: a });
      if (question === 'when') onChange({ when: a });
      if (question === 'impact') onChange({ impacts: [a] });
    }
    onNext();
  };

  const submitOther = () => {
    onChange(applyOther(question, other, draft));
    onNext();
  };

  let body: React.ReactNode = null;
  let canContinue = false;
  if (question === 'strength') {
    canContinue = draft.typical != null || draft.worst != null || draft.strengthText != null;
    body = (
      <StrengthEditor
        typical={draft.typical}
        worst={draft.worst}
        strengthText={draft.strengthText}
        showTextAnswers={false}
        onChange={(v) => onChange(v)}
      />
    );
  } else if (question === 'where') {
    canContinue = draft.zones.length > 0 || draft.whereText.trim() !== '';
    body = (
      <ZoneEditor
        value={draft.zones}
        onChange={(zones) => onChange({ zones, whereText: isEscape(draft.whereText) ? '' : draft.whereText })}
      />
    );
  } else if (question === 'when') {
    canContinue = true;
    body = (
      <ChipGroup
        accessibilityLabel="When it happens"
        options={[...WHEN_OPTIONS]}
        value={(WHEN_OPTIONS as readonly string[]).includes(draft.when) ? draft.when : null}
        onChange={(v) => {
          if (!v || pickedWhen) return;
          setPickedWhen(true);
          onChange({ when: v });
          // Let the selection show for a beat, then move on.
          advance.current = setTimeout(onNext, 280);
        }}
      />
    );
  } else {
    canContinue = draft.impacts.length > 0;
    const custom = draft.impacts.filter((i) => !(IMPACT_OPTIONS as readonly string[]).includes(i) && !isEscape(i));
    body = (
      <ChipGroup
        mode="multi"
        accessibilityLabel="What it got in the way of"
        options={[...IMPACT_OPTIONS, ...custom].map((v) => ({ value: v, label: impactLabel(v, past) }))}
        ghosts={[]}
        exclusive={['Nothing today']}
        value={draft.impacts.filter((i) => !isEscape(i))}
        onChange={(impacts) => onChange({ impacts })}
      />
    );
  }

  const typed = other.trim() !== '' && !recordingOther;
  const showContinue = typed || question !== 'when' || (draft.when.trim() !== '' && !pickedWhen);

  return (
    <View>
      <Txt variant="title" accessibilityRole="header">{questionTitle(question, past)}</Txt>
      <Txt variant="caption" style={{ marginTop: space.xs }}>{WHY_ASKING}</Txt>

      <View style={{ marginTop: space.lg }}>{body}</View>

      <View style={styles.escapes}>
        {['Not sure', 'It varies', 'Skip'].map((a) => (
          <Chip key={a} label={a} ghost selected={a !== 'Skip' && escapeSelected(a)} onPress={() => chooseEscape(a)} />
        ))}
      </View>

      <FieldLabel label="Type or say something else" nativeID="capture-other-label" style={styles.otherLabel} />
      <View style={styles.otherRow}>
        <TextInput
          value={other}
          onChangeText={onOtherChange}
          editable={!recordingOther}
          accessibilityLabel="Type or say something else"
          accessibilityLabelledBy="capture-other-label"
          returnKeyType="done"
          onSubmitEditing={() => { if (other.trim()) submitOther(); }}
          placeholderTextColor={colors.ink3}
          style={styles.otherInput}
        />
        {voiceSupported ? (
          <MicButton
            size={52}
            recording={recordingOther}
            onPress={onOtherMic}
            accessibilityLabel={recordingOther ? 'Stop recording' : 'Say something else'}
          />
        ) : null}
      </View>
      {/* Continue sits after everything it applies to: chips AND typed words (her words win
          for this question only when she typed some — never silently). */}
      {showContinue ? (
        <Button
          label={typed ? 'Use these words' : 'Continue'}
          onPress={typed ? submitOther : onNext}
          disabled={!typed && !canContinue}
          style={{ marginTop: space.xl }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  escapes: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.md },
  otherLabel: { marginTop: space.xl, marginBottom: 0 },
  otherRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.sm },
  otherInput: {
    flex: 1, minWidth: 0, height: 52, borderRadius: radii.input, borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.surface, paddingHorizontal: space.md, fontFamily: fonts.regular, fontSize: 17, color: colors.ink,
  },
});
