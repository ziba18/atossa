import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limit BEFORE calling Anthropic
    const { data: limitData, error: limitError } = await supabase.rpc('check_ai_rate_limit', {
      p_user_id: user.id,
    });

    if (limitError) {
      console.error('Rate limit check error:', limitError);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { allowed, message_count, daily_limit } = limitData[0];
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'Daily message limit reached',
          message_count,
          daily_limit,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { messages, context } = await req.json();

    const systemPrompt = buildSystemPrompt(context);

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? '';

    // Record usage with actual token counts
    const inputTokens = data.usage?.input_tokens ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    await serviceClient.rpc('increment_ai_usage', {
      p_user_id: user.id,
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
    });

    return new Response(
      JSON.stringify({
        reply,
        usage: {
          message_count: message_count + 1,
          daily_limit,
          remaining: daily_limit - (message_count + 1),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('ai-chat error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildSystemPrompt(context: Record<string, unknown>): string {
  const lines = [
    'You are Ava, a compassionate and knowledgeable women\'s health assistant in the Attosa app.',
    'You help users understand their menstrual cycle, symptoms, and general reproductive health.',
    'Always remind users to consult a healthcare provider for medical advice.',
    'Keep responses concise, warm, and easy to understand. Use emojis sparingly.',
    '',
    '## User\'s current health context:',
  ];

  if (context?.name) lines.push(`- Name: ${context.name}`);
  if (context?.age) lines.push(`- Age: ${context.age}`);
  if (context?.lastPeriodStart) lines.push(`- Last period started: ${context.lastPeriodStart}`);
  if (context?.nextPeriodStart) lines.push(`- Next predicted period: ${context.nextPeriodStart} (${context.daysUntilPeriod} days away)`);
  if (context?.nextOvulation) lines.push(`- Next ovulation: ${context.nextOvulation}`);
  if (context?.averageCycleLength) lines.push(`- Average cycle length: ${context.averageCycleLength} days`);
  if (context?.currentPhase) lines.push(`- Current cycle phase: ${context.currentPhase}`);
  if (context?.recentSymptoms?.length) lines.push(`- Recent symptoms logged: ${(context.recentSymptoms as string[]).join(', ')}`);
  if (context?.pcosRisk) lines.push(`- PCOS risk flag: ${context.pcosRisk}`);

  lines.push('', 'Use this context to give personalized, relevant responses. Do not repeat this data back verbatim — just let it inform your answers.');

  return lines.join('\n');
}
