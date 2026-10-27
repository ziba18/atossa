// Chat history, ChatGPT-style: a panel from the left with New chat, search, and past chats
// grouped by day. Long-press a chat to delete it (in-page ConfirmCard, never Alert.alert).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmCard, IconButton, Txt, useReduceMotion } from '../kit';
import { colors, fonts, motion, radii, space } from '../../../constants/atossaUI';
import { addDays, todayKey } from '../../../lib/records/dates';
import { formatDay } from '../../../lib/records/format';
import { type Chat, useChatStore } from '../../../stores/chatStore';
import { Icon } from '../../ui/Icon';

const pad = (n: number) => String(n).padStart(2, '0');
const localKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function groupLabel(key: string): string {
  const today = todayKey();
  if (key >= today) return 'Today';
  if (key === addDays(today, -1)) return 'Yesterday';
  if (key > addDays(today, -7)) return 'Previous 7 days';
  return formatDay(key).replace(/^\w+ \d+ /, ''); // "Sep" / "Sep 2025" — month groups
}

export function ChatDrawer({ visible, onClose, onOpenProfile }: {
  visible: boolean; onClose: () => void; onOpenProfile: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(320, width * 0.84);
  const reduceMotion = useReduceMotion();
  const chats = useChatStore((s) => s.chats);
  const activeId = useChatStore((s) => s.activeId);
  const { newChat, select, remove } = useChatStore.getState();
  const [query, setQuery] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const x = useRef(new Animated.Value(-panelWidth)).current;
  const [mounted, setMounted] = useState(visible);
  useEffect(() => {
    if (visible) setMounted(true);
    // Like the kit Sheet: on web, unmount at once — a fading-out modal layer swallowed the next tap.
    if (!visible && Platform.OS === 'web') {
      x.setValue(-panelWidth); setMounted(false); setConfirmId(null); setQuery('');
      return;
    }
    Animated.timing(x, {
      toValue: visible ? 0 : -panelWidth,
      duration: reduceMotion ? 0 : motion.sheet,
      useNativeDriver: true,
    }).start(({ finished }) => { if (finished && !visible) { setMounted(false); setConfirmId(null); setQuery(''); } });
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = [...chats]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .filter((c) => !q || c.title.toLowerCase().includes(q)
        || c.messages.some((m) => m.text.toLowerCase().includes(q)));
    const out: { label: string; chats: Chat[] }[] = [];
    for (const c of found) {
      const label = groupLabel(localKey(c.updatedAt));
      const last = out[out.length - 1];
      if (last?.label === label) last.chats.push(c);
      else out.push({ label, chats: [c] });
    }
    return out;
  }, [chats, query]);

  const pick = (fn: () => void) => { fn(); onClose(); };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close chats" />
      <Animated.View
        style={[styles.panel, { width: panelWidth, paddingTop: insets.top + space.xs, paddingBottom: insets.bottom + space.xs, transform: [{ translateX: x }] }]}
        accessibilityViewIsModal
      >
        <View style={styles.head}>
          <Txt variant="title" accessibilityRole="header">Your chats</Txt>
          <IconButton icon="x" label="Close chats" onPress={onClose} />
        </View>

        <Pressable
          onPress={() => pick(newChat)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, styles.newRow, pressed && { backgroundColor: colors.sunken }]}
        >
          <Icon name="square-pen" size={20} color={colors.plum} />
          <Txt variant="headline" color={colors.plum}>New chat</Txt>
        </Pressable>

        <View style={styles.search}>
          <Icon name="search" size={20} color={colors.ink2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search chats"
            placeholderTextColor={colors.ink2}
            style={styles.searchInput}
            accessibilityLabel="Search chats"
            returnKeyType="search"
          />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space.md }} keyboardShouldPersistTaps="handled">
          {groups.length === 0 ? (
            <Txt variant="secondary" style={styles.empty}>
              {query.trim() ? 'No chats match that.' : 'Your chats will appear here. They stay on this phone.'}
            </Txt>
          ) : groups.map((g) => (
            <View key={g.label}>
              <Txt variant="caption" style={styles.group}>{g.label}</Txt>
              {g.chats.map((c) => (
                confirmId === c.id ? (
                  <ConfirmCard
                    key={c.id}
                    tone="destructive"
                    title="Delete this chat?"
                    message="It will be removed from this phone. Notes you saved for your doctor stay."
                    actions={[
                      { label: 'Delete', variant: 'destructive', onPress: () => { remove(c.id); setConfirmId(null); } },
                      { label: 'Cancel', variant: 'text', onPress: () => setConfirmId(null) },
                    ]}
                  />
                ) : (
                  <View key={c.id} style={[styles.chatRow, c.id === activeId && { backgroundColor: colors.plumTint }]}>
                  <Pressable
                    onPress={() => pick(() => select(c.id))}
                    onLongPress={() => setConfirmId(c.id)}
                    accessibilityRole="button"
                    accessibilityLabel={c.title}
                    accessibilityState={{ selected: c.id === activeId }}
                    accessibilityHint="Opens the chat. Long press to delete it."
                    accessibilityActions={[{ name: 'delete', label: 'Delete chat' }]}
                    onAccessibilityAction={(e) => { if (e.nativeEvent.actionName === 'delete') setConfirmId(c.id); }}
                    style={({ pressed }) => [styles.row, { flex: 1 }, pressed && { backgroundColor: colors.sunken }]}
                  >
                    <Icon name="message-circle" size={20} color={colors.ink2} />
                    <Txt variant="secondary" color={colors.ink} numberOfLines={1} style={{ flex: 1 }}>{c.title}</Txt>
                  </Pressable>
                  <IconButton icon="more-horizontal" size={20} color={colors.plum} label={`Delete chat: ${c.title}`} onPress={() => setConfirmId(c.id)} />
                  </View>
                )
              ))}
            </View>
          ))}
        </ScrollView>

        <Pressable
          onPress={() => pick(onOpenProfile)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, styles.footer, pressed && { backgroundColor: colors.sunken }]}
        >
          <Icon name="settings" size={20} color={colors.plum} />
          <Txt color={colors.plum}>Profile and settings</Txt>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.scrim },
  panel: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    backgroundColor: colors.canvas,
    borderTopRightRadius: radii.card, borderBottomRightRadius: radii.card,
    paddingHorizontal: space.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: space.xs, marginBottom: space.xs },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    minHeight: 44, paddingHorizontal: space.sm, borderRadius: radii.input,
  },
  newRow: { marginBottom: space.xs },
  chatRow: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.input, marginBottom: space.xxs / 2 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: space.xs, height: 44,
    paddingHorizontal: space.sm, borderRadius: radii.input, backgroundColor: colors.sunken, marginBottom: space.xs,
  },
  searchInput: { flex: 1, height: 44, fontFamily: fonts.regular, fontSize: 17, color: colors.ink },
  group: { paddingHorizontal: space.sm, marginTop: space.md, marginBottom: space.xxs },
  empty: { paddingHorizontal: space.sm, marginTop: space.md },
  footer: { borderTopWidth: 1, borderTopColor: colors.hairline, borderRadius: 0, marginTop: space.xs, paddingTop: space.xs },
});
