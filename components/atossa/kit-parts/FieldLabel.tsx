import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, space, type as typeScale } from '../../../constants/atossaUI';
import { Txt } from './Txt';

/**
 * THE form-field label (review 1, V5) — one style for every field/question group:
 * label 17/24 600 ink; `optional` renders inline as " · Optional" in 15/400 ink2; `hint` sits
 * below in 15/20 ink2; 12 pt to the control underneath. Leave 32 pt between field groups.
 * Not for in-card row labels (NotedRow uses caption) or scale captions.
 */
export function FieldLabel({
  label, optional, hint, nativeID, style,
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  /** Lets a TextInput point at this label (accessibilityLabelledBy). */
  nativeID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ marginBottom: space.sm, gap: space.xxs }, style]}>
      <Txt variant="fieldLabel" nativeID={nativeID} accessibilityRole="text">
        {label}
        {optional ? <Txt style={[typeScale.secondary, { color: colors.ink2 }]}>{' · Optional'}</Txt> : null}
      </Txt>
      {hint ? <Txt variant="secondary">{hint}</Txt> : null}
    </View>
  );
}
