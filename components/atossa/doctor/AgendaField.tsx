// "What I'd like from this appointment" ("… from today" when it's today) — a 2-line white field with a
// border-strong outline (radius 14), like the other text fields, with an optional mic.
// The mic only shows where on-device dictation works (not in Expo Go or on web).
import React, { useRef } from 'react';
import { TextInput, View } from 'react-native';
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
  value, onChange, onBlur, title,
}: { value: string; onChange: (t: string) => void; onBlur: () => void; /** agendaTitleFor(appointmentToday) */ title: string }) {
  const base = useRef('');
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

  return (
    <View>
      <Txt variant="headline" nativeID="agendaLabel">{title}</Txt>
      <Txt variant="secondary" style={{ marginTop: space.xxs }}>
        What’s the one thing you want your GP to take away? Pick a main priority or write your own.
      </Txt>
      <View style={{ marginTop: space.sm }}>
        <ChipGroup
          mode="single"
          options={[...PRIORITIES]}
          value={PRIORITIES.find((p) => value.startsWith(prioritySentence(p))) ?? null}
          allowDeselect
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
          onBlur={onBlur}
          multiline
          numberOfLines={2}
          maxLength={400}
          accessibilityLabel={title}
          accessibilityLabelledBy="agendaLabel"
          placeholder="In your own words"
          placeholderTextColor={colors.ink2}
          textAlignVertical="top"
          style={{
            ...typeScale.body, flex: 1, minHeight: typeScale.body.lineHeight! * 2 + space.sm * 2, paddingVertical: space.sm,
          }}
        />
        {dictation.supported ? (
          <View style={{ paddingTop: (typeScale.body.lineHeight! * 2 + space.sm * 2 - heights.minHit) / 2 }}>
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
