import React, { useState } from 'react';
import {
  Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle,
} from 'react-native';
import { colors, fonts, heights, radii, severityColor, space } from '../../../constants/atossaUI';
import { haptics } from '../../../lib/haptics';
import { FieldLabel } from './FieldLabel';
import { Txt } from './Txt';

const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
/** Visual disc (V1: 44, the same weight as a chip). Shrinks only when the row is too narrow. */
const DOT = 44;
/** Each layout cell is at least this wide (the tap target is widened to 44 at 320 pt inside a card). */
const MIN_CELL = 40;
/** At or above this width the scale is one row of 11 (0–10). */
const ONE_ROW_MIN = 11 * 44;

/**
 * 0–10 picker. Narrow: two rows (0–5, 6–10) — row 1 runs edge to edge (disc 0 and disc 5 touch
 * the content edges), row 2 is centred under it with the same spacing. Wide (≥ 484 pt): one
 * row of 11. Nothing is pre-selected; re-tapping the selected number clears it (onChange(null)).
 *
 * Selected = SOLID plum disc + white 600 digit (lead decision V1: the one exception to
 * "selection = plum tint", because this is the product's primary input). Unselected = white
 * with a border-strong outline; pressed = sunken. Captions "0 = none" / "10 = worst" sit under
 * the first and last discs. Use one per question: e.g. label "Usually" and a second "At worst".
 */
export function SeverityRow({
  value, onChange, label, showLabel = true, style,
}: {
  value: number | null | undefined;
  onChange: (n: number | null) => void;
  /** Group name: shown as a FieldLabel above the discs and read by screen readers. */
  label?: string;
  /** Set false to keep `label` for screen readers only. */
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };

  const oneRow = width >= ONE_ROW_MIN;
  const perRow = oneRow ? 11 : 6;
  // Until measured, fall back to equal flex cells (no flash of overflow).
  const cell = width ? Math.max(MIN_CELL, Math.min(56, Math.floor(width / perRow))) : 0;
  const dot = cell ? Math.min(DOT, cell - 2) : DOT - 4;
  const gap = cell ? Math.max(0, (width - perRow * cell) / (perRow - 1)) : 0;
  const slop = cell && cell < heights.minHit ? Math.ceil((heights.minHit - cell) / 2) : 0;
  const rows = oneRow ? [ALL] : [ALL.slice(0, 6), ALL.slice(6)];
  // Row 2 (5 discs) is centred: its last disc (10) is inset by half a cell + half a gap.
  const lastInset = oneRow || !cell ? 0 : (cell + gap) / 2;
  const captionPad = cell ? (cell - dot) / 2 : 0;

  return (
    <View style={style}>
      {label && showLabel ? <FieldLabel label={label} /> : null}
      <View
        onLayout={onLayout}
        accessibilityRole="radiogroup"
        accessibilityLabel={label ?? 'Strength from 0 to 10'}
        style={{ gap: space.xxs }}
      >
        {rows.map((row, r) => (
          <View key={r} style={[styles.row, cell ? { justifyContent: 'center', columnGap: gap } : null]}>
            {row.map((n) => {
              const selected = value === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => { haptics.selection(); onChange(selected ? null : n); }}
                  accessibilityRole="radio"
                  accessibilityLabel={`${n} out of 10`}
                  accessibilityState={{ checked: selected }}
                  aria-checked={selected}
                  // Below 44 (320 pt in a card) the cell itself widens to 44 with negative margins,
                  // so the target is ≥ 44 on web too (hitSlop is native-only) — UX #20.
                  style={[styles.cell, cell ? { width: cell + 2 * slop, marginHorizontal: -slop } : { flex: 1 }]}
                >
                  {({ pressed }) => (
                    <View
                      style={[
                        styles.dot,
                        { width: dot, height: dot, borderRadius: dot / 2 },
                        selected && styles.dotSelected,
                        pressed && !selected && { backgroundColor: colors.sunken },
                      ]}
                    >
                      <Txt maxFontSizeMultiplier={1.4} style={[styles.digit, selected && styles.digitSelected]}>{n}</Txt>
                    </View>
                  )}
                </Pressable>
              );
            })}
            {/* Keep the flex fallback's grid even before measurement. */}
            {!cell && row.length === 5 ? <View style={[styles.cell, { flex: 1 }]} /> : null}
          </View>
        ))}
      </View>
      <View
        style={[styles.captions, { paddingLeft: captionPad, paddingRight: captionPad + lastInset }]}
        aria-hidden
      >
        <Txt variant="caption">0 = none</Txt>
        <Txt variant="caption">10 = worst</Txt>
      </View>
    </View>
  );
}

/** Display-only severity: ramp colour + the digit (the colour is never shown without the number). */
export function SeverityTag({
  value, suffix, style,
}: { value: number; /** e.g. "/10" or "/10 at worst" — the words sit inside the pill (N7). */ suffix?: string; style?: StyleProp<ViewStyle> }) {
  const { bg, fg } = severityColor(value);
  return (
    <View style={[styles.tag, { backgroundColor: bg }, style]} accessible accessibilityLabel={`${value} out of 10${(suffix ?? '').replace('/10', '')}`}>
      <Txt maxFontSizeMultiplier={1.4} style={[styles.tagText, { color: fg }]}>{`${value}${suffix ?? ''}`}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  cell: { minHeight: heights.minHit + 4, alignItems: 'center', justifyContent: 'center' },
  dot: {
    borderWidth: 1, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
  },
  // V1: solid plum, no ring — unmistakable at arm's length.
  dotSelected: { borderWidth: 0, borderColor: colors.plum, backgroundColor: colors.plum },
  digit: { fontFamily: fonts.medium, fontSize: 17, lineHeight: 22, color: colors.ink, fontVariant: ['tabular-nums'] },
  digitSelected: { fontFamily: fonts.semibold, color: colors.white },
  captions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xxs },
  tag: {
    minWidth: 28, height: 28, borderRadius: radii.pill, paddingHorizontal: space.xs,
    alignItems: 'center', justifyContent: 'center',
  },
  tagText: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, fontVariant: ['tabular-nums'] },
});
