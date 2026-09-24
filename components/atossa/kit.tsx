import React from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet, ScrollView,
  type TextProps, type TextStyle, type ViewStyle, type StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { UI } from '../../constants/atossaUI';
import { Icon, type IconName } from '../ui/Icon';
import { useAuthStore } from '../../stores/authStore';
import { headerDate } from '../../lib/records/dates';

const C = UI.colors;

// ---- text ---------------------------------------------------------------------------------

type Variant = 'display' | 'h2' | 'h3' | 'body' | 'bodyBold' | 'small' | 'smallBold' | 'tiny';

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: UI.font.display, fontSize: UI.size.display, lineHeight: 44, color: C.foreground },
  h2: { fontFamily: UI.font.bold, fontSize: UI.size.h2, lineHeight: 30, color: C.foreground },
  h3: { fontFamily: UI.font.bold, fontSize: UI.size.h3, lineHeight: 26, color: C.foreground },
  body: { fontFamily: UI.font.body, fontSize: UI.size.body, lineHeight: 28, color: C.foreground },
  bodyBold: { fontFamily: UI.font.bold, fontSize: UI.size.body, lineHeight: 26, color: C.foreground },
  small: { fontFamily: UI.font.body, fontSize: UI.size.small, lineHeight: 24, color: C.mutedForeground },
  smallBold: { fontFamily: UI.font.bold, fontSize: UI.size.small, lineHeight: 22, color: C.foreground },
  tiny: { fontFamily: UI.font.body, fontSize: UI.size.tiny, lineHeight: 20, color: C.mutedForeground },
};

export function Txt({ variant = 'body', color, style, ...props }: TextProps & { variant?: Variant; color?: string }) {
  return <Text {...props} style={[VARIANTS[variant], color ? { color } : null, style]} />;
}

// ---- layout -------------------------------------------------------------------------------

export function MainHeader() {
  const router = useRouter();
  const name = useAuthStore((s) => s.profile?.display_name);
  const initial = (name?.trim()?.[0] ?? 'A').toUpperCase();
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.logoCircle}>
          <Txt variant="h3" color={C.primaryForeground}>A</Txt>
        </View>
        <Txt style={styles.wordmark}>Atossa</Txt>
      </View>
      <View style={styles.headerRight}>
        <Txt variant="smallBold" color={C.mutedForeground}>{headerDate()}</Txt>
        <Pressable
          onPress={() => router.push('/(tabs)/profile' as any)}
          accessibilityRole="button"
          accessibilityLabel="Open profile and settings"
          style={styles.profileBtn}
        >
          <Txt variant="smallBold" color={C.accentForeground}>{initial}</Txt>
        </Pressable>
      </View>
    </View>
  );
}

export function Screen({
  children, header = true, scroll = true, contentStyle,
}: { children: React.ReactNode; header?: boolean; scroll?: boolean; contentStyle?: StyleProp<ViewStyle> }) {
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {header && <MainHeader />}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Txt variant="display">{title}</Txt>
      {subtitle ? <Txt variant="body" color={C.mutedForeground} style={{ marginTop: 6 }}>{subtitle}</Txt> : null}
    </View>
  );
}

export function SectionHeading({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={{ flex: 1 }}>
        <Txt variant="h2">{title}</Txt>
        {subtitle ? <Txt variant="body" color={C.mutedForeground} style={{ marginTop: 2 }}>{subtitle}</Txt> : null}
      </View>
      {right}
    </View>
  );
}

export function Section({ children }: { children: React.ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

// ---- buttons ------------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'outline' | 'destructive' | 'ghost';

export function BigButton({
  label, onPress, variant = 'primary', icon, disabled, selected, style, accessibilityLabel, textColor,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  /** For toggle buttons: filled + strong border when true. */
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  textColor?: string;
}) {
  const isToggleOn = selected === true;
  const bg =
    isToggleOn ? C.primary
    : variant === 'primary' ? C.primary
    : variant === 'destructive' ? C.destructive
    : variant === 'ghost' ? 'transparent'
    : C.card;
  const fg =
    textColor ??
    (variant === 'destructive' && !isToggleOn ? C.white : variant === 'primary' || isToggleOn ? C.primaryForeground : C.foreground);
  const border = isToggleOn ? C.primaryStrong : variant === 'outline' ? C.border : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled, selected: selected }}
      style={({ pressed }) => [
        styles.bigButton,
        { backgroundColor: bg, borderColor: border, borderWidth: isToggleOn ? 2 : 1, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={22} color={fg} strokeWidth={2.2} /> : null}
      <Txt variant="bodyBold" color={fg} style={{ flexShrink: 1, textAlign: 'center' }}>{label}</Txt>
    </Pressable>
  );
}

export function BackButton({ label = 'Back to Dashboard', onPress }: { label?: string; onPress?: () => void }) {
  const router = useRouter();
  return (
    <BigButton
      label={label}
      variant="outline"
      icon="arrow-left"
      onPress={onPress ?? (() => router.back())}
      style={{ alignSelf: 'flex-start', paddingHorizontal: 20 }}
    />
  );
}

// ---- inputs -------------------------------------------------------------------------------

export function TextField({
  label, value, onChangeText, placeholder, multiline, maxLength, hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  hint?: string;
}) {
  return (
    <View>
      <Txt variant="bodyBold">{label}</Txt>
      {hint ? <Txt variant="small">{hint}</Txt> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8b8079"
        multiline={multiline}
        maxLength={maxLength}
        accessibilityLabel={label}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.inputMulti]}
      />
    </View>
  );
}

