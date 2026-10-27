// What the AI sees for one chat message: her words, plus a note that something was attached.
// Never the file and never its name (a filename can carry names or clinical details).
export const MAX_CONTENT = 2000;

interface Attachable {
  text: string;
  attachments?: { kind: 'image' | 'file' }[];
}

export function contentOf(m: Attachable): string {
  const notes = (m.attachments ?? []).map((a) => (a.kind === 'image' ? '[Attached a photo]' : '[Attached a file]'));
  return [m.text.trim(), ...notes].filter(Boolean).join('\n').slice(0, MAX_CONTENT);
}
