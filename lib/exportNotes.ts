// "Download all my notes": the whole account as one JSON file, built from GET /me/export and
// handed to her only (iOS: share sheet; web: browser download). No analytics event, no email.
// Safety conditions (safety/export-card.md): password re-check first, heading on the file.
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { api, ApiError } from './api';

export const EXPORT_HEADING = 'Everything you saved in Atossa. Notes in your words. Not a medical record.';

export type ExportFailure = 'password' | 'network' | 'limit' | 'other';

export function exportFileName(now = new Date()): string {
  return `atossa-notes-${now.toISOString().slice(0, 10)}.json`;
}

/** The file body: the heading first, then the server's export untouched. */
export function buildExportFile(body: unknown): string {
  return JSON.stringify({ about: EXPORT_HEADING, ...(body as object) }, null, 2);
}

export function classifyExportError(e: unknown): ExportFailure {
  if (e instanceof ApiError) {
    if (e.status === 0) return 'network';
    if (e.status === 429) return 'limit';
    if (e.status === 400 || e.status === 401 || e.status === 403) return 'password';
  }
  return 'other';
}

export const EXPORT_ERRORS: Record<ExportFailure, string> = {
  password: 'That password didn’t match. Try again.',
  network: 'No connection. Check it and try again.',
  limit: 'You’ve asked for this a few times already. Try again in an hour.',
  other: 'We couldn’t make your file. Try again in a moment.',
};

let lastUri: string | null = null;

/** Re-checks the password, fetches the export and opens the share sheet / download. Throws on failure. */
export async function downloadAllNotes(email: string, password: string): Promise<void> {
  // Sign-in call only to prove it is her; its tokens are not stored.
  await api.post('/auth/login', { email, password });
  const body = await api.get<unknown>('/me/export');
  const text = buildExportFile(body);
  const name = exportFileName();

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const { File, Paths } = await import('expo-file-system');
  if (lastUri) { try { const old = new File(lastUri); if (old.exists) old.delete(); } catch {} }
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.write(text);
  lastUri = f.uri;
  if (!(await Sharing.isAvailableAsync())) throw new Error('sharing unavailable');
  await Sharing.shareAsync(f.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Your Atossa notes' });
}
