// Fixed signpost when a note contains urgent wording (hazard H4). Runs on the phone, sends nothing anywhere.
// It never labels, scores, stores or explains the note: it only shows the same fixed lines the chat guard uses.
// The two patterns are copied from backend/app/services/output_guard.py (_EMERGENCY, _SELF_HARM_RX);
// scripts/urgent-wording.test.mjs checks they still agree on a shared phrase list.

const QUOTES: Record<string, string> = { '\u2018': "'", '\u2019': "'", '\u02bc': "'", '\u2032': "'" };

export const URGENT_SIGNPOST =
  'If you have severe sudden pain, very heavy bleeding or feel faint, call 999 or go to A&E, or call NHS 111.';
export const SELF_HARM_SIGNPOST =
  'If you might act on these thoughts, call 999 now. You can also call Samaritans free, any time, on 116 123, or call NHS 111.';

export const EMERGENCY_PATTERN = new RegExp(String.raw`\b(?:can'?t breathe?|can'?t breath\b|can'?t (?:catch|get) my breath|struggling to breathe|chest pain|coughing up blood|faint(?:ed|ing)?|passed out|passing out|(?:going|about) to pass out|blacked out|black(?:ing)? out|collaps\w+|soaking (?:a |through (?:a )?)?pads? (?:an|every|each) hour|bleeding (?:through|heavily|badly)|(?:very |really |so )?heavy bleeding|bleeding (?:really |very |so )(?:heavily|badly)|severe (?:sudden )?(?:\w+ ){0,2}pain|worst pain|unbearable pain|excruciating|in agony|agony|gushing blood|pool of blood|(?:can'?t|can hardly|hardly) breathe?|worst (?:pain )?(?:i'?ve|i have) ever|pain so bad|(?:big )?clots? (?:the size of|bigger than)|pain (?:is |was )?unbearable|pain (?:is |was )?(?:a )?(?:10|ten)(?:/| out of )10|sudden (?:sharp |stabbing )?pain|\bi(?:'?m| am| think i'?m)? (?:\w+ ){0,3}miscarr\w+|pregnan\w+ and (?:bleeding|pain|cramp\w*)|(?:i'?m|i am|am) pregnant.{0,40}(?:bleeding|pain|cramp\w*)|(?:cannot|can not|hard to|hardly able to) breathe?|short(?:ness)? of breath|chest (?:is )?(?:feels? )?tight\w*|(?:can'?t|cannot|won'?t|will not|doesn'?t|isn'?t|not) (?:stop|stopping) bleeding|bleeding (?:won'?t|will not|doesn'?t|isn'?t|is not) (?:stop|stopping)|(?:blood|bleeding) everywhere|bleeding.{0,40}pregnant)\b`, 'i');
export const SELF_HARM_PATTERN = new RegExp(String.raw`\b(?:suicid\w+|kill(?:ing)? myself|end(?:ing)? my (?:own )?life|self[- ]harm\w*|want(?:ed)? to die|don'?t want to (?:be here|live|wake up)|end it all|hurt(?:ing)? myself|overdos\w+|(?:took|taken|swallowed) (?:too many|a lot of|all (?:my|the)) (?:pills|tablets|painkillers))\b`, 'i');

function normalise(text: string): string {
  const t = text.normalize('NFKC').replace(/\p{Cf}/gu, '');
  return t.replace(/[\u2018\u2019\u02bc\u2032]/g, (c) => QUOTES[c] ?? c);
}

/** The fixed line to show for this text, or null. Self-harm wording gets the support lines. */
export function urgentSignpost(text: string): string | null {
  const t = normalise(text);
  if (SELF_HARM_PATTERN.test(t)) return SELF_HARM_SIGNPOST;
  if (EMERGENCY_PATTERN.test(t)) return URGENT_SIGNPOST;
  return null;
}
