// "Where your notes are kept" (Profile). Wording from Safety's where-your-data-is.md; every line is backed
// by evidence there. The server line lives here so it changes in one place if the API leaves Render.
import { Platform } from 'react-native';
import { CHAT_ENABLED } from '../lib/features';

export const SERVER_LINE = 'The server that passes them between your phone and the database runs in the United States.';

export const DATA_LINES: string[] = [
  'Your notes are stored in a database in Ireland (EU).',
  SERVER_LINE,
  // Voice input exists only in the phone app (lib/transcription.ts: web returns unsupported).
  ...(Platform.OS === 'web' ? [] : ['Voice notes are turned into text on your phone. The sound is not sent anywhere.']),
  ...(CHAT_ENABLED ? ['Messages you type into the chat are processed by Groq in the United States.'] : []),
  'You can delete your account and everything you’ve saved from Profile.',
];
