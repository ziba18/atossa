// The chat's "+": attach a photo or file (kept on this phone, never uploaded), or jump to a log.
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Sheet, Txt } from '../kit';
import { colors, radii, space } from '../../../constants/atossaUI';
import { type ChatAttachment, keepAttachment } from '../../../stores/chatStore';
import { Icon, type IconName } from '../../ui/Icon';

// iOS can't present the picker while our sheet is still animating closed.
const AFTER_CLOSE_MS = Platform.OS === 'web' ? 0 : 450;

export function AttachSheet({ visible, onClose, room, onPicked, onError, onLogBleeding, onFullNote }: {
  visible: boolean;
  onClose: () => void;
  /** How many more attachments fit in this message. */
  room: number;
  onPicked: (a: ChatAttachment[]) => void;
  /** Shown on the chat screen (the sheet has already closed by then); '' clears it. */
  onError: (message: string) => void;
  onLogBleeding: () => void;
  onFullNote: () => void;
}) {
  const full = room <= 0;

  const after = (fn: () => void | Promise<void>) => {
    onError('');
    onClose();
    // On web the browser only opens a file chooser straight from the tap.
    if (AFTER_CLOSE_MS === 0) { void fn(); return; }
    setTimeout(() => { void fn(); }, AFTER_CLOSE_MS);
  };

  const keepAll = async (items: Omit<ChatAttachment, 'id'>[]) => {
    if (items.length) onPicked(await Promise.all(items.slice(0, room).map(keepAttachment)));
  };

  const fromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.7, allowsMultipleSelection: room > 1, selectionLimit: room,
    });
    if (res.canceled) return;
    await keepAll(res.assets.map((a) => ({
      kind: 'image' as const, uri: a.uri, name: a.fileName ?? 'Photo.jpg', mimeType: a.mimeType ?? 'image/jpeg',
    })));
  };

  const fromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      onError('Camera access is off. Turn it on in Settings, or choose a photo instead.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (res.canceled) return;
    await keepAll(res.assets.map((a) => ({
      kind: 'image' as const, uri: a.uri, name: a.fileName ?? 'Photo.jpg', mimeType: a.mimeType ?? 'image/jpeg',
    })));
  };

  const fromFiles = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'text/plain'], copyToCacheDirectory: true, multiple: room > 1,
    });
    if (res.canceled) return;
    await keepAll(res.assets.map((a) => ({
      kind: a.mimeType?.startsWith('image/') ? 'image' as const : 'file' as const,
      uri: a.uri, name: a.name, mimeType: a.mimeType,
    })));
  };

  const run = (fn: () => Promise<void>) => after(async () => {
    try { await fn(); } catch { onError('That couldn’t be attached. Try again.'); }
  });

  return (
    <Sheet visible={visible} onClose={onClose} title="Add to your chat">
      <View style={{ gap: space.xxs }}>
        {full ? <Txt variant="secondary">You can add up to 4 things to one message.</Txt> : null}
        <Row icon="image" label="Photo" hint="From your photos" disabled={full} onPress={() => run(fromLibrary)} />
        {Platform.OS !== 'web' ? (
          <Row icon="camera" label="Take a photo" disabled={full} onPress={() => run(fromCamera)} />
        ) : null}
        <Row icon="paperclip" label="File" hint="A PDF, letter or test result" disabled={full} onPress={() => run(fromFiles)} />
        <Txt variant="caption" style={{ marginHorizontal: space.xs, marginBottom: space.xs }}>Photos and files stay on this phone.</Txt>
        <Row icon="droplet" iconColor={colors.clay} label="Log bleeding" onPress={() => after(onLogBleeding)} />
        <Row icon="pen-line" label="Make a full note for my doctor" onPress={() => after(onFullNote)} />
      </View>
    </Sheet>
  );
}

function Row({ icon, iconColor, label, hint, onPress, disabled }: {
  icon: IconName; iconColor?: string; label: string; hint?: string; onPress: () => void; disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.canvas }, disabled && { opacity: 0.5 }]}
    >
      <Icon name={icon} size={24} color={iconColor ?? colors.plum} />
      <View style={{ flex: 1 }}>
        <Txt variant="headline">{label}</Txt>
        {hint ? <Txt variant="secondary">{hint}</Txt> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56,
    paddingHorizontal: space.xs, paddingVertical: space.xs, borderRadius: radii.input,
  },
});
