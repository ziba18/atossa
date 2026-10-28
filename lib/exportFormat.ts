// Pure parts of "Download all my notes" (no React Native imports, so node tests can load them).
export const EXPORT_HEADING = 'Everything you saved in Atossa. Notes in your words. Not a medical record.';

export type ExportFailure = 'password' | 'network' | 'limit' | 'other';

export function exportFileName(now = new Date()): string {
  return `atossa-notes-${now.toISOString().slice(0, 10)}.json`;
}

/** The file body: the heading first, then the server's export untouched. */
export function buildExportFile(body: unknown): string {
  return JSON.stringify({ about: EXPORT_HEADING, ...(body as object) }, null, 2);
}

/** `status` is the HTTP status of the failed call (0 = no connection), undefined for anything else. */
export function classifyExportStatus(status: number | undefined): ExportFailure {
  if (status === 0) return 'network';
  if (status === 429) return 'limit';
  if (status === 400 || status === 401 || status === 403) return 'password';
  return 'other';
}

export const EXPORT_ERRORS: Record<ExportFailure, string> = {
  password: 'That password didn’t match. Try again.',
  network: 'No connection. Check it and try again.',
  limit: 'You’ve asked for this a few times already. Try again in an hour.',
  other: 'We couldn’t make your file. Try again in a moment.',
};
