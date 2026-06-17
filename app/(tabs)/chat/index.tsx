import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, Alert, KeyboardAvoidingView, Platform,
  Animated, SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG     = '#2A0A1E';
const CARD   = '#3D1228';
const PINK   = '#C2607A';
const LPINK  = '#F2A7BB';
const CREAM  = '#EAD9D9';
const MUTED  = '#9A6A7A';

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
          <Text style={styles.headerTitle}>Atossa</Text>
          <Text style={styles.headerSub}>PCOS-aware · multimodal</Text>
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
            placeholder="Describe how you feel…"
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
    backgroundColor: CARD,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: PINK + '33',
  },
  headerTitle: { color: CREAM, fontSize: 20, fontWeight: '700', letterSpacing: 0.4 },
  headerSub:   { color: MUTED, fontSize: 12, marginTop: 2 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 4 },

  aiBubble: {
    alignSelf: 'flex-start',
    maxWidth: '82%',
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: PINK,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    padding: 14,
  },
  aiText: { color: CREAM, fontSize: 14, lineHeight: 21 },

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
    borderColor: MUTED + '88',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  processingTitle: { color: LPINK, fontSize: 13, fontWeight: '600' },
  processingStep:  { color: CREAM, fontSize: 13, lineHeight: 20 },

  painRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: CARD,
  },
  painLabel: { color: MUTED, fontSize: 11, fontWeight: '600', marginRight: 4, width: 28 },
  painBtn: {
    width: 27, height: 27, borderRadius: 14,
    backgroundColor: CARD,
    borderWidth: 1, borderColor: MUTED + '88',
    alignItems: 'center', justifyContent: 'center',
  },
  painBtnOn: { backgroundColor: PINK, borderColor: PINK },
  painNum:   { color: MUTED, fontSize: 10, fontWeight: '700' },
  painNumOn: { color: '#fff' },

  strip:        { maxHeight: 90, flexShrink: 0 },
  stripContent: { paddingHorizontal: 14, gap: 8, paddingBottom: 4 },
  modalCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: MUTED + '66',
    borderRadius: 10,
    padding: 10,
    width: 112,
    alignItems: 'center',
  },
  modalIcon:  { fontSize: 20 },
  modalLabel: { color: CREAM, fontSize: 11, fontWeight: '600', marginTop: 4 },
  modalSub:   { color: MUTED, fontSize: 9, textAlign: 'center', marginTop: 2, lineHeight: 13 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: CARD,
  },
  input: {
    flex: 1,
    backgroundColor: CARD,
    color: CREAM,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: MUTED + '55',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: PINK,
    alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { color: '#fff', fontSize: 16 },
});
