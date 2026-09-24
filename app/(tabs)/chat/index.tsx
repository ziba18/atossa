import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, Alert, KeyboardAvoidingView, Platform,
  SafeAreaView, Image, AppState, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { useAuthStore } from '../../../stores/authStore';
import { api, ApiError } from '../../../lib/api';
import { isHumanName } from '../../../lib/humanName';

const BG       = '#f7f3eb';
const COMPOSER = '#ede7d9';
const CARD     = '#fdf8f1';
const PINK     = '#8ea38c';
const PINK_DEEP = '#3a4d39';
const PINK_SOFT = '#e2d5c3';
const INK      = '#1c1e1c';
const MUTED    = '#7a6e60';

interface Message {
  id: string;
  type: 'ai' | 'user';
  text: string;
  imageUri?: string;
  audioUri?: string;
  audioDurationMs?: number;
}

const greeting = (name?: string | null): Message => ({
  id: '0',
  type: 'ai',
  text: `Hello ${isHumanName(name) ? name!.trim() : 'there'}! How are you feeling today?`,
});

const MODAL_CARDS: { icon: IconName; label: string; sub: string }[] = [
  { icon: 'mic',       label: 'Voice',      sub: 'Describe pain in your words' },
  { icon: 'camera',    label: 'Image',      sub: 'Scan results, lab reports' },
  { icon: 'data-import', label: 'External Data', sub: 'HRV, sleep, temperature' },
  { icon: 'cycle',       label: 'Cycle data',    sub: 'Hormones, flow, phases' },
  { icon: 'calendar',    label: 'Period Log',    sub: 'Log any day, past or present' },
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const displayName = useAuthStore((s) => s.profile?.display_name);
  const [messages, setMessages] = useState<Message[]>([greeting(displayName)]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [pain, setPain]         = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingStartRef = useRef<number>(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    setMessages(prev =>
      prev[0]?.id === '0' ? [greeting(displayName), ...prev.slice(1)] : prev
    );
  }, [displayName]);

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    const userMsg: Message = { id: Date.now().toString(), type: 'user', text };
    // Text turns only (skip the local greeting, images and voice notes) — the backend
    // expects alternating user/assistant text and the last entry to be the user's.
    const history = [...messages, userMsg]
      .filter(m => m.id !== '0' && m.text)
      .map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.text }));
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    inputRef.current?.blur();
    Keyboard.dismiss();
    setThinking(true);
    try {
      const { reply } = await api.post<{ reply: string }>('/chat', { messages: history.slice(-20) });
      setMessages(prev => [...prev, { id: `${Date.now()}-ai`, type: 'ai', text: reply }]);
    } catch (err) {
      const text =
        err instanceof ApiError && err.status === 429
          ? 'I’m a little busy right now — give me a moment and try again.'
          : 'I couldn’t reply just now. Please try again.';
      setMessages(prev => [...prev, { id: `${Date.now()}-err`, type: 'ai', text }]);
    } finally {
      setThinking(false);
    }
  };

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, thinking]);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera access needed', 'Enable camera access in Settings to scan photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled || !result.assets?.[0]) return;
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), type: 'user', text: '', imageUri: result.assets[0].uri },
    ]);
  };

  const waitForActiveAppState = () => {
    if (AppState.currentState === 'active') return Promise.resolve();
    return new Promise<void>((resolve) => {
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          sub.remove();
          resolve();
        }
      });
    });
  };

  const toggleRecording = async () => {
    if (recording) {
      const rec = recordingRef.current;
      recordingRef.current = null;
      setRecording(false);
      if (!rec) return;
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      const durationMs = Date.now() - recordingStartRef.current;
      if (uri) {
        setMessages(prev => [
          ...prev,
          { id: Date.now().toString(), type: 'user', text: '', audioUri: uri, audioDurationMs: durationMs },
        ]);
      }
      return;
    }

    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Microphone access needed', 'Enable microphone access in Settings to record voice notes.');
      return;
    }
    // The permission dialog backgrounds the app momentarily; activating the
    // audio session before iOS reports the app as active again throws
    // "experience is currently in the background" on the first request.
    await waitForActiveAppState();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    recordingRef.current = rec;
    recordingStartRef.current = Date.now();
    setRecording(true);
  };

  const playAudio = async (uri: string) => {
    const { sound } = await Audio.Sound.createAsync({ uri });
    await sound.playAsync();
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.bottom + 10}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Icon name="witch-hat" size={18} color={PINK_DEEP} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Atossa</Text>
            <Text style={styles.headerSub}>Sage · your cycle companion</Text>
          </View>
          {/* Temporary entry point for the MVP capture screen — Step E wires
              this in properly and removes it in favour of the real flow. */}
          <Pressable
            onPress={() => router.push('/(tabs)/chat/capture' as any)}
            style={styles.avatarBtn}
            hitSlop={8}
          >
            <Icon name="clipboard-list" size={18} color={PINK_DEEP} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/profile' as any)}
            style={styles.avatarBtn}
            hitSlop={8}
          >
            <Icon name="user" size={18} color={PINK_DEEP} />
          </Pressable>
        </View>

        {/* ── Messages ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg =>
            msg.type === 'ai' ? (
              <View key={msg.id} style={styles.aiBubble}>
                <Text style={styles.aiText}>{msg.text}</Text>
              </View>
            ) : msg.imageUri ? (
              <View key={msg.id} style={styles.imageBubble}>
                <Image source={{ uri: msg.imageUri }} style={styles.bubbleImage} />
              </View>
            ) : msg.audioUri ? (
              <Pressable key={msg.id} style={styles.userBubble} onPress={() => playAudio(msg.audioUri!)}>
                <Text style={styles.userText}>
                  ▶ Voice note · {Math.round((msg.audioDurationMs ?? 0) / 1000)}s
                </Text>
              </Pressable>
            ) : (
              <View key={msg.id} style={styles.userBubble}>
                <Text style={styles.userText}>{msg.text}</Text>
              </View>
            )
          )}
          {thinking && (
            <View style={styles.aiBubble}>
              <Text style={styles.aiText}>…</Text>
            </View>
          )}
        </ScrollView>

        {/* ── Pain scale ── */}
        <View style={styles.painRow}>
          <Text style={styles.painLabel}>Pain</Text>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <Pressable
              key={n}
              onPress={() => setPain(n)}
              style={[styles.painBtn, pain === n && styles.painBtnOn]}
            >
              <Text style={[styles.painNum, pain === n && styles.painNumOn]}>{n}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Multimodal strip ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.strip}
          contentContainerStyle={styles.stripContent}
        >
          {MODAL_CARDS.map((c, i) => (
            <Pressable
              key={i}
              style={[styles.modalCard, c.label === 'Voice' && recording && styles.modalCardActive]}
              onPress={() => {
                if (c.label === 'Voice') return toggleRecording();
                if (c.label === 'Image') return takePhoto();
                if (c.label === 'Cycle data') return router.push('/(tabs)/chat/cycle-data' as any);
                if (c.label === 'Period Log') return router.push('/(tabs)/chat/period-log' as any);
                Alert.alert('Feature coming soon');
              }}
            >
              <Icon
                name={c.label === 'Voice' && recording ? 'square' : c.icon}
                size={20}
                color={c.label === 'Voice' && recording ? '#fff' : PINK_DEEP}
              />
              <Text style={[styles.modalLabel, c.label === 'Voice' && recording && styles.modalTextActive]}>
                {c.label === 'Voice' && recording ? 'Stop' : c.label}
              </Text>
              <Text style={[styles.modalSub, c.label === 'Voice' && recording && styles.modalTextActive]}>
                {c.sub}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Input bar ── */}
        <View style={[styles.inputBar, { paddingBottom: keyboardVisible ? 10 : insets.bottom + 80 }]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message Sage…"
            placeholderTextColor={MUTED}
            multiline
            blurOnSubmit
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || thinking) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!input.trim() || thinking}
          >
            <Icon name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: BG,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: PINK_SOFT,
  },
  logo: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: PINK,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: PINK,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: PINK_DEEP, fontSize: 18, fontWeight: '700', letterSpacing: 0.2 },
  headerSub:   { color: MUTED, fontSize: 11, marginTop: 1 },

  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 4 },

  aiBubble: {
    alignSelf: 'flex-start',
    maxWidth: '82%',
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: PINK_DEEP,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    padding: 14,
    shadowColor: PINK_DEEP,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 0,
    elevation: 2,
  },
  aiText: { color: INK, fontSize: 14, lineHeight: 21 },

  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: PINK,
    borderRadius: 18,
    borderTopRightRadius: 4,
    padding: 14,
  },
  userText: { color: '#fff', fontSize: 14, lineHeight: 21 },

  imageBubble: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    borderRadius: 18,
    borderTopRightRadius: 4,
    overflow: 'hidden',
  },
  bubbleImage: { width: 200, height: 200 },

  painRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: PINK_SOFT,
  },
  painLabel: { color: MUTED, fontSize: 11, fontWeight: '600', marginRight: 4, width: 28 },
  painBtn: {
    width: 27, height: 27, borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: PINK,
    alignItems: 'center', justifyContent: 'center',
  },
  painBtnOn: { backgroundColor: PINK_DEEP, borderColor: PINK_DEEP },
  painNum:   { color: PINK_DEEP, fontSize: 10, fontWeight: '700' },
  painNumOn: { color: '#fff' },

  strip:        { maxHeight: 90, flexShrink: 0, backgroundColor: BG },
  stripContent: { paddingHorizontal: 14, gap: 8, paddingBottom: 4 },
  modalCard: {
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: PINK_DEEP,
    borderRadius: 14,
    padding: 10,
    width: 112,
    alignItems: 'center',
    shadowColor: PINK_DEEP,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 0,
    elevation: 2,
  },
  modalCardActive: { backgroundColor: PINK_DEEP, borderColor: PINK_DEEP },
  modalTextActive: { color: '#fff' },
  modalLabel: { color: PINK_DEEP, fontSize: 11, fontWeight: '600', marginTop: 4 },
  modalSub:   { color: MUTED, fontSize: 9, textAlign: 'center', marginTop: 2, lineHeight: 13 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 8,
    backgroundColor: COMPOSER,
    borderTopWidth: 1,
    borderTopColor: PINK_SOFT,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    color: INK,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: PINK,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: PINK_DEEP,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: PINK },
});
