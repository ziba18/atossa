import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, Alert, KeyboardAvoidingView, Platform,
  Animated, SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG       = '#FDE8EE';
const COMPOSER = '#FBE3EC';
const CARD     = '#FFFFFF';
const PINK     = '#F2A7BB';
const PINK_DEEP = '#C2607A';
const PINK_SOFT = '#FBD9E3';
const INK      = '#3A2A30';
const MUTED    = '#A78896';

interface Message {
  id: string;
  type: 'ai' | 'user';
  text: string;
}

const INITIAL: Message = {
  id: '0',
  type: 'ai',
  text: "Hi 👋 I noticed your pain has been 7+ for 3 consecutive weeks. This is NOT normal. You deserve answers. 💙",
};

const AI_RESPONSE =
  "I've analysed your input. Your pain pattern combined with HRV and cycle data shows elevated inflammation markers. I recommend adding this to your GP report — your doctor needs to see this trend. 💙";

const MODAL_CARDS = [
  { icon: '🎙️', label: 'Voice',      sub: 'Describe pain in your words' },
  { icon: '📸', label: 'Image',      sub: 'Scan results, lab reports' },
  { icon: '⌚', label: 'Wearable',   sub: 'HRV, sleep, temperature' },
  { icon: '📊', label: 'Cycle data', sub: 'Hormones, flow, phases' },
];

const STEPS = [
  '✅ Voice note processed · pain mapped to body',
  '✅ Lab image read · hormones extracted',
  '⏳ Wearable sync · HRV pattern detected',
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([INITIAL]);
  const [input, setInput]       = useState('');
  const [pain, setPain]         = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep]         = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const fadeAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const send = () => {
    const text = input.trim();
    if (!text || processing) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', text }]);
    setInput('');
    beginProcessing();
  };

  const beginProcessing = () => {
    setProcessing(true);
    setStep(0);
    fadeAnims.forEach(a => a.setValue(0));

    [0, 1, 2].forEach(i => {
      setTimeout(() => {
        setStep(i + 1);
        Animated.timing(fadeAnims[i], {
          toValue: 1, duration: 350, useNativeDriver: true,
        }).start();
      }, (i + 1) * 850);
    });

    setTimeout(() => {
      setProcessing(false);
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), type: 'ai', text: AI_RESPONSE },
      ]);
    }, 3400);
  };

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, processing]);

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
            <Text style={styles.logoGlyph}>✦</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Atossa</Text>
            <Text style={styles.headerSub}>Your cycle companion</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>Apple Health</Text>
          </View>
        </View>
        <View style={styles.chipRow}>
          <View style={styles.chip}><Text style={styles.chipText}>Oura</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Fitbit</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Clue</Text></View>
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
            ) : (
              <View key={msg.id} style={styles.userBubble}>
                <Text style={styles.userText}>{msg.text}</Text>
              </View>
            )
          )}

          {processing && (
            <View style={styles.processingCard}>
              <Text style={styles.processingTitle}>Atossa is analysing…</Text>
              {STEPS.slice(0, step).map((s, i) => (
                <Animated.Text key={i} style={[styles.processingStep, { opacity: fadeAnims[i] }]}>
                  {s}
                </Animated.Text>
              ))}
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
              style={styles.modalCard}
              onPress={() => Alert.alert('Feature coming soon')}
            >
              <Text style={styles.modalIcon}>{c.icon}</Text>
              <Text style={styles.modalLabel}>{c.label}</Text>
              <Text style={styles.modalSub}>{c.sub}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Input bar ── */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 80 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message Atossa…"
            placeholderTextColor={MUTED}
            multiline
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <Pressable style={[styles.sendBtn, processing && { opacity: 0.5 }]} onPress={send}>
            <Text style={styles.sendIcon}>➤</Text>
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
  logoGlyph: { color: PINK_DEEP, fontSize: 16 },
  headerTitle: { color: PINK_DEEP, fontSize: 18, fontWeight: '700', letterSpacing: 0.2 },
  headerSub:   { color: MUTED, fontSize: 11, marginTop: 1 },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: BG,
  },
  chip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: PINK,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: PINK_DEEP },

  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 4 },

  aiBubble: {
    alignSelf: 'flex-start',
    maxWidth: '82%',
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: PINK_SOFT,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    padding: 14,
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

  processingCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: PINK_SOFT,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  processingTitle: { color: PINK_DEEP, fontSize: 13, fontWeight: '600' },
  processingStep:  { color: INK, fontSize: 13, lineHeight: 20 },

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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PINK,
    borderRadius: 14,
    padding: 10,
    width: 112,
    alignItems: 'center',
  },
  modalIcon:  { fontSize: 20 },
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
  sendIcon: { color: '#fff', fontSize: 16 },
});
