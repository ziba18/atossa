import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent, type StyleProp, type ViewStyle, type ScrollViewInstance } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import { colors, fonts, heights, layout, radii, shadows, space } from '../../../constants/atossaUI';
import { useAuthStore } from '../../../stores/authStore';
import { isHumanName } from '../../../lib/humanName';
import { Icon, type IconName } from '../../ui/Icon';
import { AddFieldChip, Button, type ButtonVariant } from './controls';
import { Quote, Txt } from './Txt';

// ---- Screen structure ---------------------------------------------------------------------

/**
 * Tab-root / pushed screen: safe-area top, canvas, large title (34/41) with an optional right
 * accessory (HeaderAvatar, "+"), optional subtitle (greeting, 8 below the title), 20 gutter,
 * content capped at 600 wide. Pass `back` for pushed screens to show a BackChevron above the title.
 */
export function ScreenLarge({
  title, subtitle, right, back, children, scroll = true, contentStyle, scrollRef, footer, wide, brand, wash = true,
}: {
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  back?: { label: string; onPress?: () => void };
  children?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  scrollRef?: React.RefObject<ScrollViewInstance | null>;
  /** Pinned under the scroll area (rare — e.g. a share bar). */
  footer?: React.ReactNode;
  /** Desktop web only: lets the content run to the shell's wider column (two-column screens). */
  wide?: boolean;
  /** Small ATOSSA wordmark above the title (sign in / register), so the auth screens carry the brand. */
  brand?: boolean;
  /** Lavender light behind the header (Iris). Off for the evidence page, which stays white. */
  wash?: boolean;
}) {
  const head = (
    <View style={styles.head}>
      {back ? <BackChevron label={back.label} onPress={back.onPress} /> : null}
      {brand ? <Txt variant="caption" color={colors.plum} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ fontSize: 13, letterSpacing: 3, fontWeight: '600', marginBottom: space.xs }}>ATOSSA</Txt> : null}
      <View style={styles.titleRow}>
        <Txt variant="largeTitle" accessibilityRole="header" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 150 }}>{title}</Txt>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {subtitle ? (
        typeof subtitle === 'string'
          ? <Txt variant="body" color={colors.ink2} style={{ marginTop: space.xs }}>{subtitle}</Txt>
          : <View style={{ marginTop: space.xs }}>{subtitle}</View>
      ) : null}
    </View>
  );
  return (
    <SafeAreaView edges={["top"]} role="main" style={[styles.screen, !wash && { backgroundColor: colors.surface }]}>
      {wash ? (
        <LinearGradient
          colors={['#E6DCFB', colors.canvas]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360, pointerEvents: 'none' }}
        />
      ) : null}
      {scroll ? (
        <ScrollView
          ref={scrollRef as React.RefObject<ScrollViewInstance>}
          contentContainerStyle={[styles.column, wide && { maxWidth: 1040 }, styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {head}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.column, { flex: 1 }, contentStyle]}>
          {head}
          {children}
        </View>
      )}
      {footer ? <View style={[styles.column, wide && { maxWidth: 1040 }, styles.footer]}>{footer}</View> : null}
    </SafeAreaView>
  );
}

/** 44 avatar (initial) that opens Profile. Top-right on every tab. */
/** Tab route name → its visible title, so Profile's BackChevron can name the tab it came from. */
const TAB_TITLES: Record<string, string> = { today: 'Today', timeline: 'Timeline', doctor: 'For my doctor' };

export function HeaderAvatar() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const from = TAB_TITLES[segments[1] ?? ''] ?? 'Today';
  const name = useAuthStore((s) => s.profile?.display_name);
  const email = useAuthStore((s) => s.user?.email);
  const initial = ((isHumanName(name) ? name!.trim() : email)?.[0] ?? 'A').toUpperCase();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(tabs)/profile', params: { from } } as any)}
      accessibilityRole="button"
      accessibilityLabel="Open profile and settings"
      style={({ pressed }) => [styles.avatar, pressed && { backgroundColor: colors.hairline }]}
    >
      <Txt style={styles.avatarText}>{initial}</Txt>
    </Pressable>
  );
}

/** "‹ Timeline" — top-left back link naming the previous screen. Plum, 44 hit. */
export function BackChevron({ label, onPress }: { label: string; onPress?: () => void }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityRole="button"
      accessibilityLabel={`Back to ${label}`}
      style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
    >
      <Icon name="chevron-left" size={24} color={colors.plum} />
      <Txt variant="body" color={colors.plum}>{label}</Txt>
    </Pressable>
  );
}

/** Section heading, title 24/30. */
export function SectionTitle({ title, right, style }: { title: string; right?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.sectionTitle, style]}>
      <Txt variant="title" accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 150 }}>{title}</Txt>
      {right}
    </View>
  );
}

