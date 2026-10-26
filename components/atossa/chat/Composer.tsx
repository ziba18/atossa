// The Today chat composer: one pill — "+" (attach) · her words · mic · send.
// Mic dictates INTO the box (on-device, same hook as the capture sheet); she sends when ready.
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';
import { InlineError, Txt } from '../kit';
import { colors, fonts, radii, space } from '../../../constants/atossaUI';
import { useDictation } from '../../../hooks/useDictation';
import { haptics } from '../../../lib/haptics';
import type { ChatAttachment } from '../../../stores/chatStore';
import { Icon } from '../../ui/Icon';

export interface ComposerHandle { focus: () => void }

export const Composer = forwardRef<ComposerHandle, {
  text: string;
  onChangeText: (t: string) => void;
  attachments: ChatAttachment[];
  onRemoveAttachment: (id: string) => void;
  onAttach: () => void;
  onSend: () => void;
  sending: boolean;
  placeholder: string;
}>(function Composer(
  { text, onChangeText, attachments, onRemoveAttachment, onAttach, onSend, sending, placeholder },
  ref,
) {
  const input = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(false);
  useImperativeHandle(ref, () => ({ focus: () => input.current?.focus() }), []);

  // Dictation appends to whatever was already typed when recording started.
  const prefix = useRef('');
  const dictation = useDictation((t) => {
    const p = prefix.current;
    onChangeText(t.trim() ? (p ? `${p} ${t.trim()}` : t.trim()) : p);
  });
  const { recording } = dictation;
  const wasRecording = useRef(false);
  useEffect(() => {
    if (wasRecording.current !== recording) haptics.light();
    wasRecording.current = recording;
  }, [recording]);
  useEffect(() => () => dictation.cancel(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMic = () => {
    if (recording) { dictation.stop(); return; }
    prefix.current = text.trim();
    dictation.clearError();
    dictation.start();
  };

  const canSend = (text.trim() !== '' || attachments.length > 0) && !sending;
  const send = () => {
    if (!canSend) return;
    if (recording) dictation.cancel();
    onSend();
  };

  return (
    <View style={{ gap: space.xs }}>
      <InlineError message={dictation.error} />
      <View style={[styles.pill, focused && styles.pillFocused]}>
        {attachments.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachRow}>
            {attachments.map((a) => (
              <View key={a.id} style={styles.attachment}>
                {a.kind === 'image'
                  ? <Image source={{ uri: a.uri }} style={styles.thumb} accessibilityIgnoresInvertColors />
                  : <Icon name="file-text" size={20} color={colors.ink2} />}
                <Txt variant="caption" numberOfLines={1} style={styles.attachName}>{a.kind === 'image' ? 'Photo' : a.name}</Txt>
                <Pressable
                  onPress={() => onRemoveAttachment(a.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${a.kind === 'image' ? 'photo' : a.name}`}
                  hitSlop={12}
                  style={styles.remove}
                >
                  <Icon name="x" size={20} color={colors.ink} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}
        <View style={styles.row}>
          <RoundIcon icon="plus" label="Add a photo, file or log" onPress={onAttach} />
          <TextInput
            ref={input}
            value={text}
            onChangeText={onChangeText}
            placeholder={recording ? 'Listening…' : placeholder}
            placeholderTextColor={colors.ink2}
            multiline
            // RN-web renders a 2-row textarea by default; start at one line like native.
            {...(Platform.OS === 'web' ? { rows: 1 } : {})}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
            accessibilityLabel="Your message"
          />
          {/* Browsers can't dictate here: the web pilot hides the mic rather than showing a dead button. */}
          {Platform.OS === 'web' && !dictation.supported ? null : (
            <RoundIcon
              icon={recording ? 'square' : 'mic'}
              label={recording ? 'Stop dictating' : 'Dictate'}
              onPress={toggleMic}
              active={recording}
            />
          )}
          <Pressable
            onPress={send}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: !canSend }}
            style={({ pressed }) => [
              styles.send,
              { backgroundColor: !canSend ? colors.sunken : pressed ? colors.plumPressed : colors.plum },
            ]}
          >
            <Icon name="arrow-up" size={20} color={canSend ? colors.white : colors.ink2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

function RoundIcon({ icon, label, onPress, active }: {
  icon: 'plus' | 'mic' | 'square'; label: string; onPress: () => void; active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.round,
        active ? { backgroundColor: colors.plumTint } : pressed && { backgroundColor: colors.sunken },
      ]}
    >
      <Icon name={icon} size={24} color={colors.plum} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radii.sheet,
    padding: space.xxs,
  },
  /** Plum 2px ring on focus (replaces the browser's near-black outline); padding keeps the content still. */
  pillFocused: { borderWidth: 2, borderColor: colors.plum, padding: space.xxs - 1 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.xxs, paddingBottom: space.xxs / 2 },
  round: { width: 44, height: 44, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 160,
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: space.xxs,
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 22,
    color: colors.ink,
  },
  send: { width: 40, height: 40, margin: 2, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  attachRow: { gap: space.xs, padding: space.xs },
  attachment: {
    flexDirection: 'row', alignItems: 'center', gap: space.xs, maxWidth: 220,
    backgroundColor: colors.canvas, borderRadius: radii.input, paddingLeft: space.xs, height: 52,
  },
  thumb: { width: 40, height: 40, borderRadius: 10 },
  attachName: { flexShrink: 1, color: colors.ink2 },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
