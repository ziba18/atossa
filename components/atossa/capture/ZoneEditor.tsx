// "Where" editor — multi-select named body zones. Shared by the capture follow-up, the noted
// card and Timeline's entry detail. Nothing pre-selected; chips wrap (never clip).
// Pass `text` + `onTextChange` to also offer "Somewhere else" (her own words — a headache or a
// rash isn't in the pelvic zones) and the Not sure / It varies answers; both are saved as
// `whereText`. An escape answer clears the zones (onChange([])); picking a zone clears an escape.
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Chip, ChipGroup, Txt } from '../kit';
import { colors, fonts, radii, space } from '../../../constants/atossaUI';
import { BODY_ZONES, BODY_ZONE_LABELS } from '../../../lib/records/fields';
import { isEscapeValue } from '../../../lib/records/format';

const ESCAPES = ['Not sure', 'It varies'];

export function ZoneEditor({
  value, onChange, text, onTextChange, onSubmit,
}: {
  value: string[];
  onChange: (zones: string[]) => void;
  /** Free "where" (her words) or an escape answer. Omit to show the zone chips only. */
  text?: string;
  onTextChange?: (text: string) => void;
  /** Return key in the "Somewhere else" field (e.g. close the editor). */
  onSubmit?: () => void;
}) {
  const withText = onTextChange !== undefined;
  const t = text ?? '';
  const escape = isEscapeValue(t) ? t.trim() : '';
  return (
    <View style={{ gap: space.md }}>
      <ChipGroup
        mode="multi"
        accessibilityLabel="Where you feel it"
        options={BODY_ZONES.map((z) => ({ value: z, label: BODY_ZONE_LABELS[z] ?? z }))}
        ghosts={[]}
        exclusive={[]}
        value={value}
        onChange={(zones) => {
          onChange(zones);
          if (withText && escape && zones.length) onTextChange!('');
        }}
      />
      {withText ? (
        <>
          <View style={{ gap: space.xs }}>
            <Txt variant="caption" nativeID="where-else-label">Somewhere else</Txt>
            <TextInput
              value={escape ? '' : t}
              onChangeText={(v) => onTextChange!(v)}
              placeholder="For example, my head"
              placeholderTextColor={colors.ink2}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              accessibilityLabel="Somewhere else, in your words"
              accessibilityLabelledBy="where-else-label"
              style={styles.input}
            />
          </View>
          <View style={styles.escapes}>
            {ESCAPES.map((a) => (
              <Chip
                key={a}
                label={a}
                ghost
                selected={escape === a}
                accessibilityRole="radio"
                onPress={() => {
                  if (escape === a) { onTextChange!(''); return; }
                  onChange([]);
                  onTextChange!(a);
                }}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52, borderRadius: radii.input, borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.surface, paddingHorizontal: space.md, paddingVertical: space.sm,
    fontFamily: fonts.regular, fontSize: 17, lineHeight: 24, color: colors.ink,
  },
  escapes: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
