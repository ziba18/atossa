// The one capture sheet (mounted once in app/(tabs)/_layout.tsx, opened with openCapture()).
//   1. Speak or type  →  2. follow-ups only for gaps  →  3. "Here's what I noted"  →  save.
// "That's all for now" saves from step 2 on. X / Android back / swipe / scrim always close;
// with unsaved words the sheet first asks "Keep this note?" in-page (never Alert.alert).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View, useWindowDimensions, type ScrollViewInstance, type TextInputInstance } from 'react-native';
import {
  Button, Card, ConfirmCard, InlineError, SegmentedControl, Sheet, Txt, showToast,
} from '../kit';
import { colors, fonts, radii, space } from '../../../constants/atossaUI';
import { useDictation } from '../../../hooks/useDictation';
import { closeCapture, useCaptureStore, type CaptureOptions } from '../../../lib/captureStore';
import { haptics } from '../../../lib/haptics';
import { todayKey } from '../../../lib/records/dates';
import { formatDay, noteCount, notesLabel } from '../../../lib/records/format';
import { URGENT_SIGNPOST, urgentSignpost } from '../../../lib/urgentWording';
import { useRecordsStore } from '../../../stores/recordsStore';
import { type Draft, answeredOf, emptyDraft, hasContent, toSymptom } from './draft';
import { FollowUp } from './FollowUp';
import { type Question, prefillFrom, questionsFor } from './infer';
import { MicButton } from './MicButton';
import { NotedCard, type NotedField, firstFilledField } from './NotedCard';
import { Waveform } from './Waveform';

// Broken evenly so "body?" never sits alone on line 2 (same as the Today hero).
const PROMPT = 'What’s been going on\nwith your body?';
const VOICE_UNAVAILABLE = 'Voice isn’t available here, so type instead. Your words are saved the same way.';

type Mode = 'speak' | 'type';
type Stage = 'capture' | 'questions' | 'review';

/** Mount once. Re-creates the flow (fresh state) every time the sheet opens. */
export function CaptureSheet() {
  const open = useCaptureStore((s) => s.open);
  const options = useCaptureStore((s) => s.options);
  // A new session per open, decided during render so stale state never flashes.
  const session = useRef(0);
  const wasOpen = useRef(false);
  const frozen = useRef<CaptureOptions>({});
  if (open && !wasOpen.current) {
    session.current += 1;
    frozen.current = options;
  }
  wasOpen.current = open;
  if (session.current === 0) return null;
  return <CaptureFlow key={session.current} visible={open} options={frozen.current} />;
}

const joinWords = (prefix: string, more: string) => {
  const m = more.trim();
  if (!m) return prefix;
  return prefix ? `${prefix} ${m}` : m;
};

