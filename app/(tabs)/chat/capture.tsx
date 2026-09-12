import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, AppState } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { Header } from '../../../components/layout/Header';
import { SafeScreen } from '../../../components/layout/SafeScreen';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Icon } from '../../../components/ui/Icon';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { FontSize, Radius, Spacing } from '../../../constants/theme';
import { api, ApiError } from '../../../lib/api';
import {
  MAX_RECORDING_DURATION_MS,
  ensureMicPermission,
  isVoiceCaptureSupported,
  messageForErrorCode,
} from '../../../lib/transcription';
import type { CaptureInputMethod, SymptomCapture } from '../../../types/database';

const MAX_TRANSCRIPT_LENGTH = 8000; // must match backend/app/schemas/capture.py

export default function CaptureScreen() {
  const theme = useColors();
  const styles = createStyles(theme);

  const [text, setText] = useState('');
  const [inputMethod, setInputMethod] = useState<CaptureInputMethod>('text');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [justSaved, setJustSaved] = useState<SymptomCapture | null>(null);

  const [recent, setRecent] = useState<SymptomCapture[] | null>(null); // null = still loading
  const [loadError, setLoadError] = useState('');

  const voiceSupported = useRef(isVoiceCaptureSupported()).current;
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const heardAnySpeech = useRef(false);
  const maxDurationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoStoppedAtLimit = useRef(false);
  const hadError = useRef(false);

  const clearMaxDurationTimer = useCallback(() => {
    if (maxDurationTimer.current) {
      clearTimeout(maxDurationTimer.current);
      maxDurationTimer.current = null;
    }
  }, []);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    if (transcript.trim()) heardAnySpeech.current = true;
    setText(transcript);
    setInputMethod('voice');
  });

  useSpeechRecognitionEvent('end', () => {
    clearMaxDurationTimer();
    setRecording(false);
    setTranscribing(false);
    // 'error' (if any) already set the right message — don't clobber a
    // specific reason (e.g. permission denied) with the generic fallback.
    if (hadError.current) return;
    if (autoStoppedAtLimit.current) {
      autoStoppedAtLimit.current = false;
      setVoiceError('Recording stopped at 60 seconds — save this or keep going by typing.');
    } else if (!heardAnySpeech.current) {
      setVoiceError("We couldn't hear anything — try again, or type instead.");
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    clearMaxDurationTimer();
    setRecording(false);
    setTranscribing(false);
    hadError.current = true;
    setVoiceError(messageForErrorCode(event.error));
  });

  // If the app is backgrounded mid-recording (call, notification, app
  // switch), discard the in-progress recording rather than let it run
  // invisibly or produce a confusing partial result.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && recording) {
        clearMaxDurationTimer();
        ExpoSpeechRecognitionModule.abort();
        setRecording(false);
        setTranscribing(false);
        setVoiceError('Recording stopped because Atossa went to the background — try again.');
      }
    });
    return () => sub.remove();
  }, [recording, clearMaxDurationTimer]);

  useEffect(() => clearMaxDurationTimer, [clearMaxDurationTimer]);

  const startRecording = async () => {
    setVoiceError('');
    const { granted, canAskAgain } = await ensureMicPermission();
    if (!granted) {
      setVoiceError(
        canAskAgain
          ? "Microphone access is needed to record — try again and allow it, or type instead."
          : "Microphone access is off — turn it on in Settings, or type instead.",
      );
      return;
    }
    heardAnySpeech.current = false;
    autoStoppedAtLimit.current = false;
    hadError.current = false;
    setText('');
    setJustSaved(null);
    setRecording(true);
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
      requiresOnDeviceRecognition: true,
      addsPunctuation: true,
    });
    maxDurationTimer.current = setTimeout(() => {
      autoStoppedAtLimit.current = true;
      setTranscribing(true);
      ExpoSpeechRecognitionModule.stop();
    }, MAX_RECORDING_DURATION_MS);
  };

  const stopRecording = () => {
    clearMaxDurationTimer();
    setTranscribing(true);
    ExpoSpeechRecognitionModule.stop();
  };

  const loadRecent = useCallback(async () => {
    setLoadError('');
    try {
      const captures = await api.get<SymptomCapture[]>('/captures?limit=10');
      setRecent(captures);
    } catch (err) {
      setRecent((prev) => prev ?? []); // keep any previously-loaded list visible
      setLoadError(
        err instanceof ApiError
          ? "Couldn't load your recent entries. Pull to try again."
          : 'No connection right now — your recent entries will show up once you\'re back online.',
      );
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const trimmed = text.trim();
  const overLength = trimmed.length > MAX_TRANSCRIPT_LENGTH;

  const handleSave = async () => {
    if (!trimmed || overLength || saving || recording || transcribing) return;
    setSaving(true);
    setSaveError('');
    try {
      const capture = await api.post<SymptomCapture>('/captures', {
        transcript: trimmed,
        input_method: inputMethod,
      });
      setJustSaved(capture);
      setText('');
      setInputMethod('text');
      setRecent((prev) => [capture, ...(prev ?? [])].slice(0, 10));
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.status === 422
            ? 'That entry couldn\'t be saved as written — try shortening or rewording it.'
            : 'Something went wrong saving that — please try again.'
          : 'No connection right now — your entry wasn\'t saved. Try again when you\'re back online.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeScreen noPadding>
      <Header title="Symptom Story" showBack />
      <View style={styles.body}>
        <Text style={styles.prompt}>
          Describe what you're experiencing, in your own words — speak or type, whichever's easier.
        </Text>

        {recording ? (
          <View style={styles.recordingBar}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Listening… tap to stop</Text>
            <Pressable onPress={stopRecording} style={styles.stopBtn} hitSlop={8}>
              <Icon name="square" size={14} color="#fff" />
            </Pressable>
          </View>
        ) : voiceSupported ? (
          <Pressable
            onPress={startRecording}
            style={styles.voiceBtn}
            disabled={transcribing}
          >
            <Icon name="mic" size={16} color={theme.moss} />
            <Text style={styles.voiceBtnText}>
              {transcribing ? 'Finishing up…' : 'Speak instead'}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.mutedText}>
            Voice input isn't available on this device — type below instead.
          </Text>
        )}

        {!!voiceError && <Text style={styles.errorText}>{voiceError}</Text>}

        <Input
          value={text}
          onChangeText={(v) => {
            setText(v);
            setInputMethod('text');
            if (saveError) setSaveError('');
          }}
          editable={!recording}
          placeholder="e.g. Cramps have been worse this week, mostly on the left side…"
          multiline
          numberOfLines={5}
          style={styles.textArea}
          containerStyle={styles.inputContainer}
        />

        {overLength && (
          <Text style={styles.warningText}>
            That's a bit long ({trimmed.length.toLocaleString()} / {MAX_TRANSCRIPT_LENGTH.toLocaleString()} characters) —
            try trimming it down.
          </Text>
        )}
        {!!saveError && <Text style={styles.errorText}>{saveError}</Text>}

        <Button
          label="Save"
          onPress={handleSave}
          loading={saving}
          disabled={!trimmed || overLength || recording || transcribing}
          fullWidth
        />

        {justSaved && (
          <View style={styles.savedCard}>
            <View style={styles.savedHeader}>
              <Icon name="check-circle" size={16} color={theme.success} />
              <Text style={styles.savedLabel}>Saved</Text>
            </View>
            <Text style={styles.savedText}>{justSaved.transcript}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Recent</Text>

        {recent === null ? (
          <Text style={styles.mutedText}>Loading…</Text>
        ) : recent.length === 0 ? (
          <EmptyState
            iconName="clipboard-list"
            title="No entries yet"
            subtitle="Whatever you save above will show up here."
          />
        ) : (
          <View style={styles.list}>
            {recent.map((c) => (
              <View key={c.id} style={styles.listItem}>
                <Icon
                  name={c.input_method === 'voice' ? 'mic' : 'pencil'}
                  size={14}
                  color={theme.textMuted}
                />
                <View style={styles.listItemBody}>
                  <Text style={styles.listItemText} numberOfLines={3}>
                    {c.transcript}
                  </Text>
                  <Text style={styles.listItemTime}>
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {!!loadError && (
          <Pressable onPress={loadRecent}>
            <Text style={styles.errorText}>{loadError}</Text>
          </Pressable>
        )}
      </View>
    </SafeScreen>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    body: { flex: 1, padding: Spacing.md },
    prompt: {
      fontSize: FontSize.md,
      fontFamily: 'Fraunces_400Regular',
      color: c.textSecondary,
      marginBottom: Spacing.md,
      lineHeight: 22,
    },
    inputContainer: { marginBottom: Spacing.sm },
    textArea: { minHeight: 110, textAlignVertical: 'top', paddingTop: Spacing.sm },

    voiceBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      alignSelf: 'flex-start',
      backgroundColor: c.surfaceElevated,
      borderWidth: 1, borderColor: c.border,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    voiceBtnText: { fontSize: FontSize.sm, fontFamily: 'Fraunces_500Medium', color: c.moss },
    recordingBar: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: c.moss,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.roseDeep },
    recordingText: { flex: 1, fontSize: FontSize.sm, fontFamily: 'Fraunces_500Medium', color: '#fff' },
    stopBtn: {
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center', justifyContent: 'center',
    },
    warningText: {
      fontSize: FontSize.xs,
      color: c.warning,
      marginBottom: Spacing.sm,
    },
    errorText: {
      fontSize: FontSize.xs,
      color: c.error,
      marginBottom: Spacing.sm,
    },
    savedCard: {
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginTop: Spacing.md,
    },
    savedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    savedLabel: { fontSize: FontSize.xs, fontFamily: 'Fraunces_500Medium', color: c.success },
    savedText: { fontSize: FontSize.sm, fontFamily: 'Fraunces_400Regular', color: c.textPrimary, lineHeight: 20 },

    sectionTitle: {
      fontSize: FontSize.sm,
      fontFamily: 'Fraunces_500Medium',
      color: c.textSecondary,
      marginTop: Spacing.xl,
      marginBottom: Spacing.sm,
    },
    mutedText: { fontSize: FontSize.sm, color: c.textMuted, fontFamily: 'Fraunces_400Regular' },

    list: { gap: Spacing.sm },
    listItem: {
      flexDirection: 'row',
      gap: Spacing.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.md,
      padding: Spacing.sm,
      alignItems: 'flex-start',
    },
    listItemBody: { flex: 1 },
    listItemText: { fontSize: FontSize.sm, fontFamily: 'Fraunces_400Regular', color: c.textPrimary, lineHeight: 19 },
    listItemTime: { fontSize: FontSize.xs, color: c.textMuted, marginTop: 4 },
  });
}