// ---- Cards --------------------------------------------------------------------------------

export type CardTone = 'default' | 'sunken' | 'selected' | 'error' | 'hero' | 'coral' | 'blue' | 'green' | 'plain';

const toneStyle = (tone: CardTone): ViewStyle => {
  switch (tone) {
    case 'sunken': return { backgroundColor: colors.sunken, borderColor: colors.sunken };
    case 'selected': case 'blue': return { backgroundColor: colors.plumTint, borderColor: colors.plumTint };
    case 'error': case 'coral': return { backgroundColor: colors.errorTint, borderColor: colors.error };
    case 'green': return { backgroundColor: colors.savedTint, borderColor: colors.savedTint };
    case 'hero': return { ...shadows.hero };
    default: return { ...shadows.card };
  }
};

/**
 * White card, hairline border, radius 20, padding 20, soft resting shadow. `tone="hero"` swaps in the one
 * permitted soft shadow (Today hero / document preview only). `edge="clay"` draws the 4 px
 * bleeding edge on the left.
 */
export function Card({
  children, tone = 'default', edge, style, onLayout,
}: {
  children: React.ReactNode;
  tone?: CardTone;
  edge?: 'clay';
  style?: StyleProp<ViewStyle>;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  return (
    <View onLayout={onLayout} style={[styles.card, toneStyle(tone), edge && styles.edgePad, style]}>
      {edge ? <View style={styles.clayEdge} /> : null}
      {children}
    </View>
  );
}

/** Tappable Card with a chevron-right (ink3, 20) and a pressed state. */
export function PressableCard({
  children, onPress, chevron = true, edge, accessibilityLabel, accessibilityHint, accessibilityActions, onAccessibilityAction, style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  chevron?: boolean;
  edge?: 'clay';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Extra screen-reader actions (swipe up/down on the card); the default action is still onPress. */
  accessibilityActions?: { name: string; label: string }[];
  onAccessibilityAction?: (name: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction ? (e) => onAccessibilityAction(e.nativeEvent.actionName) : undefined}
      style={({ pressed }) => [styles.card, styles.pressable, edge && styles.edgePad, pressed && { backgroundColor: colors.sunken }, style]}
    >
      {edge ? <View style={styles.clayEdge} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
      {chevron ? <Icon name="chevron-right" size={20} color={colors.ink3} /> : null}
    </Pressable>
  );
}

/**
 * The screen's one big number: a 48 pt numeral (omit `big` for a sentence-only state), a headline
 * line and a secondary sub-line. Pass `onPress` to make the whole card a PressableCard.
 */
export function HeroNumber({
  big, line, sub, onPress, accessibilityHint,
}: {
  big?: string;
  line: string;
  sub: string;
  onPress?: () => void;
  accessibilityHint?: string;
}) {
  // Under ~240 pt wide (200% text) 17 pt "appointment" no longer fits the column and breaks mid-word.
  const winW = useWindowDimensions().width;
  const narrow = winW < 240;
  // 320-wide phones: a smaller numeral tile lets the text sit beside it instead of dropping underneath.
  const compact = winW < 360 && winW >= 240;
  // SE-class heights: one row (small numeral + the line), no sub-line, so the capture prompt stays on the first screen.
  const short = useWindowDimensions().height < 640 && !narrow;
  const tile = short ? 48 : compact ? 60 : 76;
  const body = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: space.md, rowGap: space.xxs }}>
      {big ? (
        <View style={{ minWidth: tile, height: tile, paddingHorizontal: space.sm, borderRadius: 20, backgroundColor: colors.plumTint, alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="numeral" style={short ? { fontSize: 28, lineHeight: 32 } : compact ? { fontSize: 36, lineHeight: 40 } : { fontSize: 48, lineHeight: 52 }}>{big}</Txt>
        </View>
      ) : null}
      {/* flexBasis lets the text drop under the numeral on very narrow screens instead of being squeezed to one letter wide. */}
      <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: short ? 90 : 130, gap: space.xxs }}>
        <Txt variant="headline" style={narrow ? { fontSize: 15, lineHeight: 20 } : undefined}>{line}</Txt>
        {short ? null : <Txt variant="secondary">{sub}</Txt>}
      </View>
    </View>
  );
  if (!onPress) return <Card>{body}</Card>;
  return <PressableCard onPress={onPress} chevron={!narrow} accessibilityHint={accessibilityHint} accessibilityLabel={short ? `${big ?? ''} ${line}. ${sub}` : undefined}>{body}</PressableCard>;
}

