// iOS-style inset-grouped list for Profile: one white card per section, 56 pt rows, hairline
// dividers inset past the leading glyph. Used instead of a stack of one-row cards.
import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { colors, heights, radii, space } from '../../../constants/atossaUI';
import { Icon, type IconName } from '../../ui/Icon';
import { Quote, Txt } from '../kit';

const ROW_PAD = space.md;
const GLYPH = 20;
/** Divider inset = row padding + glyph + gap, so it starts under the label (52). */
const DIVIDER_INSET = ROW_PAD + GLYPH + space.md;

/** Section heading over a group: 15/20 600 ink-2, 8 above the card. */
export function GroupHeading({ title, style }: { title: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ marginBottom: space.xs, paddingHorizontal: space.xxs }, style]}>
      <Txt variant="groupLabel" accessibilityRole="header" aria-level={2}>{title}</Txt>
    </View>
  );
}

/**
 * The white card holding a section's rows. Children should be `GroupRow`s. `edge="clay"` draws
 * the 4 pt bleeding edge ONCE down the card's left side (bleeding rows only), and the rows and
 * dividers start after it.
 */
export function Group({
  children, style, edge, accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edge?: 'clay';
  accessibilityLabel?: string;
}) {
  const rows = React.Children.toArray(children).filter(Boolean);
  const tight = useWindowDimensions().width < 280; // rows drop their glyph here, so the divider starts at the row edge
  return (
    <View style={[styles.group, style]} accessibilityLabel={accessibilityLabel}>
      {edge ? <View style={styles.clayEdge} /> : null}
      {rows.map((child, i) => (
        <View key={i} style={edge ? styles.afterEdge : undefined}>
          {i > 0 ? <View style={[styles.divider, { marginLeft: hasIcon(child) && !tight ? DIVIDER_INSET : ROW_PAD }]} /> : null}
          {child}
        </View>
      ))}
    </View>
  );
}

const hasIcon = (child: React.ReactNode) =>
  React.isValidElement(child) && !!(child.props as { icon?: IconName }).icon;

/**
 * One row: optional 20 pt ink glyph, label (17 ink) with an optional secondary line, an
 * optional trailing value (ink-3) and a chevron when it navigates.
 */
export function GroupRow({
  icon, label, detail, quote, value, onPress, chevron = true, accessibilityLabel, tint,
}: {
  icon?: IconName;
  label: string;
  detail?: string;
  /** Sam's own words for this row (e.g. a period-day note), shown as a serif Quote. */
  quote?: string;
  value?: string;
  onPress: () => void;
  chevron?: boolean;
  accessibilityLabel?: string;
  /** Ink bar on the left edge for the one row that matters most (e.g. the next appointment); no tint, so it reads in greyscale. */
  tint?: boolean;
}) {
  // Under ~280 px (200% zoom) the decorative icon goes and the gap closes, so words are not broken mid-word.
  const width = useWindowDimensions().width;
  const tight = width < 280;
  // Under ~220 pt the value would squeeze the label into broken words, so it moves under the label.
  const stacked = width < 220 && !!value;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [label, detail, quote, value].filter(Boolean).join(' ')}
      style={({ pressed }) => [styles.row, tight && { gap: space.xs }, tint && { borderLeftWidth: 4, borderLeftColor: colors.ink }, pressed && { backgroundColor: colors.canvas }]}
    >
      {icon && !tight ? <Icon name={icon} size={GLYPH} color={colors.ink} /> : null}
      <View style={styles.text}>
        {/* The trailing space keeps label and detail apart in the page text, so the spoken name can start with it (WCAG 2.5.3). */}
        <Txt variant="body">{detail || quote || stacked ? `${label} ` : label}</Txt>
        {stacked ? <Txt variant="secondary" style={styles.tabular}>{value}</Txt> : null}
        {detail ? <Txt variant="secondary">{value && !stacked ? `${detail} ` : detail}</Txt> : null}
        {quote ? <Quote numberOfLines={2}>{quote}</Quote> : null}
      </View>
      {value && !stacked ? <Txt variant="body" color={colors.ink3} style={styles.tabular}>{value}</Txt> : null}
      {/* Under ~220 pt the chevron goes (as on the hero card): its 32 pt lets a long word fit instead of breaking mid-word. */}
      {chevron && width >= 220 ? <Icon name="chevron-right" size={20} color={colors.ink3} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.hairline,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: Math.max(56, heights.minHit),
    paddingHorizontal: ROW_PAD, paddingVertical: space.sm,
  },
  text: { flex: 1, minWidth: 0, gap: 2 },
  divider: { height: 1, backgroundColor: colors.hairline },
  clayEdge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.clay, zIndex: 1 },
  afterEdge: { marginLeft: 4 },
  tabular: { fontVariant: ['tabular-nums'] },
});
