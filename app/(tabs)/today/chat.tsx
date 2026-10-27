// Talk it through — secondary chat reached from Today (the home screen is capture-first).
// ChatGPT-style: ☰ opens past chats (kept on this phone), the composer has
// "+" (photo / file / log), dictation and send. Replies come from Sage (POST /chat), which never
// diagnoses. Any chat can become a structured note for the GP through the capture sheet.
import React, { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { CHAT_ENABLED } from '../../../lib/features';
import { Button, IconButton, InlineError, Txt, curly } from '../../../components/atossa/kit';
import { LogBleedingSheet } from '../../../components/atossa/LogBleedingSheet';
import { AttachSheet } from '../../../components/atossa/chat/AttachSheet';
import { ChatDrawer } from '../../../components/atossa/chat/ChatDrawer';
import { Composer, type ComposerHandle } from '../../../components/atossa/chat/Composer';
import { Icon } from '../../../components/ui/Icon';
import { colors, layout, radii, space } from '../../../constants/atossaUI';
import { openCapture } from '../../../lib/captureStore';
import { haptics } from '../../../lib/haptics';
import { isHumanName } from '../../../lib/humanName';
import { STARTER_CHIPS } from '../../../lib/records/fields';
import { useAuthStore } from '../../../stores/authStore';
import { type ChatAttachment, type ChatMessage, useChatStore } from '../../../stores/chatStore';

const PROMPT = 'What’s been going on with your body?';
/** Always broken evenly, as in the Lovable design (a balanced two-line prompt). */
const PROMPT_LINES = 'What’s been going on\nwith your body?';
const DEFAULT_PLACEHOLDER = 'Your words…';
/** Starter chips only change the hint; they never put words in her mouth. */
const CHIP_PLACEHOLDER: Record<string, string> = {
  'Pain today': 'Where is the pain?',
  'Something new': 'What’s new?',
  'Just a quick note': 'Write a quick note',
};
const MAX_ATTACHMENTS = 4;

function greeting(name: string | null | undefined): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
  const first = isHumanName(name) ? name!.trim().split(/\s+/)[0] : '';
  return first ? `${part}, ${first}` : part;
}

export default function ChatRoute() {
  // A saved link or old navigation state must not reach the chat while it is switched off.
  if (!CHAT_ENABLED) return <Redirect href={'/(tabs)/today' as any} />;
  return <ChatScreen />;
}