/** Icon-in-a-plum-tint-circle + label tile, built to sit two across (flexBasis 48%); a one-tap shortcut. */
export function QuickTile({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.qtile, pressed && { backgroundColor: colors.canvas }]}
    >
      <View aria-hidden style={styles.qicon}><Icon name={icon} size={20} color={colors.ink} /></View>
      <Txt variant="secondary" style={{ flex: 1, color: colors.ink }} maxFontSizeMultiplier={1.4}>{label}</Txt>
    </Pressable>
  );
}

// ---- Rows & text helpers ------------------------------------------------------------------

/**
 * One row of "Here's what I noted" / entry detail: caption label (ink3), Sam's exact phrase in
 * the serif (optional), Atossa's tidy value in body INK (grey label, ink content — V4), chevron
 * when tappable. When the
 * row is empty and `addLabel` is given, it shows an AddFieldChip instead ("+ Add where").
 */
export function NotedRow({
  label, quote, value, onPress, addLabel, first,
}: {
  label: string;
  quote?: string;
  value?: string;
  onPress?: () => void;
  addLabel?: string;
  /** Omit the top divider (first row in a card). */
  first?: boolean;
}) {
  const empty = !quote?.trim() && !value?.trim();
  const inner = (
    <>
      <View style={{ flex: 1, minWidth: 0, gap: space.xxs }}>
        <Txt variant="caption">{label}</Txt>
        {empty && addLabel ? null : (
          <>
            {quote?.trim() ? <Quote>{quote.trim()}</Quote> : null}
            {value?.trim() ? <Txt variant="body">{value.trim()}</Txt> : null}
          </>
        )}
      </View>
      {onPress && !(empty && addLabel) ? <Icon name="chevron-right" size={20} color={colors.ink3} /> : null}
    </>
  );
  const rowStyle = [styles.noted, !first && styles.notedDivider];
  if (empty && addLabel && onPress) {
    return (
      <View style={rowStyle}>
        <View style={{ flex: 1, gap: space.xxs }}>
          <Txt variant="caption">{label}</Txt>
          <AddFieldChip label={addLabel} onPress={onPress} />
        </View>
      </View>
    );
  }
  if (!onPress) return <View style={rowStyle}>{inner}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[label, quote, value].filter(Boolean).join('. ')}
      accessibilityHint="Edit"
      style={({ pressed }) => [...rowStyle, pressed && { opacity: 0.7 }]}
    >
      {inner}
    </Pressable>
  );
}

/** Facts in secondary ink2 joined with " · " (empties skipped). */
export function FactLine({
  parts, numberOfLines, style,
}: { parts: (string | null | undefined | false)[]; numberOfLines?: number; style?: StyleProp<ViewStyle> }) {
  const text = parts.filter((p): p is string => Boolean(p && String(p).trim())).join(' · ');
  if (!text) return null;
  return <Txt variant="secondary" numberOfLines={numberOfLines} style={style as any}>{text}</Txt>;
}

/**
 * Calm empty state: one line in ink2, optional single action. No guilt. `illustration` is for a quiet, wordless SVG only.
 * `icon`: a 32 pt ink3 glyph above the line. `fill`: centre it vertically in the remaining
 * space (give the parent flex: 1 / flexGrow: 1) instead of hanging from the top (V30).
 */
