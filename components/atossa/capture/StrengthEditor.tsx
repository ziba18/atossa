// "How strong" editor — shared by the capture follow-up, the noted card and Timeline's entry
// detail. Two SeverityRows (Usually / At worst), nothing pre-selected, plus "It varies" /
// "Not sure" as real answers. Picking a number clears the text answer and vice versa.
import React from 'react';
import { View } from 'react-native';
import { Chip, SeverityRow } from '../kit';
import { space } from '../../../constants/atossaUI';
import type { StrengthText } from '../../../types/records';

export interface StrengthValue {
  typical: number | null;
  worst: number | null;
  strengthText: StrengthText | null;
}

const TEXT_ANSWERS: StrengthText[] = ['It varies', 'Not sure'];

export function StrengthEditor({
  typical, worst, strengthText, onChange, showTextAnswers = true,
}: {
  typical: number | null | undefined;
  worst: number | null | undefined;
  strengthText: StrengthText | null | undefined;
  onChange: (v: StrengthValue) => void;
  /** Hide the It varies / Not sure chips (the capture follow-up shows its own escape row). */
  showTextAnswers?: boolean;
}) {
  const t = typical ?? null;
  const w = worst ?? null;
  return (
    <View style={{ gap: space.xl }}>
      <SeverityRow
        label="Usually"
        value={t}
        onChange={(n) => onChange({ typical: n, worst: w, strengthText: null })}
      />
      <SeverityRow
        label="At worst"
        value={w}
        onChange={(n) => onChange({ typical: t, worst: n, strengthText: null })}
      />
      {showTextAnswers ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
          {TEXT_ANSWERS.map((a) => (
            <Chip
              key={a}
              label={a}
              ghost
              selected={strengthText === a}
              onPress={() => onChange(
                strengthText === a
                  ? { typical: t, worst: w, strengthText: null }
                  : { typical: null, worst: null, strengthText: a },
              )}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