function CaptureFlow({ visible, options }: { visible: boolean; options: CaptureOptions }) {
  // Under ~240 pt wide (200% text on a small phone) the forced line break and helper line push the field off screen.
  const narrow = useWindowDimensions().width < 240;
  const createRecord = useRecordsStore((s) => s.create);
  const tag = options.tag;

  const [draft, setDraft] = useState<Draft>(() => ({ ...emptyDraft(options.date ?? todayKey()), words: options.words ?? '' }));
  const patch = useCallback((p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p })), []);
  const [stage, setStage] = useState<Stage>('capture');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [other, setOther] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [usedVoice, setUsedVoice] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [editingRow, setEditingRow] = useState<NotedField | null>(null);

  // Every step (and every question) opens at the top, heading and "Why I'm asking" visible (UX #8).
  const scrollRef = useRef<ScrollViewInstance>(null);
  const notedY = useRef(0);
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [stage, qIndex]);

  // ---- dictation (one recogniser, routed to the main words or the "something else" field)
  const target = useRef<'words' | 'other'>('words');
  const prefix = useRef('');
  const dictation = useDictation((text) => {
    if (target.current === 'words') {
      setDraft((d) => ({ ...d, words: joinWords(prefix.current, text) }));
      if (text.trim()) setUsedVoice(true);
    } else {
      setOther(joinWords(prefix.current, text));
    }
  });
  const { supported: voiceSupported, recording } = dictation;

  const wantsSpeak = (options.mode ?? 'speak') === 'speak';
  const [mode, setMode] = useState<Mode>(wantsSpeak && voiceSupported ? 'speak' : 'type');
  const [voiceNotice, setVoiceNotice] = useState(wantsSpeak && !voiceSupported);

  const startRecording = (to: 'words' | 'other') => {
    target.current = to;
    prefix.current = to === 'words' ? draft.words.trim() : other.trim();
    dictation.clearError();
    dictation.start();
  };
  const stopRecording = () => { if (recording) dictation.stop(); };

  // Light haptic on start and stop; elapsed timer while recording.
  const wasRecording = useRef(false);
  useEffect(() => {
    if (wasRecording.current !== recording) haptics.light();
    wasRecording.current = recording;
    if (!recording) return;
    setSeconds(0);
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  // Today's mic: start recording as soon as the sheet opens.
  useEffect(() => {
    if (options.startRecording && voiceSupported) startRecording('words');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop listening when the sheet goes away.
  useEffect(() => { if (!visible) dictation.cancel(); }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => dictation.cancel(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const typeRef = useRef<TextInputInstance>(null);
  const [typedFocus, setTypedFocus] = useState(false);
  useEffect(() => {
    if (mode === 'type' && stage === 'capture' && !confirmClose) {
      const id = setTimeout(() => {
        const input = typeRef.current as (TextInputInstance & { setSelectionRange?: (a: number, b: number) => void }) | null;
        input?.focus();
        // "Add more": caret at the END of her words, never in front of them (UX #22).
        const len = draftRef.current.words.length;
        if (input?.setSelection) input.setSelection(len, len);
        else input?.setSelectionRange?.(len, len);
      }, 300);
      return () => clearTimeout(id);
    }
  }, [mode, stage, confirmClose]);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const past = draft.date !== todayKey();

  // ---- flow ---------------------------------------------------------------------------------
  const switchMode = (m: Mode) => {
    if (m === 'speak' && !voiceSupported) { setVoiceNotice(true); return; }
    stopRecording();
    setMode(m);
  };

  const continueFromCapture = () => {
    if (!draft.words.trim() || recording) return;
    // Pre-fill only empty fields, only from words Sam actually used.
    const p = prefillFrom(draft.words);
    const a = answeredOf(draft);
    const next: Draft = {
      ...draft,
      zones: !a.where && p.zones ? p.zones : draft.zones,
      when: !a.when && p.when ? p.when : draft.when,
      duration: !draft.duration.trim() && p.duration ? p.duration : draft.duration,
      tried: !draft.tried.trim() && p.tried ? p.tried : draft.tried,
      impacts: !a.impact && p.impacts ? p.impacts : draft.impacts,
      worst: !a.strength && p.worst != null ? p.worst : draft.worst,
    };
    setDraft(next);
    const qs = questionsFor(answeredOf(next), tag);
    setQuestions(qs);
    setQIndex(0);
    setOther('');
    setEditingRow(null);
    setStage(qs.length ? 'questions' : 'review');
  };

  const nextQuestion = () => {
    if (recording) dictation.cancel();
    setOther('');
    if (qIndex + 1 >= questions.length) setStage('review');
    else setQIndex((i) => i + 1);
  };

  // Every row is already tappable, so "Fix something" doesn't replay the questions (UX #11):
  // it scrolls to the card and opens the first row Atossa filled in ("Tap anything to fix it").
  const fixSomething = () => {
    setEditingRow(firstFilledField(draft));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const addMore = () => {
    setEditingRow(null);
    setStage('capture');
    if (voiceSupported && mode === 'speak') return;
    setMode('type');
  };

  const close = () => {
    dictation.cancel();
    closeCapture();
  };

  const requestClose = () => {
    if (saving) return;
    if (confirmClose) { setConfirmClose(false); return; } // X on the card = keep editing
    if (hasContent(draft)) {
      if (recording) dictation.stop();
      setConfirmClose(true);
      return;
    }
    close();
  };

  const save = async () => {
    if (saving) return;
    if (recording) dictation.cancel();
    setSaving(true);
    setSaveError('');
    try {
      const saved = await createRecord('symptom', toSymptom(draft, usedVoice ? 'voice' : 'typed', tag));
      haptics.success();
      closeCapture();
      const n = noteCount(useRecordsStore.getState().records.symptom);
      showToast(saved.pending ? 'Saved on this phone. It will send when you’re online.' : `Saved. ${notesLabel(n)} ready for your doctor.`);
    } catch {
      setSaveError("That didn't save. Your note is still here. Check your connection and try again.");
      setSaving(false);
    }
  };

  // ---- header / footer ----------------------------------------------------------------------
  let header: React.ReactNode;
  if (!confirmClose && stage === 'capture') {
    header = (
      <SegmentedControl<Mode>
        accessibilityLabel="Speak or type"
        options={[{ value: 'speak', label: 'Speak' }, { value: 'type', label: 'Type' }]}
        value={mode}
        onChange={switchMode}
      />
    );
  } else if (!confirmClose && stage === 'questions') {
    header = (
      <View style={styles.progressRow}>
        <Txt variant="caption">A little more detail</Txt>
        {questions.length > 1 ? (
          <Txt variant="caption" accessibilityLabel={`Question ${qIndex + 1} of up to ${questions.length}`}>
            {`${qIndex + 1} of up to ${questions.length}`}
          </Txt>
        ) : null}
      </View>
    );
  }

  let footer: React.ReactNode;
  if (!confirmClose && stage === 'capture') {
    footer = (
      <Button
        label="Continue"
        onPress={continueFromCapture}
        disabled={!draft.words.trim() || recording}
        accessibilityHint={recording ? 'Stop recording first' : undefined}
      />
    );
  } else if (!confirmClose && stage === 'questions') {
    footer = <Button label="That’s all for now" variant="text" onPress={save} loading={saving} />;
  } else if (!confirmClose && stage === 'review') {
    // Sticky, so saving never sits below seven rows of scrolling.
    footer = (
      <View style={styles.actions}>
        <Button label="Looks right, save" onPress={save} loading={saving} />
        {/* One primary, then a quiet row of two text actions (V13). */}
        <View style={styles.secondaryActions}>
          <Button label="Fix something" variant="text" onPress={fixSomething} style={{ flex: 1 }} />
          <Button label="Add more" variant="text" onPress={addMore} style={{ flex: 1 }} />
        </View>
      </View>
    );
  }

  // A failed save shows in the sticky footer, next to the button that failed, never somewhere down the scroll.
  if (footer && !confirmClose && saveError) {
    footer = (
      <View>
        <InlineError message={saveError} style={{ marginBottom: space.sm }} />
        {footer}
      </View>
    );
  }

  const signpost = urgentSignpost([draft.words, draft.whereText, draft.tried, draft.when, draft.duration, draft.stoppedWords, other].join('. '));

  // ---- body ---------------------------------------------------------------------------------
  // Nothing said yet: sit the mic lower so the step does not read as an empty sheet.
  const idleSpeak = mode === 'speak' && !draft.words && !recording;
  let body: React.ReactNode;
  if (confirmClose) {
    body = (
      <ConfirmCard
        title="Keep this note?"
        message="You haven't saved it yet."
        actions={[
          { label: 'Save it', variant: 'primary', onPress: save },
          { label: 'Discard', variant: 'secondary', onPress: close },
          { label: 'Keep editing', variant: 'text', onPress: () => setConfirmClose(false) },
        ]}
      />
    );
  } else if (stage === 'capture') {
    const micLabel = recording ? 'Tap to stop' : draft.words.trim() ? 'Add more by voice' : 'Tap to start';
    body = (
      <View>
        <Txt variant="title" accessibilityRole="header">{narrow ? PROMPT.replace('\n', ' ') : PROMPT}</Txt>
        {narrow ? null : (
          <Txt variant="secondary" style={{ marginTop: space.xs }}>
            {mode === 'speak' ? 'Say it however it comes. Messy is fine.' : 'Write it however it comes. Messy is fine.'}
          </Txt>
        )}
        {past ? <Txt variant="caption" style={{ marginTop: space.xs }}>{`Note for ${formatDay(draft.date)}`}</Txt> : null}
        {voiceNotice && mode === 'type' ? (
          <Txt variant="secondary" color={colors.ink} style={{ marginTop: space.sm }}>{VOICE_UNAVAILABLE}</Txt>
        ) : null}

        {mode === 'speak' ? (
          <>
            {draft.words || recording ? (
              <TextInput
                value={draft.words}
                onChangeText={(words) => patch({ words })}
                editable={!recording}
                multiline
                placeholder={recording ? 'Listening…' : undefined}
                placeholderTextColor={colors.ink2}
                accessibilityLabel="Your words"
                accessibilityHint="You can edit these before you continue"
                style={[styles.box, styles.transcript]}
              />
            ) : null}
            <View style={[styles.micArea, idleSpeak && styles.micAreaIdle]}>
              {recording ? <Waveform recording={recording} seconds={seconds} /> : null}
              <MicButton
                recording={recording}
                onPress={() => (recording ? dictation.stop() : startRecording('words'))}
                accessibilityLabel={recording ? 'Stop recording' : micLabel}
              />
              <Txt variant="secondary" color={colors.ink} style={styles.micLabel}>{micLabel}</Txt>
              {idleSpeak ? <Txt variant="caption" style={{ textAlign: 'center' }}>Then Atossa asks only for what’s missing.</Txt> : null}
            </View>
            <InlineError message={dictation.error} style={{ marginTop: space.md }} />
          </>
        ) : (
          <TextInput
            ref={typeRef}
            value={draft.words}
            onChangeText={(words) => patch({ words })}
            autoFocus
            multiline
            placeholder="Type what’s been happening…"
            placeholderTextColor={colors.ink3}
            accessibilityLabel="Your words"
            onFocus={() => setTypedFocus(true)}
            onBlur={() => setTypedFocus(false)}
            style={[styles.box, styles.typed, typedFocus && styles.typedFocus]}
          />
        )}
      </View>
    );
  } else if (stage === 'questions' && questions[qIndex]) {
    const q = questions[qIndex];
    body = (
      <View>
        <FollowUp
          key={`${q}-${qIndex}`}
          question={q}
          draft={draft}
          past={past}
          onChange={patch}
          onNext={nextQuestion}
          other={other}
          onOtherChange={setOther}
          voiceSupported={voiceSupported}
          recordingOther={recording && target.current === 'other'}
          onOtherMic={() => (recording ? dictation.stop() : startRecording('other'))}
        />
        {target.current === 'other' ? <InlineError message={dictation.error} style={{ marginTop: space.md }} /> : null}
      </View>
    );
  } else {
    body = (
      <View onLayout={(e) => { notedY.current = e.nativeEvent.layout.y; }}>
        <NotedCard
          draft={draft}
          onChange={patch}
          past={past}
          editing={editingRow}
          onEditingChange={setEditingRow}
          // N9: an opened editor's top sits 16 pt under the sticky header, never below the fold.
          onReveal={(y) => scrollRef.current?.scrollTo({ y: Math.max(0, notedY.current + y - space.md), animated: true })}
        />
      </View>
    );
  }

  return (
    <Sheet
      visible={visible}
      onClose={requestClose}
      full
      scrollRef={scrollRef}
      header={header}
      footer={narrow ? undefined : footer}
      closeLabel={confirmClose ? 'Keep editing' : 'Close'}
    >
      {confirmClose && saveError ? <InlineError message={saveError} style={{ marginBottom: space.md }} /> : null}
      {signpost && !confirmClose ? (
        // Fixed line only (H4): no label, no score, nothing stored; the note saves as usual.
        // Shown on every step, because "That's all for now" saves without reaching the noted card.
        <Card tone="sunken" style={{ marginBottom: space.md }}>
          <Txt accessibilityRole="alert">{signpost}</Txt>
        </Card>
      ) : null}
      {body}
      {/* Always there on the writing step, whatever is typed: the same fixed sentence the detector shows, never a reading of the note. */}
      {stage === 'capture' && !confirmClose && !signpost ? (
        <Txt variant="secondary" style={{ textAlign: 'center', marginTop: space.lg }}>{URGENT_SIGNPOST}</Txt>
      ) : null}
      {/* Under ~240 pt wide a sticky footer would cover the field, so the action follows the content instead. */}
      {narrow && footer ? <View style={{ marginTop: space.lg }}>{footer}</View> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 24 },
  box: {
    marginTop: space.lg, borderRadius: radii.input, padding: space.md,
    fontFamily: fonts.regular, fontSize: 17, lineHeight: 24, color: colors.ink, textAlign: 'left', textAlignVertical: 'top',
  },
  transcript: { backgroundColor: colors.plumTint, minHeight: 120 },
  typed: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, minHeight: 180 },
  // Plum 2px ring (padding trimmed 1 so the text does not shift); replaces RN-web's near-black outline.
  typedFocus: { borderColor: colors.plum, borderWidth: 2, padding: space.md - 1, ...({ outlineStyle: 'none' } as object) },
  micAreaIdle: { marginTop: space.xxl * 2 },
  micArea: { alignItems: 'center', marginTop: space.xl, gap: space.xs },
  micLabel: { fontFamily: fonts.medium },
  actions: { gap: space.xxs },
  secondaryActions: { flexDirection: 'row', gap: space.xs },
});
