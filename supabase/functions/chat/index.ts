// Proxies chat messages to Google's Gemini API (free tier) so the Gemini
// key never ships inside the mobile app bundle.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_INSTRUCTION = `You are Atossa, a supportive assistant inside a menstrual/PCOS tracking app.
You help users reflect on symptoms, pain, and cycle patterns they log in the chat.
You are NOT a doctor: never diagnose conditions or claim a symptom pattern proves a specific
medical cause. Speak supportively and plainly. When pain or symptoms sound severe or persistent,
encourage the user to bring it up with their doctor and mention they can generate a GP report
in the app. Keep responses concise (2-4 sentences) and warm.`;

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), { status: 500 });
  }

  const authHeader = req.headers.get('Authorization');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader ?? '' } } }
  );
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { message, history } = await req.json();
  if (!message || typeof message !== 'string') {
    return new Response(JSON.stringify({ error: 'message is required' }), { status: 400 });
  }

  const contents = [
    ...(Array.isArray(history) ? history : []).map((m: { role: string; text: string }) => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
    }),
  });

  if (!geminiResponse.ok) {
    const errText = await geminiResponse.text();
    return new Response(JSON.stringify({ error: 'Gemini request failed', detail: errText }), {
      status: 502,
    });
  }

  const data = await geminiResponse.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) {
    return new Response(JSON.stringify({ error: 'No reply from Gemini' }), { status: 502 });
  }

  return new Response(JSON.stringify({ reply }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
