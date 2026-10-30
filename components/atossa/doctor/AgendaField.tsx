// "What I'd like from this appointment" ("… from today" when it's today) — a 2-line white field with a
// border-strong outline (radius 14), like the other text fields, with an optional mic.
// The mic only shows where on-device dictation works (not in Expo Go or on web).
import React, { useRef, useState } from 'react';
import { Pressable, TextInput, View, useWindowDimensions } from 'react-native';
import { colors, heights, radii, space, type as typeScale } from '../../../constants/atossaUI';
import { useDictation } from '../../../hooks/useDictation';
import { haptics } from '../../../lib/haptics';
import { ChipGroup, IconButton, InlineError, Txt } from '../kit';

// Quick starts for the one thing she wants the GP to take away. Tapping one writes a plain sentence into the
// field (still hers to edit); it isn't a separate record. Symptom areas only: no treatments, no conditions.
const PRIORITIES = ['Pain', 'Bleeding', 'Tiredness', 'Mood', 'Bowel or bladder'] as const;
const PRIORITY_PREFIX = 'My main priority is ';
const prioritySentence = (p: string) => `${PRIORITY_PREFIX}${p.toLowerCase()}.`;

export function AgendaField({
  value, onChange, onBlur, title, compact,
}: { value: string; onChange: (t: string) => void; onBlur: () => void; /** agendaTitleFor(appointmentToday) */ title: string; /** short phones: no hint line */ compact?: boolean }) {
  const base = useRef('');
  const [focused, setFocused] = useState(false);
  const [opened, setOpened] = useState(false);
  // Collapsed to one line until it holds words or has focus (keeps the digits card above the fold).
  // Very narrow screens wrap the placeholder to two lines, so the empty box gets two lines too.
  const narrow = useWindowDimensions().width < 260;
  const boxH = typeScale.body.lineHeight! * (focused || value.length > 0 || narrow ? 2 : 1) + space.sm * 2;
  const dictation = useDictation((transcript) => {
    const joined = [base.current.trim(), transcript.trim()].filter(Boolean).join(' ');
    onChange(joined);
  });

  const toggleMic = () => {
    haptics.light();
    if (dictation.recording) {
      dictation.stop();
      onBlur();
    } else {
      base.current = value;
      dictation.start();
    }
  };

  // Short phones: one row until she opens it, so the digits card stays above the fold.
  if (compact && !opened && value.length === 0) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: heights.minHit }}>
        <Txt variant="headline" nativeID="agendaLabel" style={{ flex: 1 }}>{title}</Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add: ${title}`}
          onPress={() => setOpened(true)}
          style={{ minHeight: heights.minHit, minWidth: heights.minHit, paddingHorizontal: space.md, borderRadius: radii.pill, backgroundColor: colors.plumTint, alignItems: 'center', justifyContent: 'center' }}
        >
          <Txt variant="secondary" style={{ color: colors.plum, fontWeight: '600' }}>Add</Txt>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <Txt variant="headline" nativeID="agendaLabel">{title}</Txt>
      {compact ? null : (
        <Txt variant="secondary" style={{ marginTop: space.xxs }}>
          The one thing to take away. Pick one or write your own.
        </Txt>
      )}
      <View style={{ marginTop: space.sm }}>
        <ChipGroup
          mode="single"
          options={[...PRIORITIES]}
          value={PRIORITIES.find((p) => value.startsWith(prioritySentence(p))) ?? null}
          allowDeselect
          scroll
          bleed
          accessibilityLabel="Main priority"
          onChange={(v) => {
            const rest = PRIORITIES.reduce((t, p) => (t.startsWith(prioritySentence(p)) ? t.slice(prioritySentence(p).length).trim() : t), value);
            onChange(v ? [prioritySentence(v), rest].filter(Boolean).join(' ') : rest);
            onBlur();
          }}
        />
      </View>
      <View
        style={{
          marginTop: space.sm, flexDirection: 'row', alignItems: 'flex-start', gap: space.xs,
          backgroundColor: colors.surface, borderRadius: radii.input, borderWidth: 1, borderColor: colors.borderStrong,
          paddingLeft: space.md, paddingRight: space.xxs,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur(); }}
          multiline
          numberOfLines={1}
          maxLength={400}
          accessibilityLabel={title}
          accessibilityLabelledBy="agendaLabel"
          placeholder="In your own words"
          placeholderTextColor={colors.ink2}
          textAlignVertical="top"
          style={{
            ...typeScale.body, flex: 1, minHeight: boxH, paddingVertical: space.sm,
          }}
        />
        {dictation.supported ? (
          <View style={{ paddingTop: Math.max(0, (boxH - heights.minHit) / 2) }}>
            <IconButton
              icon={dictation.recording ? 'square' : 'mic'}
              label={dictation.recording ? 'Stop dictating' : 'Dictate instead of typing'}
              onPress={toggleMic}
              color={colors.plum}
            />
          </View>
        ) : null}
      </View>
      {dictation.recording ? <Txt variant="caption" style={{ marginTop: space.xs }}>Listening… tap stop when you’re done.</Txt> : null}
      <InlineError message={dictation.error} style={{ marginTop: space.xs }} />
    </View>
  );
}
