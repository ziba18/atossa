import React, { useEffect, useRef, useState } from 'react';
import {
  View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UI } from '../../../constants/atossaUI';
import { BigButton, Card, MainHeader, Txt } from '../../../components/atossa/kit';
import { Icon } from '../../../components/ui/Icon';
import { useAuthStore } from '../../../stores/authStore';
import { useRecordsStore } from '../../../stores/recordsStore';
import { useDictation } from '../../../hooks/useDictation';
import { isHumanName } from '../../../lib/humanName';
import { todayKey } from '../../../lib/records/dates';
import type { SymptomData } from '../../../types/records';

const C = UI.colors;

type Step = null | 'noted' | 'where' | 'score' | 'duration' | 'stopped' | 'stoppedWords';
interface ChatMessage { id: string; role: 'assistant' | 'user'; text: string }

const PLACEHOLDERS: Record<string, string> = {
  where: 'Write where you feel it…',
  duration: 'Write how long…',
  stoppedWords: 'Add a few words…',
  noted: 'Save or edit the noted words above',
};

let counter = 0;
const nextId = () => `m${Date.now()}-${counter++}`;

export default function ChatScreen() {
  const displayName = useAuthStore((s) => s.profile?.display_name);
  const createRecord = useRecordsStore((s) => s.create);

  const greeting = `Hello${isHumanName(displayName) ? `, ${displayName!.trim()}` : ''}. I’m here to listen. How are you feeling today?`;
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 'greeting', role: 'assistant', text: greeting }]);
  const [step, setStep] = useState<Step>(null);
  const [draft, setDraft] = useState<SymptomData | null>(null);
  const [editingNoted, setEditingNoted] = useState(false);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputPrefix = useRef('');

  useEffect(() => {
    setMessages((prev) => (prev.length === 1 && prev[0].id === 'greeting' ? [{ ...prev[0], text: greeting }] : prev));
  }, [greeting]);

  const dictation = useDictation((transcript) => {
    const prefix = inputPrefix.current;
    setInput(prefix ? `${prefix} ${transcript}` : transcript);
  });

  const typedStep = step === null || step === 'where' || step === 'duration' || step === 'stoppedWords';

  const say = (role: 'assistant' | 'user', text: string) =>
    setMessages((cur) => [...cur, { id: nextId(), role, text }]);

  const finish = async (entry: SymptomData) => {
    if (saving) return;
    setSaving(true);
    try {
      await createRecord('symptom', entry);
      say('assistant', 'Thank you. I’ve saved your words.');
      setDraft(null);
      setStep(null);
      setEditingNoted(false);
    } catch {
      say('assistant', 'I couldn’t save that just now. Please check your connection and try again.');
      setStep('stoppedWords');
    } finally {
      setSaving(false);
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text || !typedStep || saving) return;
    if (dictation.recording) dictation.stop();
    setInput('');
    inputPrefix.current = '';
    say('user', text);

    if (!draft || step === null) {
      setDraft({ date: todayKey(), words: text, where: '', score: 0, duration: '', stopped: false, stoppedWords: '' });
      setStep('noted');
      say('assistant', 'Thank you for telling me.');
    } else if (step === 'where') {
      setDraft({ ...draft, where: text });
      setStep('score');
      say('assistant', 'How bad is it, from 0 to 10?');
    } else if (step === 'duration') {
      setDraft({ ...draft, duration: text });
      setStep('stopped');
      say('assistant', 'Did it stop you doing things today?');
    } else if (step === 'stoppedWords') {
      finish({ ...draft, stoppedWords: text });
    }
  };

  const answerScore = (score: number) => {
    if (!draft) return;
    setDraft({ ...draft, score });
    setStep('duration');
    say('user', String(score));
    say('assistant', 'How long has it been going on?');
  };

  const answerStopped = (stopped: boolean) => {
    if (!draft) return;
    setDraft({ ...draft, stopped });
    setStep('stoppedWords');
    say('user', stopped ? 'Yes' : 'No');
    say(
      'assistant',
      stopped
        ? 'You can add a few words about what it stopped you doing, or save without adding anything.'
        : 'You can add a few words, or save without adding anything.',
    );
  };

  const toggleMic = () => {
    if (dictation.recording) { dictation.stop(); return; }
    inputPrefix.current = input.trim();
    dictation.start();
  };

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages, step, editingNoted]);

  const placeholder = step && PLACEHOLDERS[step] ? PLACEHOLDERS[step] : 'Write how you feel…';

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <MainHeader />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.thread}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Txt variant="display">Chat</Txt>
          <Txt variant="body" color={C.mutedForeground} style={{ marginTop: 6, marginBottom: 12 }}>
            Tell Atossa what is happening in your own words.
          </Txt>

          {messages.map((m) =>
            m.role === 'assistant' ? (
              <View key={m.id} style={styles.assistantRow}>
                <Txt variant="smallBold" color={C.primaryStrong}>Atossa</Txt>
                <Txt variant="body">{m.text}</Txt>
              </View>
            ) : (
              <View key={m.id} style={styles.userBubble} accessibilityLabel={`You said: ${m.text}`}>
                <Txt variant="body">{m.text}</Txt>
              </View>
            ),
          )}

          {draft && step === 'noted' && (
            <Card tone="green" style={{ marginTop: 4 }}>
              <Txt variant="bodyBold">I’ve noted this</Txt>
              {editingNoted ? (
                <TextInput
                  value={draft.words}
                  onChangeText={(words) => setDraft({ ...draft, words })}
                  multiline
                  accessibilityLabel="Edit noted words"
                  style={styles.editInput}
                  textAlignVertical="top"
                />
              ) : (
                <Txt variant="body" style={{ marginTop: 8 }}>“{draft.words}”</Txt>
              )}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
                <BigButton label={editingNoted ? 'Done' : 'Edit'} icon="pencil" variant="outline" onPress={() => setEditingNoted(!editingNoted)} style={{ flex: 1 }} />
                <BigButton label="Save" icon="check" onPress={() => { setEditingNoted(false); setStep('where'); say('assistant', 'Where do you feel it?'); }} style={{ flex: 1 }} />
              </View>
            </Card>
          )}

          {draft && step === 'score' && (
            <View style={{ marginTop: 4 }}>
              <View style={styles.scoreGrid}>
                {Array.from({ length: 11 }, (_, n) => (
                  <BigButton key={n} label={String(n)} variant="outline" onPress={() => answerScore(n)} style={styles.scoreBtn} />
                ))}
              </View>
            </View>
          )}

          {draft && step === 'stopped' && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <BigButton label="Yes" onPress={() => answerStopped(true)} style={{ flex: 1 }} />
              <BigButton label="No" variant="outline" onPress={() => answerStopped(false)} style={{ flex: 1 }} />
            </View>
          )}

          {draft && step === 'stoppedWords' && (
            <BigButton label={saving ? 'Saving…' : 'Save without adding words'} variant="outline" disabled={saving} onPress={() => finish(draft)} />
          )}
        </ScrollView>

        <View style={styles.composer}>
          {dictation.recording && (
            <Txt variant="smallBold" color={C.primaryStrong} style={{ marginBottom: 6 }} accessibilityRole="alert">
              Listening… tap the microphone to stop.
            </Txt>
          )}
          {dictation.error ? (
            <Txt variant="small" color={C.destructive} style={{ marginBottom: 6 }} accessibilityRole="alert">{dictation.error}</Txt>
          ) : null}
          <View style={styles.inputBox}>
            <TextInput
              value={input}
              onChangeText={setInput}
              editable={typedStep}
              multiline
              placeholder={placeholder}
              placeholderTextColor="#8b8079"
              accessibilityLabel="Message Atossa"
              style={styles.composerInput}
              textAlignVertical="top"
            />
            <View style={styles.composerRow}>
              <Pressable
                onPress={toggleMic}
                disabled={!typedStep}
                accessibilityRole="button"
                accessibilityLabel={dictation.recording ? 'Stop microphone' : 'Use microphone'}
                accessibilityState={{ selected: dictation.recording, disabled: !typedStep }}
                style={[styles.roundBtn, { backgroundColor: dictation.recording ? C.coralSoft : C.muted, opacity: typedStep ? 1 : 0.4 }]}
              >
                <Icon name="mic" size={24} color={dictation.recording ? C.primaryStrong : C.foreground} />
              </Pressable>
              <Pressable
                onPress={send}
                disabled={!typedStep || !input.trim() || saving}
                accessibilityRole="button"
                accessibilityLabel="Send message"
                style={[styles.roundBtn, { backgroundColor: C.primary, opacity: !typedStep || !input.trim() || saving ? 0.4 : 1 }]}
              >
                <Icon name="send" size={22} color={C.primaryForeground} />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  thread: { padding: UI.gutter, paddingBottom: 16, gap: 18 },
  assistantRow: { gap: 2 },
  userBubble: {
    alignSelf: 'flex-end', maxWidth: '88%', backgroundColor: C.blueSoft, borderRadius: UI.radius,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  editInput: {
    marginTop: 10, minHeight: 96, borderRadius: UI.radius, borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
    padding: 12, fontFamily: UI.font.body, fontSize: UI.size.body, color: C.foreground,
  },
  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scoreBtn: { width: '23%' },
  composer: { paddingHorizontal: UI.gutter, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.background },
  inputBox: { borderRadius: UI.radius, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  composerInput: {
    minHeight: 56, maxHeight: 120, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
    fontFamily: UI.font.body, fontSize: UI.size.body, color: C.foreground,
  },
  composerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 8 },
  roundBtn: { width: 56, height: 56, borderRadius: UI.radius, alignItems: 'center', justifyContent: 'center' },
});
