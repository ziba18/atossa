// "Here's what I noted." — Sam's own words in quotes (and nothing else in quotes), tidy values
// for everything chosen, "+ Add …" chips for gaps. Tap a row to edit it in place; one row at a
// time, and the row's value is hidden while its editor is open so nothing shows three times.
// "When" (period timing) and "How long" (her words, e.g. "Since Tuesday") are separate rows and
// never overwrite each other (UX #4). "Tried" is her words, so it shows in the serif.
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import {
  Button, Card, ChipGroup, DatePill, DayChooser, NotedRow, Txt,
} from '../kit';
import { colors, fonts, radii, space } from '../../../constants/atossaUI';
import { addDays, todayKey } from '../../../lib/records/dates';
import { IMPACT_OPTIONS, WHEN_OPTIONS } from '../../../lib/records/fields';
import {
  type Draft, impactLabel, impactsLabel, isEscape, strengthLabel, whereLabel,
} from './draft';
import { StrengthEditor } from './StrengthEditor';
import { ZoneEditor } from './ZoneEditor';

export type NotedField = 'words' | 'where' | 'strength' | 'when' | 'duration' | 'impact' | 'tried' | 'date';
type Field = NotedField;

/** The row "Fix something" opens: the first one Atossa filled in (her words last). */
export function firstFilledField(d: Draft): NotedField {
  if (d.zones.length || d.whereText.trim()) return 'where';
  if (d.typical != null || d.worst != null || d.strengthText) return 'strength';
  if (d.when.trim()) return 'when';
  if (d.duration.trim()) return 'duration';
  if (d.impacts.length) return 'impact';
  return 'words';
}

