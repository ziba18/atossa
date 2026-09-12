import { Platform } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionErrorCode,
} from 'expo-speech-recognition';

// Recordings run entirely on-device (requiresOnDeviceRecognition: true
// everywhere this module is used) — no audio is ever sent to a server, and
// with recordingOptions.persist left at its default (false), no audio file
// is written to disk either. Only the resulting transcript text exists.

export const MAX_RECORDING_DURATION_MS = 60_000;

export function isVoiceCaptureSupported(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    return (
      ExpoSpeechRecognitionModule.isRecognitionAvailable() &&
      ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()
    );
  } catch {
    // Defensive — a native module lookup failure should read as
    // "voice isn't available here", not crash the capture screen.
    return false;
  }
}

export async function ensureMicPermission(): Promise<{ granted: boolean; canAskAgain: boolean }> {
  const current = await ExpoSpeechRecognitionModule.getMicrophonePermissionsAsync();
  if (current.granted) return { granted: true, canAskAgain: current.canAskAgain };
  if (!current.canAskAgain) return { granted: false, canAskAgain: false };
  const result = await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
  return { granted: result.granted, canAskAgain: result.canAskAgain };
}

/** User-facing message for a recognition error — never a raw error string. */
export function messageForErrorCode(code: ExpoSpeechRecognitionErrorCode): string {
  switch (code) {
    case 'not-allowed':
      return "Microphone access is off — turn it on in Settings, or type instead.";
    case 'no-speech':
    case 'speech-timeout':
      return "We couldn't hear anything — try again, or type instead.";
    case 'service-not-allowed':
    case 'language-not-supported':
      return "Voice input isn't available on this device right now — try typing instead.";
    case 'audio-capture':
      return "Something interrupted the recording — try again, or type instead.";
    case 'network':
      return "That needed a network connection it couldn't get — try again, or type instead.";
    case 'busy':
      return "Voice input is still finishing up from last time — wait a moment and try again.";
    case 'interrupted':
      return "Recording was interrupted — try again when you're ready.";
    default:
      return "Something went wrong with voice input — try again, or type instead.";
  }
}
