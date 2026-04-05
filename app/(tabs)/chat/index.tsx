import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { sendChatMessage, buildUserContext, type ChatMessage } from '../../../lib/aiChat';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius, Shadow } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';

const SUGGESTED_QUESTIONS = [
  'What phase am I in right now?',
  'Why do I feel tired before my period?',
  'What foods help with cramps?',
  'How can I track ovulation?',
  'What are signs of PCOS?',
];

interface Message extends ChatMessage {
  id: string;
  error?: boolean;
}

export default function ChatScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const { cycleLogs, prediction, symptomLogs } = useCycleStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setIsLoading(true);

    try {
      const context = buildUserContext(profile, cycleLogs, prediction, symptomLogs);
      // Only send role/content pairs to the API
      const apiMessages: ChatMessage[] = next.map(({ role, content }) => ({ role, content }));
      const reply = await sendChatMessage(apiMessages, context);

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: reply },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: `Sorry, I couldn't respond: ${msg}`, error: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, profile, cycleLogs, prediction, symptomLogs]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAI]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAI,
            item.error && styles.bubbleError,
            { maxWidth: '78%' },
          ]}
        >
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : { color: theme.text }]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const isEmpty = messages.length === 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient colors={[Colors.cherry, Colors.cherryDark]} style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>A</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>Ava</Text>
          <Text style={styles.headerSubtitle}>Your health assistant</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌸</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Hi, I'm Ava!</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
              Ask me anything about your cycle, symptoms, or reproductive health.
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.suggestion, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => sendMessage(q)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.suggestionText, { color: theme.text }]}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              isLoading ? (
                <View style={[styles.messageRow, styles.messageRowAI]}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>A</Text>
                  </View>
                  <View style={[styles.bubble, styles.bubbleAI, { backgroundColor: theme.surface }]}>
                    <ActivityIndicator size="small" color={Colors.cherry} />
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Ava anything..."
            placeholderTextColor={theme.textMuted}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            blurOnSubmit
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerAvatarText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  headerSubtitle: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 1 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyEmoji: { fontSize: 52, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },
  suggestions: { width: '100%', gap: Spacing.xs },
  suggestion: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  suggestionText: { fontSize: FontSize.sm },

  messageList: { padding: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.sm },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.xs },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAI: { justifyContent: 'flex-start' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.cherry,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  bubble: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  bubbleUser: {
    backgroundColor: Colors.cherry,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleError: {
    borderColor: Colors.whiskey,
    backgroundColor: Colors.whiskeyLighter,
  },
  bubbleText: { fontSize: FontSize.md, lineHeight: 22 },
  bubbleTextUser: { color: Colors.white },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    maxHeight: 120,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cherry,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: FontSize.md, color: Colors.white },
});