export function NotedCard({
  draft, onChange, past, editing: editingProp, onEditingChange, onReveal,
}: {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  past: boolean;
  /** Optional control of the open row (CaptureSheet's "Fix something"). */
  editing?: NotedField | null;
  onEditingChange?: (f: NotedField | null) => void;
  /**
   * Called once when an inline editor opens, with its top's y inside this component, so the
   * parent can scroll it into view (review 2, N9: editors near the bottom opened off-screen).
   */
  onReveal?: (y: number) => void;
}) {
  const [editingState, setEditingState] = useState<Field | null>(null);
  const editing = editingProp !== undefined ? editingProp : editingState;
  const setEditing = (u: Field | null | ((cur: Field | null) => Field | null)) => {
    const next = typeof u === 'function' ? u(editing) : u;
    if (onEditingChange) onEditingChange(next); else setEditingState(next);
  };
  const today = todayKey();
  const minDate = [addDays(today, -13), draft.date].sort()[0];
  const toggle = (f: Field) => setEditing((cur) => (cur === f ? null : f));
  const done = () => setEditing(null);

  // Reveal each newly opened editor once (not on every relayout while she types).
  const cardY = useRef(0);
  const revealed = useRef<Field | null>(null);
  useEffect(() => { if (!editing) revealed.current = null; }, [editing]);
  const onEditorLayout = (y: number) => {
    if (!editing || revealed.current === editing) return;
    revealed.current = editing;
    onReveal?.(cardY.current + y);
  };

  const editor = (label: string, children: React.ReactNode, first?: boolean) => (
    <View style={[styles.editBlock, !first && styles.divider]} onLayout={(e) => onEditorLayout(e.nativeEvent.layout.y)}>
      <Txt variant="caption">{label}</Txt>
      {children}
      <Button label="Done" variant="secondary" onPress={done} />
    </View>
  );

  const whenIsOption = (WHEN_OPTIONS as readonly string[]).includes(draft.when) || isEscape(draft.when);
  const textInput = (
    value: string, set: (v: string) => void, label: string, placeholder?: string, multi?: boolean,
  ) => (
    <TextInput
      value={value}
      onChangeText={set}
      autoFocus
      multiline={multi}
      submitBehavior={multi ? 'blurAndSubmit' : undefined}
      placeholder={placeholder}
      placeholderTextColor={colors.ink2}
      returnKeyType="done"
      onSubmitEditing={done}
      accessibilityLabel={label}
      style={[styles.input, multi && styles.inputMulti]}
    />
  );
  const customImpacts = draft.impacts.filter((i) => !(IMPACT_OPTIONS as readonly string[]).includes(i) && !isEscape(i));

  return (
    <View>
      <Txt variant="title" accessibilityRole="header">Here’s what I noted.</Txt>
      <Txt variant="secondary" style={{ marginTop: space.xxs }}>Tap anything to fix it.</Txt>

      <View style={{ marginTop: space.md }}>
        <DatePill value={draft.date} onPress={() => toggle('date')} />
        {editing === 'date' ? (
          <View style={{ marginTop: space.xs }}>
            <DayChooser
              value={draft.date}
              min={minDate}
              max={today}
              onChange={(k) => { onChange({ date: k }); done(); }}
            />
          </View>
        ) : null}
      </View>

      <Card style={{ marginTop: space.md, paddingVertical: space.xxs }} onLayout={(e) => { cardY.current = e.nativeEvent.layout.y; }}>
        {editing === 'words' ? editor('What it felt like', (
          <TextInput
            value={draft.words}
            onChangeText={(words) => onChange({ words })}
            autoFocus
            multiline
            submitBehavior="blurAndSubmit"
            returnKeyType="done"
            onSubmitEditing={done}
            accessibilityLabel="What it felt like, in your words"
            style={[styles.input, styles.inputMulti]}
          />
        ), true) : (
          <NotedRow
            first
            label="What it felt like"
            quote={draft.words}
            addLabel="Add what it felt like"
            onPress={() => toggle('words')}
          />
        )}

        {editing === 'where' ? editor('Where', (
          <ZoneEditor
            value={draft.zones}
            onChange={(zones) => onChange({ zones })}
            text={draft.whereText}
            onTextChange={(whereText) => onChange({ whereText })}
            onSubmit={done}
          />
        )) : (
          <NotedRow label="Where" value={whereLabel(draft)} addLabel="Add where" onPress={() => toggle('where')} />
        )}

        {editing === 'strength' ? editor('How strong', (
          <StrengthEditor
            typical={draft.typical}
            worst={draft.worst}
            strengthText={draft.strengthText}
            onChange={(v) => onChange(v)}
          />
        )) : (
          <NotedRow label="How strong" value={strengthLabel(draft)} addLabel="Add how strong" onPress={() => toggle('strength')} />
        )}

        {editing === 'when' ? editor('When', (
          <View style={{ gap: space.sm }}>
            <ChipGroup
              accessibilityLabel="When it happens"
              options={[...WHEN_OPTIONS, 'Not sure', 'It varies']}
              value={whenIsOption ? draft.when : null}
              allowDeselect
              onChange={(v) => onChange({ when: v ?? '' })}
            />
            <TextInput
              value={whenIsOption ? '' : draft.when}
              onChangeText={(when) => onChange({ when })}
              placeholder="Or in your own words"
              placeholderTextColor={colors.ink2}
              returnKeyType="done"
              onSubmitEditing={done}
              accessibilityLabel="When, in your own words"
              style={styles.input}
            />
          </View>
        )) : (
          <NotedRow label="When" value={draft.when} addLabel="Add when" onPress={() => toggle('when')} />
        )}

        {editing === 'duration' ? editor('How long', textInput(
          draft.duration, (duration) => onChange({ duration }), 'How long it has been going on', 'For example, since Tuesday',
        )) : (
          <NotedRow label="How long" value={draft.duration} addLabel="Add how long" onPress={() => toggle('duration')} />
        )}

        {editing === 'impact' ? editor('Got in the way of', (
          <ChipGroup
            mode="multi"
            accessibilityLabel="What it got in the way of"
            options={[...IMPACT_OPTIONS, ...customImpacts, 'Not sure', 'It varies'].map((v) => ({ value: v, label: impactLabel(v, past) }))}
            exclusive={['Nothing today', 'Not sure', 'It varies']}
            value={draft.impacts}
            onChange={(impacts) => onChange({ impacts })}
          />
        )) : (
          <NotedRow
            label="Got in the way of"
            value={impactsLabel(draft, past)}
            addLabel="Add what got in the way"
            onPress={() => toggle('impact')}
          />
        )}

        {editing === 'tried' ? editor('Tried', textInput(
          draft.tried, (tried) => onChange({ tried }), 'What you tried, in your words', 'For example, paracetamol, didn’t help', true,
        )) : (
          <NotedRow label="Tried" quote={draft.tried} addLabel="Add what you tried" onPress={() => toggle('tried')} />
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  editBlock: { paddingVertical: space.md, gap: space.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  input: {
    minHeight: 52, borderRadius: radii.input, borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.surface, paddingHorizontal: space.md, paddingVertical: space.sm,
    fontFamily: fonts.regular, fontSize: 17, lineHeight: 24, color: colors.ink,
  },
  inputMulti: { minHeight: 120, textAlignVertical: 'top' },
});
