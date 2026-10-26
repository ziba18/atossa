// Older kit components kept so auth / onboarding / profile sub-screens keep compiling. They are
// restyled on the new tokens. New screens use ScreenLarge / Button / ConfirmCard instead
// (see design/KIT.md). TextField and SwitchRow are still the right inputs for forms.
import React from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, TextInput, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fonts, heights, layout, radii, space } from '../../../constants/atossaUI';
import { Icon, type IconName } from '../../ui/Icon';
import { Button } from './controls';
import { Card, ConfirmCard, HeaderAvatar } from './layout';
import { FieldLabel } from './FieldLabel';
import { Txt } from './Txt';

// ---- inputs (current) ---------------------------------------------------------------------

/**
 * Labelled text input: 56 tall, radius 14, borderStrong outline, white well. The label is the
 * kit FieldLabel (17/600 ink); `optional` adds " · Optional" inline; `hint` sits under it.
 */
export function TextField({
  label, value, onChangeText, placeholder, multiline, maxLength, hint, error, secret, style, optional, ...inputProps
}: {
  label: string;
  /** Shows " · Optional" inline after the label (same as FieldLabel / RecordDateField). */
  optional?: boolean;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  hint?: string;
  error?: string;
  /** Password field with a Show / Hide button. */
  secret?: boolean;
  style?: StyleProp<ViewStyle>;
} & Pick<TextInputProps, 'keyboardType' | 'autoCapitalize' | 'autoComplete' | 'autoCorrect' | 'autoFocus' | 'returnKeyType' | 'onSubmitEditing' | 'textContentType'>) {
  const [shown, setShown] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={style}>
      <FieldLabel label={label} optional={optional} hint={hint} style={{ marginBottom: 0 }} />
      <View style={secret ? styles.secretRow : null}>
        <TextInput
          {...inputProps}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.ink2}
          multiline={multiline}
          maxLength={maxLength}
          secureTextEntry={secret && !shown}
          accessibilityLabel={label}
          accessibilityHint={error || undefined}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[styles.input, multiline && styles.inputMulti, secret && { flex: 1, minWidth: 0 }, error ? { borderColor: colors.error, borderWidth: 2 } : focused ? styles.inputFocused : null]}
        />
        {secret ? (
          <Pressable
            onPress={() => setShown(!shown)}
            accessibilityRole="button"
            accessibilityLabel={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            style={styles.showBtn}
          >
            <Icon name={shown ? 'eye-off' : 'eye'} size={20} color={colors.ink} />
            <Txt variant="caption" color={colors.ink}>{shown ? 'Hide' : 'Show'}</Txt>
          </Pressable>
        ) : null}
      </View>
      {error ? <Txt variant="secondary" color={colors.error} style={{ marginTop: 6 }} accessibilityRole="alert">{error}</Txt> : null}
    </View>
  );
}

/** A labelled on/off row with a switch. */
/**
 * The kit switch (review 1, UX #15): plum track when on, border-strong track when off (a hairline
 * off-track was invisible), white thumb in both states — including RN-web, whose default thumb is
 * teal. Use this (or SwitchRow) instead of a bare RN Switch.
 */
export function Toggle({
  value, onChange, label, disabled,
}: { value: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  // activeThumbColor / activeTrackColor are RN-web-only props (not in RN's types).
  const webColors = { activeThumbColor: colors.surface, activeTrackColor: colors.plum } as object;
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      aria-checked={value}
      trackColor={{ true: colors.plum, false: colors.borderStrong }}
      thumbColor={colors.surface}
      ios_backgroundColor={colors.borderStrong}
      {...webColors}
    />
  );
}

export function SwitchRow({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1 }}>
        <Txt variant="headline">{label}</Txt>
        {description ? <Txt variant="secondary" style={{ marginTop: 2 }}>{description}</Txt> : null}
      </View>
      <Toggle value={value} onChange={onChange} label={label} />
    </View>
  );
}

// ---- legacy layout ------------------------------------------------------------------------

/** Legacy header row: just the profile avatar, right-aligned. */
export function MainHeader() {
  return (
    <View style={styles.header}>
      <HeaderAvatar />
    </View>
  );
}

