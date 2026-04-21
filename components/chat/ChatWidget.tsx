import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';
import { useCycleStore } from '../../stores/cycleStore';
import { sendChatMessage, buildUserContext, type ChatMessage } from '../../lib/aiChat';
import { Icon } from '../ui/Icon';
import { Colors } from '../../constants/colors';
import { FontSize, Radius, Spacing } from '../../constants/theme';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_HEIGHT = Math.min(540, SCREEN_HEIGHT * 0.70);
const TAB_BAR_HEIGHT = 82;
const BUTTON_SIZE = 56;
const BUTTON_BOTTOM = TAB_BAR_HEIGHT + 80; // clears inner nav bars on track/log screens
const MINI_SIZE = 28;

const SUGGESTED = [
  'What phase am I in right now?',
  'Why do I feel tired before my period?',
  'What foods help with cramps?',
  'What are signs of PCOS?',
];

interface Message extends ChatMessage {
  id: string;
  error?: boolean;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(PANEL_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const miniAnim = useRef(new Animated.Value(1)).current; // 1 = full FAB, 0 = mini tab

  const minimize = () => {
    if (isOpen) closePanel();
    Animated.timing(miniAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => setIsMinimized(true));
  };

  const restore = () => {
    setIsMinimized(false);
    Animated.timing(miniAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const profile = useAuthStore((s) => s.profile);
  const { cycleLogs, prediction, symptomLogs } = useCycleStore();

  const openPanel = () => {
    setIsOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closePanel = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: PANEL_HEIGHT,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setIsOpen(false));
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: trimmed,
      };
      const next = [...messages, userMsg];
      setMessages(next);
      setInput('');
      setIsLoading(true);

      try {
        const context = buildUserContext(profile, cycleLogs, prediction, symptomLogs);
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
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Sorry, I couldn't respond: ${msg}`,
            error: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, profile, cycleLogs, prediction, symptomLogs]
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.rowUser : styles.rowAI]}>
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
          ]}
        >
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const isEmpty = messages.length === 0;
  const firstName = profile?.display_name?.split(' ')[0] ?? null;

  return (
    <>
      {/* Overlay: backdrop + sliding panel */}
      {isOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Dim backdrop */}
          <Animated.View
            style={[styles.backdrop, { opacity: backdropAnim }]}
            pointerEvents="auto"
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closePanel} />
          </Animated.View>

          {/* Chat panel */}
          <Animated.View
            style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}
            pointerEvents="box-none"
          >
            {/* Header gradient */}
            <LinearGradient
              colors={['#390517', '#16302B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>A</Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>Ava</Text>
                <Text style={styles.headerSubtitle}>Your health assistant</Text>
              </View>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineLabel}>Online</Text>
              </View>
            </LinearGradient>

            {/* Body */}
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={20}
            >
              {isEmpty ? (
                <View style={styles.emptyState}>
                  <Icon name="sparkles" size={34} color={Colors.whiskey} />
                  <Text style={styles.emptyTitle}>
                    Hi{firstName ? `, ${firstName}` : ''}!
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Ask me anything about your cycle, symptoms, or reproductive health.
                  </Text>
                  <View style={styles.suggestions}>
                    {SUGGESTED.map((q) => (
                      <TouchableOpacity
                        key={q}
                        style={styles.suggestion}
                        onPress={() => sendMessage(q)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.suggestionText}>{q}</Text>
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
                      <View style={[styles.messageRow, styles.rowAI]}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>A</Text>
                        </View>
                        <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
                          <ActivityIndicator size="small" color={Colors.whiskey} />
                        </View>
                      </View>
                    ) : null
                  }
                />
              )}

              {/* Input bar */}
              <View style={styles.inputBar}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask Ava anything..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  maxLength={500}
                  onSubmitEditing={() => sendMessage(input)}
                  returnKeyType="send"
                  blurOnSubmit
                />
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    (!input.trim() || isLoading) && styles.sendBtnDisabled,
                  ]}
                  onPress={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  activeOpacity={0.8}
                >
                  <Icon name="send" size={14} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      )}

      {/* Mini restore tab — shown when minimized */}
      {isMinimized && (
        <TouchableOpacity style={styles.miniTab} onPress={restore} activeOpacity={0.85}>
          <LinearGradient colors={['#6B1530', Colors.cherry]} style={styles.miniTabGradient}>
            <Icon name="message-circle" size={14} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Floating action button */}
      {!isMinimized && (
        <View style={styles.fabWrap}>
          {/* Minimize pill */}
          <TouchableOpacity style={styles.minimizeBtn} onPress={minimize} activeOpacity={0.75}>
            <Icon name="chevron-right" size={12} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fab}
            onPress={isOpen ? closePanel : openPanel}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#6B1530', Colors.cherry]}
              style={styles.fabGradient}
            >
              <Icon name={isOpen ? 'x' : 'message-circle'} size={22} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const PANEL_WIDTH = Math.min(380, SCREEN_WIDTH - 32);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 17, 13, 0.5)',
  },

  panel: {
    position: 'absolute',
    bottom: TAB_BAR_HEIGHT + 8,
    right: Spacing.md,
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 40,
    elevation: 24,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    gap: Spacing.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  headerAvatarText: {
    fontSize: 16,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.white,
  },
  headerInfo: { flex: 1 },
  headerTitle: {
    fontSize: FontSize.md,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Jost_400Regular',
    color: 'rgba(255,255,255,0.72)',
    marginTop: 1,
  },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
  },
  onlineLabel: {
    fontSize: 11,
    fontFamily: 'Jost_400Regular',
    color: 'rgba(255,255,255,0.72)',
  },

  // ── Empty state ─────────────────────────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  emptyIconWrap: { marginBottom: Spacing.xs },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  suggestions: { width: '100%', gap: 6 },
  suggestion: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 9,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
  },
  suggestionText: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_400Regular',
    color: Colors.textSecondary,
  },

  // ── Messages ─────────────────────────────────────────────────────────────────
  messageList: { padding: Spacing.sm, paddingBottom: Spacing.xs, gap: 4 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginVertical: 1 },
  rowUser: { justifyContent: 'flex-end' },
  rowAI: { justifyContent: 'flex-start' },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.cherry,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 11,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.white,
  },
  bubble: {
    maxWidth: '76%',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
  },
  bubbleUser: {
    backgroundColor: Colors.cherry,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: Colors.surfaceElevated,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleError: {
    borderColor: Colors.whiskey,
    backgroundColor: Colors.whiskeyLighter,
  },
  typingBubble: { paddingHorizontal: Spacing.md, paddingVertical: 10 },
  bubbleText: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_400Regular',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bubbleTextUser: { color: Colors.white },

  // ── Input bar ───────────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.sm,
    fontFamily: 'Jost_400Regular',
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    maxHeight: 80,
    minHeight: 40,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cherry,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.38 },
  // ── FAB ─────────────────────────────────────────────────────────────────────
  fabWrap: {
    position: 'absolute',
    bottom: BUTTON_BOTTOM,
    right: Spacing.lg,
    alignItems: 'center',
    gap: 6,
    zIndex: 999,
  },
  minimizeBtn: {
    width: 28,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    overflow: 'hidden',
    shadowColor: Colors.cherry,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Mini restore tab ─────────────────────────────────────────────────────────
  miniTab: {
    position: 'absolute',
    bottom: BUTTON_BOTTOM + (BUTTON_SIZE - MINI_SIZE) / 2,
    right: -4,
    width: MINI_SIZE + 8,
    height: MINI_SIZE + 8,
    borderRadius: (MINI_SIZE + 8) / 2,
    overflow: 'hidden',
    shadowColor: Colors.cherry,
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999,
    opacity: 0.85,
  },
  miniTabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