// ---- cards & rows -------------------------------------------------------------------------

export function Card({ children, tone, style }: { children: React.ReactNode; tone?: 'coral' | 'blue' | 'green' | 'plain'; style?: StyleProp<ViewStyle> }) {
  const bg = tone === 'coral' ? C.coralSoft : tone === 'blue' ? C.blueSoft : tone === 'green' ? C.secondary : C.card;
  return <View style={[styles.card, { backgroundColor: bg }, style]}>{children}</View>;
}

export function Upcoming() {
  return (
    <View style={styles.upcoming}>
      <Txt variant="smallBold" color={C.accentForeground}>Upcoming</Txt>
    </View>
  );
}

export function RecordRow({
  title, subtitle, detail, onPress, upcoming, icon,
}: { title: string; subtitle?: string; detail?: string; onPress: () => void; upcoming?: boolean; icon?: IconName }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, upcoming ? 'Upcoming' : ''].filter(Boolean).join('. ')}
      style={({ pressed }) => [styles.recordRow, pressed && { opacity: 0.85 }]}
    >
      {icon ? (
        <View style={styles.recordIcon}><Icon name={icon} size={24} color={C.accentForeground} /></View>
      ) : null}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Txt variant="bodyBold">{title}</Txt>
          {upcoming ? <Upcoming /> : null}
        </View>
        {subtitle ? <Txt variant="small" numberOfLines={2}>{subtitle}</Txt> : null}
        {detail ? <Txt variant="small" numberOfLines={4} style={{ marginTop: 4 }}>{detail}</Txt> : null}
      </View>
      <Icon name="chevron-right" size={24} color={C.foreground} />
    </Pressable>
  );
}

export function ConfirmDelete({ name, onCancel, onDelete }: { name: string; onCancel: () => void; onDelete: () => void }) {
  return (
    <View style={[styles.card, { backgroundColor: C.coralSoft, borderColor: C.destructive }]} accessibilityRole="alert">
      <Txt variant="bodyBold">Delete {name}?</Txt>
      <Txt variant="small" color={C.foreground} style={{ marginTop: 4 }}>This cannot be undone.</Txt>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <BigButton label="Cancel" variant="outline" onPress={onCancel} style={{ flex: 1 }} />
        <BigButton label="Delete" variant="destructive" onPress={onDelete} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

export function FutureDateMessage({ onKeep, onChange }: { onKeep: () => void; onChange: () => void }) {
  return (
    <View style={[styles.card, { backgroundColor: C.blueSoft }]}>
      <Txt variant="bodyBold">This date is in the future. Is that right?</Txt>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <BigButton label="Yes, keep it" onPress={onKeep} style={{ flex: 1 }} />
        <BigButton label="Change date" variant="outline" onPress={onChange} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

export function InlineError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={[styles.card, { backgroundColor: C.coralSoft, borderColor: C.destructive }]} accessibilityRole="alert">
      <Txt variant="bodyBold" color={C.destructive}>{message}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  scrollContent: { padding: UI.gutter, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: UI.gutter, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.background,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontFamily: UI.font.display, fontSize: 30, color: C.foreground },
  profileBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 16 },
  section: { marginTop: 32, paddingTop: 28, borderTopWidth: 1, borderTopColor: C.border },
  bigButton: {
    minHeight: UI.minTap, borderRadius: UI.radius, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  input: {
    marginTop: 8, minHeight: UI.minTap, borderRadius: UI.radius, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.background, paddingHorizontal: 16, paddingVertical: 12,
    fontFamily: UI.font.body, fontSize: UI.size.body, color: C.foreground,
  },
  inputMulti: { minHeight: 112, paddingTop: 14 },
  card: { borderRadius: UI.radius, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, padding: 16 },
  upcoming: { backgroundColor: C.blueSoft, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  recordRow: {
    minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    borderRadius: UI.radius, borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  recordIcon: {
    width: 48, height: 48, borderRadius: UI.radius, backgroundColor: C.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
});