/** Legacy screen wrapper (auth, onboarding, profile sub-screens). New tabs use ScreenLarge. */
export function Screen({
  children, header = true, scroll = true, contentStyle, edges = ['top'],
}: {
  children: React.ReactNode;
  header?: boolean;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Screens outside the tab bar (sign-in, onboarding) also need the bottom inset. */
  edges?: ('top' | 'bottom')[];
}) {
  return (
    <SafeAreaView edges={edges} style={styles.screen}>
      {header && <MainHeader />}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.column, styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.column, { flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: space.xs }}>
      <Txt variant="largeTitle" accessibilityRole="header">{title}</Txt>
      {subtitle ? <Txt variant="body" color={colors.ink2} style={{ marginTop: space.xs }}>{subtitle}</Txt> : null}
    </View>
  );
}

export function SectionHeading({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={{ flex: 1 }}>
        <Txt variant="title" accessibilityRole="header">{title}</Txt>
        {subtitle ? <Txt variant="secondary" style={{ marginTop: 2 }}>{subtitle}</Txt> : null}
      </View>
      {right}
    </View>
  );
}

export function Section({ children }: { children: React.ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

// ---- legacy buttons -----------------------------------------------------------------------

type BigButtonVariant = 'primary' | 'outline' | 'destructive' | 'ghost';

/** Legacy 56-tall button. New code: `Button`. */
export function BigButton({
  label, onPress, variant = 'primary', icon, disabled, selected, style, accessibilityLabel, textColor,
}: {
  label: string;
  onPress: () => void;
  variant?: BigButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  /** For toggle buttons: plumTint + 2px plum border when true. */
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  textColor?: string;
}) {
  const on = selected === true;
  const bg = on ? colors.plumTint
    : disabled && variant === 'primary' ? colors.sunken
    : variant === 'primary' ? colors.plum
    : variant === 'destructive' ? colors.error
    : 'transparent';
  const fg = textColor ?? (on ? colors.plum
    : disabled && variant === 'primary' ? colors.ink2
    : variant === 'primary' || variant === 'destructive' ? colors.white
    : colors.ink);
  const border = on ? colors.plum : variant === 'outline' ? colors.borderStrong : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled, selected }}
      style={({ pressed }) => [
        styles.bigButton,
        { backgroundColor: pressed && variant === 'primary' && !on ? colors.plumPressed : bg, borderColor: border, borderWidth: on ? 2 : 1 },
        pressed && variant !== 'primary' && !on && { backgroundColor: colors.sunken },
        disabled && variant !== 'primary' && { opacity: 0.5 },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={20} color={fg} /> : null}
      <Txt variant="headline" color={fg} style={{ flexShrink: 1, textAlign: 'center' }}>{label}</Txt>
    </Pressable>
  );
}

/** Legacy outlined back button. New code: `BackChevron`. */
export function BackButton({ label = 'Back', onPress }: { label?: string; onPress?: () => void }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
    >
      <Icon name="chevron-left" size={24} color={colors.plum} />
      <Txt variant="body" color={colors.plum}>{label}</Txt>
    </Pressable>
  );
}

// ---- misc ---------------------------------------------------------------------------------