export function EmptyState({
  message, action, icon, illustration, fill, style,
}: {
  message: string;
  /** Replaces the glyph with a decorative node (e.g. a ghost card). */
  illustration?: React.ReactNode;
  action?: { label: string; onPress: () => void };
  icon?: IconName;
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.empty, fill && styles.emptyFill, style]}>
      {illustration ?? (icon ? <Icon name={icon} size={32} color={colors.ink3} /> : null)}
      <Txt variant="body" color={colors.ink2} style={{ textAlign: 'center' }}>{message}</Txt>
      {action ? <Button label={action.label} onPress={action.onPress} style={{ alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

/** App/system error (network, mic permission) — never about the body. */
export function InlineError({ message, onRetry, style }: { message: string; onRetry?: () => void; style?: StyleProp<ViewStyle> }) {
  if (!message) return null;
  return (
    <View style={[styles.error, style]} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Icon name="alert-circle" size={20} color={colors.error} />
      <View style={{ flex: 1, gap: space.xxs }}>
        <Txt style={styles.errorText}>{message}</Txt>
        {onRetry ? <Button label="Try again" variant="text" align="start" onPress={onRetry} /> : null}
      </View>
    </View>
  );
}

export const SAFETY_TEXT = "If you feel very unwell or you’re worried, contact your GP, NHS 111 or 999.";

/** The fixed safety line (Profile + foot of the summary builder). Static: NEVER triggered by content. */
export function SafetyLine({ style }: { style?: StyleProp<ViewStyle> }) {
  return <Txt variant="secondary" style={[{ textAlign: 'center' }, style as any]}>{SAFETY_TEXT}</Txt>;
}

export interface ConfirmAction {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
}

/**
 * In-page confirmation (use instead of Alert.alert, always). Up to 3 actions, stacked.
 * `tone="destructive"` (review 2, N21): a WHITE card with an error hairline; the destructive
 * action (variant 'destructive', or legacy 'primary') is a 48 error-outline button and the rest
 * are quiet text buttons beside it, all in one row — the confirm is clearly the main action, Cancel
 * is clearly the way out. Scroll it into view via onLayout.
 */
export function ConfirmCard({
  title, message, actions, tone = 'neutral', onLayout, style,
}: {
  title: string;
  message?: string;
  actions: ConfirmAction[];
  tone?: 'neutral' | 'destructive';
  onLayout?: (e: LayoutChangeEvent) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const list = actions.slice(0, 3);
  const destructive = tone === 'destructive';
  const confirmIdx = destructive
    ? Math.max(0, list.findIndex((a) => a.variant === 'destructive' || a.variant === 'primary'))
    : -1;
  return (
    <Card onLayout={onLayout} style={[{ gap: space.md }, destructive && { borderColor: colors.error }, style]}>
      <View accessibilityRole="alert" style={{ gap: space.xxs }}>
        <Txt variant="headline">{title}</Txt>
        {message ? <Txt variant="secondary" color={colors.ink}>{message}</Txt> : null}
      </View>
      {destructive ? (
        <View style={styles.confirmRow}>
          {list.map((a, i) => (
            <Button
              key={a.label}
              label={a.label}
              variant={i === confirmIdx ? 'destructiveOutline' : 'text'}
              onPress={a.onPress}
              style={i === confirmIdx ? { flex: 1 } : { paddingHorizontal: space.md }}
            />
          ))}
        </View>
      ) : (
        <View style={{ gap: space.xs }}>
          {list.map((a) => (
            <Button key={a.label} label={a.label} variant={a.variant ?? 'secondary'} onPress={a.onPress} />
          ))}
        </View>
      )}
    </Card>
  );
}

/**
 * Small leading glyph + text row (entry cards' top line: "✎ Wed 24 Sep · 14:10"). The text is
 * caption meta (13 ink3, V11) so it never competes with the quote or fact line; pass
 * `variant="secondary"` for the old 15 ink2 look.
 */
export function GlyphLine({
  icon, text, clay, variant = 'caption',
}: { icon: IconName; text: string; clay?: boolean; variant?: 'caption' | 'secondary' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
      <Icon name={icon} size={20} color={clay ? colors.clay : colors.ink} />
      <Txt variant={variant} style={{ flexShrink: 1 }}>{text}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  qtile: {
    flexBasis: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 56,
    paddingHorizontal: space.sm, paddingVertical: space.xs, borderRadius: 16, backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline,
  },
  qicon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.plumTint, alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1, backgroundColor: colors.canvas },
  column: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', paddingHorizontal: layout.gutter },
  // Ends clear of the toast zone, so a toast never sits over the last action (UX #30).
  scrollContent: { paddingBottom: heights.toastClearance },
  head: { paddingTop: space.sm, marginBottom: space.xl },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.xs, minHeight: 44 },
  right: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: space.xs, flexShrink: 0 },
  footer: { paddingVertical: space.sm, borderTopWidth: 1, borderTopColor: colors.hairline, backgroundColor: colors.canvas },
  // Sunken + ink2 (V31): plum is for actions/selection, so the header's only plum is "+".
  avatar: {
    width: 44, height: 44, borderRadius: radii.pill, backgroundColor: colors.sunken,
    borderWidth: StyleSheet.hairlineWidth * 2, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, color: colors.ink2 },
  back: { flexDirection: 'row', alignItems: 'center', minHeight: 44, alignSelf: 'flex-start', marginLeft: -6, paddingRight: space.xs },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.hairline,
    padding: space.lg, overflow: 'hidden',
  },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  pressable: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: heights.minHit },
  edgePad: { paddingLeft: space.lg + 4 },
  clayEdge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.clay },
  noted: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm, minHeight: heights.minHit },
  notedDivider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  empty: { alignItems: 'center', gap: space.lg, paddingVertical: space.xxxl },
  emptyFill: { flexGrow: 1, justifyContent: 'center', paddingBottom: 80 },
  error: {
    flexDirection: 'row', gap: space.xs, alignItems: 'flex-start', backgroundColor: colors.errorTint,
    borderRadius: radii.input, padding: space.md,
  },
  errorText: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 20, color: colors.error },
});
