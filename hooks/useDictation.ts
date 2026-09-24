import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import {
  MAX_RECORDING_DURATION_MS, ensureMicPermission, isVoiceCaptureSupported, messageForErrorCode,
} from '../lib/transcription';

/**
 * On-device dictation for a text box. `onTranscript` receives the full transcript so far
 * (it replaces the previous partial result), so the caller decides how to merge it with
 * whatever was already typed. Errors are always human-readable messages.
 */
export function useDictation(onTranscript: (text: string) => void) {
  const supported = useRef(isVoiceCaptureSupported()).current;
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const heardAnySpeech = useRef(false);
  const hadError = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cb = useRef(onTranscript);
  cb.current = onTranscript;

  const clearTimer = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  }, []);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    if (transcript.trim()) heardAnySpeech.current = true;
    cb.current(transcript);
  });

  useSpeechRecognitionEvent('end', () => {
    clearTimer();
    setRecording(false);
    if (hadError.current) return;
    if (!heardAnySpeech.current) setError("We couldn't hear anything — try again, or type instead.");
  });

  useSpeechRecognitionEvent('error', (event) => {
    clearTimer();
    setRecording(false);
    hadError.current = true;
    setError(messageForErrorCode(event.error));
  });

  // A recording that runs while the app is backgrounded is discarded rather than left running.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && recording) {
        clearTimer();
        ExpoSpeechRecognitionModule.abort();
        setRecording(false);
        setError('Recording stopped because Atossa went to the background — try again.');
      }
    });
    return () => sub.remove();
  }, [recording, clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const start = useCallback(async () => {
    setError('');
    if (!supported) {
      setError("Voice input isn't available on this device — you can type instead.");
      return;
    }
    const { granted, canAskAgain } = await ensureMicPermission();
    if (!granted) {
      setError(
        canAskAgain
          ? 'Microphone access is needed — try again and allow it, or type instead.'
          : 'Microphone access is off — turn it on in Settings, or type instead.',
      );
      return;
    }
    heardAnySpeech.current = false;
    hadError.current = false;
    setRecording(true);
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
      requiresOnDeviceRecognition: true,
      addsPunctuation: true,
    });
    timer.current = setTimeout(() => ExpoSpeechRecognitionModule.stop(), MAX_RECORDING_DURATION_MS);
  }, [supported]);

  const stop = useCallback(() => {
    clearTimer();
    ExpoSpeechRecognitionModule.stop();
  }, [clearTimer]);

  return { supported, recording, error, clearError: () => setError(''), start, stop };
}
