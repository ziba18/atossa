// Property test for the doctor summary: for 300 random mock record sets, every "N/10" in the document
// is a score the user entered, and no string contains diagnostic / trend / causal wording.
// Run: node --experimental-strip-types --import ./scripts/ai-eval/ts-register.mjs scripts/ai-eval/summary-fidelity.test.mjs
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { buildDoctorSummary } = await import('../../lib/records/summary.ts');

let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const ZONES = ['Lower tummy left', 'Lower tummy centre', 'Lower tummy right', 'Lower back', 'Deep inside', 'Legs', 'Bottom'];
const IMP = ['Work or study', 'Sleep', 'Exercise', 'Plans with people', 'Sex', 'Nothing today', 'Not sure', 'Skip'];
const WORDS = ['Sharp pain on the left.', 'Tired and sore.', 'Bad day, stayed in bed.', 'Cramps again.', 'Back ache, took ibuprofen.', 'Felt fine mostly.', 'It might be stress, who knows.', 'My mum thinks it is serious.'];
const BANNED = /\b(suggest\w*|indicat\w*|consistent with|likely|probabl\w*|linked to|caused? by|abnormal|severe|moderate|trend\w*|worsen\w*|improv\w*|you should|recommend\w*|average\w*)\b/i;
const key = (d) => d.toISOString().slice(0, 10);
const base = new Date('2026-09-01T00:00:00Z');

let docs = 0, strings = 0;
const bad = [];
for (let n = 0; n < 300; n++) {
  const symptoms = [];
  const scores = new Set();
  const count = 1 + Math.floor(rnd() * 12);
  for (let i = 0; i < count; i++) {
    const day = new Date(base.getTime() + Math.floor(rnd() * 55) * 86400000);
    const worst = rnd() < 0.7 ? Math.floor(rnd() * 11) : null;
    const typical = rnd() < 0.4 ? Math.floor(rnd() * 11) : null;
    if (worst != null) scores.add(worst);
    if (typical != null) scores.add(typical);
    symptoms.push({
      id: `s${n}-${i}`, createdAt: key(day) + 'T09:00:00Z',
      data: {
        date: key(day), words: rnd() < 0.9 ? pick(WORDS) : '', where: '', worst, typical, score: worst,
        zones: rnd() < 0.6 ? [pick(ZONES), pick(ZONES)] : [], impacts: rnd() < 0.6 ? [pick(IMP)] : [],
      },
    });
  }
  const doc = buildDoctorSummary(
    { symptoms, periodDays: [], medicines: [], history: [], appointments: [] },
    { from: '2026-09-01', to: '2026-10-26', today: '2026-10-26' },
  );
  docs++;
  const walk = (v, path) => {
    if (typeof v === 'string') {
      strings++;
      for (const m of v.matchAll(/(\d+)\s*\/\s*10\b|(\d+)[⁠\s]*[–-][⁠\s]*(\d+)\s*\/\s*10\b/g)) {
        for (const g of [m[1], m[2], m[3]]) if (g != null && !scores.has(Number(g))) bad.push(`score ${g} not entered: ${v}`);
      }
      // "7/10" after a range dash is handled by the second branch; also check bare single scores in text like "at worst 8"
      if (path !== 'quotes.text' && BANNED.test(v)) bad.push(`banned word in ${path}: ${v}`);
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, path));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k === 'text' && path.startsWith('quotes') ? 'quotes.text' : path ? `${path}.${k}` : k);
  };
  walk(doc, '');
}
console.log(`summary-fidelity: ${docs} documents, ${strings} strings, ${bad.length} problems`);
for (const b of bad.slice(0, 15)) console.log('  ' + b);
process.exit(bad.length ? 1 : 0);
