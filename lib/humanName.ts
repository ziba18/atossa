// Treat null/empty as missing. Treat strings that contain dots/underscores/
// digits, or look like a UUID/hex blob or vowel-less token, as machine-
// generated (Supabase's auto-generated handle, Apple's private-relay `sub`,
// etc.) so callers know to prompt the user for a real name instead of
// greeting them with something like "zjj7zv89nt".
export function isHumanName(n: string | null | undefined): boolean {
  if (!n) return false;
  const v = n.trim();
  if (v.length < 1 || v.length > 60) return false;
  if (/[._]/.test(v)) return false;
  if (/\d/.test(v)) return false;
  if (/^[0-9a-f-]{16,}$/i.test(v.replace(/\s/g, ''))) return false;
  // A single lowercase token with no vowels reads as a random handle, not a name.
  if (!/\s/.test(v) && v === v.toLowerCase() && v.length >= 6 && !/[aeiou]/i.test(v)) return false;
  return true;
}