function ChatScreen() {
  const router = useRouter();
  const name = useAuthStore((s) => s.profile?.display_name);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const chat = useChatStore((s) => s.chats.find((c) => c.id === s.activeId));
  const sending = useChatStore((s) => s.sending);
  const error = useChatStore((s) => s.error);

  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [placeholder, setPlaceholder] = useState(DEFAULT_PLACEHOLDER);
  const [drawer, setDrawer] = useState(false);
  const [attach, setAttach] = useState(false);
  const [bleeding, setBleeding] = useState(false);
  const [attachError, setAttachError] = useState('');
  const composer = useRef<ComposerHandle>(null);
  const scroll = useRef<ScrollViewInstance>(null);

  useEffect(() => { useChatStore.getState().load(userId); }, [userId]);

  // A different chat (or a new one) starts with an empty box.
  const chatId = chat?.id ?? null;
  useEffect(() => { setText(''); setAttachments([]); setPlaceholder(DEFAULT_PLACEHOLDER); }, [chatId]);

  const messages = chat?.messages ?? [];
  const empty = messages.length === 0;

  const send = () => {
    const words = text;
    const files = attachments;
    setText('');
    setAttachments([]);
    setPlaceholder(DEFAULT_PLACEHOLDER);
    useChatStore.getState().send(words, files);
  };

  const saveAsNote = () => {
    const words = messages.filter((m) => m.role === 'user' && m.text.trim()).map((m) => m.text.trim()).join(' ');
    openCapture({ mode: 'type', words });
  };

  const openProfile = () => router.push({ pathname: '/(tabs)/profile', params: { from: 'Today' } } as any);

  const lastIsReply = messages.length > 0 && messages[messages.length - 1].role === 'assistant';
  const hasHerWords = messages.some((m) => m.role === 'user' && m.text.trim());

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={[styles.column, styles.header]}>
        <IconButton icon="chevron-left" label="Back to Today" color={colors.plum} onPress={() => router.back()} />
        <Txt variant="headline" accessibilityRole="header" style={styles.headerTitle}>Talk it through</Txt>
        <View style={styles.headerRight}>
          {!empty ? (
            <IconButton icon="square-pen" label="New chat" color={colors.plum} onPress={() => useChatStore.getState().newChat()} />
          ) : null}
          <IconButton icon="menu" label="Open chats" color={colors.plum} onPress={() => setDrawer(true)} />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {empty ? (
          <ScrollView contentContainerStyle={[styles.column, styles.emptyBody]} keyboardShouldPersistTaps="handled">
            <Txt variant="body" color={colors.ink2} style={styles.center}>{greeting(name)}</Txt>
            <Txt variant="hero" style={[styles.center, { marginTop: space.sm }]} accessibilityLabel={PROMPT}>
              {PROMPT_LINES}
            </Txt>
            <View style={styles.starters} accessibilityLabel="Ways to start">
              {STARTER_CHIPS.map((label) => (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  onPress={() => {
                    haptics.selection();
                    if (label === 'My period') { setBleeding(true); return; }
                    setPlaceholder(CHIP_PLACEHOLDER[label] ?? DEFAULT_PLACEHOLDER);
                    composer.current?.focus();
                  }}
                  style={({ pressed }) => [styles.starter, pressed && { backgroundColor: colors.sunken }]}
                >
                  <Txt variant="secondary" color={colors.plum} style={styles.center} maxFontSizeMultiplier={1.6}>{label}</Txt>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            ref={scroll}
            contentContainerStyle={[styles.column, styles.thread]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((m) => <Message key={m.id} message={m} />)}
            {sending ? (
              <View style={styles.thinking} accessibilityLiveRegion="polite">
                <Txt variant="secondary">Writing a reply…</Txt>
              </View>
            ) : null}
            <InlineError message={error} onRetry={() => useChatStore.getState().retry()} />
            {lastIsReply && !sending && hasHerWords ? (
              <View style={styles.actions}>
                <Button
                  label="Save as a note for my doctor"
                  variant="text"
                  small
                  icon="plus"
                  align="start"
                  onPress={saveAsNote}
                  accessibilityHint="Opens your words as a note you can check before saving"
                />
              </View>
            ) : null}
          </ScrollView>
        )}

        <View style={[styles.column, styles.footer]}>
          <InlineError message={attachError} style={{ marginBottom: space.xs }} />
          <Composer
            ref={composer}
            text={text}
            onChangeText={setText}
            attachments={attachments}
            onRemoveAttachment={(id) => setAttachments((a) => a.filter((x) => x.id !== id))}
            onAttach={() => setAttach(true)}
            onSend={send}
            sending={sending}
            placeholder={placeholder}
          />
          <Txt variant="caption" style={[styles.center, { marginTop: space.xs }]}>
            Replies are written by an AI and can contain mistakes. Atossa can’t diagnose. If you feel very unwell, contact your GP, NHS 111 or 999.
          </Txt>
        </View>
      </KeyboardAvoidingView>

      <ChatDrawer visible={drawer} onClose={() => setDrawer(false)} onOpenProfile={openProfile} />
      <AttachSheet
        visible={attach}
        onClose={() => setAttach(false)}
        room={MAX_ATTACHMENTS - attachments.length}
        onPicked={(picked) => setAttachments((a) => [...a, ...picked].slice(0, MAX_ATTACHMENTS))}
        onError={setAttachError}
        onLogBleeding={() => setBleeding(true)}
        onFullNote={() => openCapture({ mode: 'type' })}
      />
      <LogBleedingSheet visible={bleeding} onClose={() => setBleeding(false)} />
    </SafeAreaView>
  );
}

function Message({ message: m }: { message: ChatMessage }) {
  if (m.role === 'assistant') {
    return <Txt style={styles.reply} selectable>{m.text}</Txt>;
  }
  return (
    <View style={styles.mine}>
      {m.attachments?.map((a) => (
        a.kind === 'image' ? (
          <Image key={a.id} source={{ uri: a.uri }} style={styles.photo} accessibilityLabel="Your photo" accessibilityIgnoresInvertColors />
        ) : (
          <View key={a.id} style={styles.file} accessibilityLabel={`File: ${a.name}`}>
            <Icon name="file-text" size={20} color={colors.ink2} />
            <Txt variant="secondary" numberOfLines={1} style={{ flexShrink: 1 }}>{a.name}</Txt>
          </View>
        )
      ))}
      {m.text ? (
        <View style={styles.bubble}>
          {/* Her own words: the serif, as everywhere else in the app. */}
          <Txt variant="quote" selectable>{curly(m.text)}</Txt>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  column: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', paddingHorizontal: layout.gutter },
  header: {
    flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: space.sm,
    borderBottomWidth: 1, borderBottomColor: colors.hairline,
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.xxs },
  center: { textAlign: 'center' },
  emptyBody: { flexGrow: 1, justifyContent: 'center', paddingVertical: space.xxl },
  starters: {
    flexDirection: 'row', flexWrap: 'wrap', gap: space.xs + space.xxs / 2, marginTop: space.xxl,
    width: '100%', maxWidth: 350, alignSelf: 'center',
  },
  starter: {
    flexBasis: '45%', flexGrow: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: space.sm, paddingVertical: space.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, borderRadius: radii.input,
  },
  thread: { paddingTop: space.xl, paddingBottom: space.xxl, gap: space.xl + space.xxs },
  reply: { alignSelf: 'stretch' },
  mine: { alignSelf: 'flex-end', alignItems: 'flex-end', maxWidth: '88%', gap: space.xs },
  bubble: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, borderRadius: radii.card,
    paddingHorizontal: space.md, paddingVertical: space.sm + space.xxs / 2,
  },
  photo: { width: 200, height: 200, borderRadius: radii.input, backgroundColor: colors.sunken },
  file: {
    flexDirection: 'row', alignItems: 'center', gap: space.xs, maxWidth: 260,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, borderRadius: radii.input,
    paddingHorizontal: space.sm, height: 44,
  },
  thinking: { alignSelf: 'flex-start' },
  actions: { alignItems: 'flex-start', marginTop: -space.md },
  footer: { paddingTop: space.xs, paddingBottom: space.sm },
});
