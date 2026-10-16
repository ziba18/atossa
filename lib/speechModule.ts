import type { ExpoSpeechRecognitionNativeEventMap } from 'expo-speech-recognition';

type SpeechModuleType = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

// Lazy-require speech recognition so the app still loads in Expo Go, which
// doesn't include this native module (the package throws at import when the
// module is missing). There, `SpeechModule` is null and dictation reports
// "not available" instead of breaking the Chat tab.
type EventHook = <K extends keyof ExpoSpeechRecognitionNativeEventMap>(
  eventName: K,
  listener: (ev: ExpoSpeechRecognitionNativeEventMap[K]) => void,
) => void;

let SpeechModule: SpeechModuleType | null = null;
let useSpeechEvent: EventHook = () => {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('expo-speech-recognition');
  SpeechModule = mod.ExpoSpeechRecognitionModule;
  useSpeechEvent = mod.useSpeechRecognitionEvent;
} catch {
  // Not linked in this build (Expo Go) — leave the no-op fallbacks.
}

export { SpeechModule, useSpeechEvent };