/** "Step 2 of 3" with a bar, for onboarding. */
export function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <View accessible accessibilityLabel={`Step ${step} of ${total}`} style={{ marginBottom: space.lg }}>
      <Txt variant="caption">Step {step} of {total}</Txt>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(step / total) * 100}%` }]} />
      </View>
    </View>
  );
}

/** Full-screen "please wait" state. */
export function LoadingScreen({ message }: { message?: string }) {
  return (
    <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center', gap: space.md }]} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.plum} />
      {message ? <Txt variant="body" color={colors.ink2}>{message}</Txt> : null}
    </View>
  );
}

/** Full-screen fallback when something crashed, instead of the app closing. */
export function ErrorScreen({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <View style={[styles.screen, { justifyContent: 'center', padding: space.xl, gap: space.md }]} accessibilityLiveRegion="assertive">
      <Txt variant="title">Something went wrong</Txt>
      <Txt variant="body">Atossa hit a problem on this screen. Please try again.</Txt>
      <Txt variant="secondary" selectable>{error.message || String(error)}</Txt>
      <Button label="Try again" onPress={onRetry} />
    </View>
  );
}

/** Green confirmation line, e.g. "Saved." Prefer showToast() in new code. */
export function SuccessNote({ message }: { message: string }) {
  if (!message) return null;
  return <Txt variant="secondary" color={colors.saved} accessibilityRole="alert" style={{ fontFamily: fonts.medium }}>{message}</Txt>;
}

export function Upcoming() {
  return (
    <View style={styles.upcoming}>
      <Txt variant="caption" color={colors.ink2}>Upcoming</Txt>
    </View>
  );
}

/** Legacy list row. New code: `PressableCard`. */
export function RecordRow({
  title, subtitle, detail, onPress, upcoming, icon,
}: { title: string; subtitle?: string; detail?: string; onPress: () => void; upcoming?: boolean; icon?: IconName }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, upcoming ? 'Upcoming' : ''].filter(Boolean).join('. ')}
      style={({ pressed }) => [styles.recordRow, pressed && { backgroundColor: colors.canvas }]}
    >
      {icon ? <Icon name={icon} size={24} color={colors.ink} /> : null}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.xs }}>
          <Txt variant="headline">{title}</Txt>
          {upcoming ? <Upcoming /> : null}
        </View>
        {subtitle ? <Txt variant="secondary" numberOfLines={2}>{subtitle}</Txt> : null}
        {detail ? <Txt variant="secondary" numberOfLines={4} style={{ marginTop: 4 }}>{detail}</Txt> : null}
      </View>
      <Icon name="chevron-right" size={20} color={colors.ink3} />
    </Pressable>
  );
}

/** Legacy delete confirm. New code: `ConfirmCard tone="destructive"`. */
export function ConfirmDelete({ name, onCancel, onDelete }: { name: string; onCancel: () => void; onDelete: () => void }) {
  return (
    <ConfirmCard
      tone="destructive"
      title={`Delete ${name}?`}
      message="This cannot be undone."
      actions={[
        { label: 'Delete', variant: 'primary', onPress: onDelete },
        { label: 'Cancel', variant: 'secondary', onPress: onCancel },
      ]}
    />
  );
}

export function FutureDateMessage({ onKeep, onChange }: { onKeep: () => void; onChange: () => void }) {
  return (
    <Card tone="sunken">
      <Txt variant="headline">This date is in the future. Is that right?</Txt>
      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
        <BigButton label="Yes, keep it" onPress={onKeep} style={{ flex: 1 }} />
        <BigButton label="Change date" variant="outline" onPress={onChange} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  column: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  scrollContent: { padding: layout.gutter, paddingBottom: space.xxxl },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: layout.gutter, paddingVertical: space.xs },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, marginBottom: space.md },
  section: { marginTop: space.xxl, paddingTop: space.xl, borderTopWidth: 1, borderTopColor: colors.hairline },
  bigButton: {
    minHeight: heights.primary, borderRadius: radii.pill, paddingHorizontal: space.lg, paddingVertical: space.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs,
  },
  back: { flexDirection: 'row', alignItems: 'center', minHeight: 44, alignSelf: 'flex-start', marginLeft: -6, paddingRight: space.xs },
  // Plum 2px focus ring on every platform (RN-web's default is a near-black browser outline; iOS had none).
  inputFocused: { borderColor: colors.plum, borderWidth: 2, paddingHorizontal: space.md - 1, paddingVertical: space.sm - 1, ...({ outlineStyle: 'none' } as object) },
  input: {
    marginTop: space.sm, minHeight: heights.primary, borderRadius: radii.input, borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.surface, paddingHorizontal: space.md, paddingVertical: space.sm,
    fontFamily: fonts.regular, fontSize: 17, color: colors.ink,
  },
  inputMulti: { minHeight: 112, paddingTop: 14 },
  secretRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.xs },
  showBtn: {
    minHeight: heights.primary, minWidth: 72, borderRadius: radii.input, borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xs, gap: 2,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: heights.primary, paddingVertical: space.xs },
  progressTrack: { marginTop: space.xs, height: 8, borderRadius: radii.pill, backgroundColor: colors.sunken, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.plum },
  upcoming: { backgroundColor: colors.sunken, borderRadius: radii.pill, paddingHorizontal: space.xs, paddingVertical: 2 },
  recordRow: {
    minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md,
    borderRadius: radii.card, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface,
  },
});
