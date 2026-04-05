import { supabase } from './supabase';
import type { Profile, CycleLog, CyclePrediction, SymptomLog } from '../types/database';
import { differenceInDays } from 'date-fns';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function getCurrentPhase(prediction: CyclePrediction | null, lastLog: CycleLog | null): string {
  if (!lastLog?.period_start) return 'unknown';
  const today = new Date();
  const periodStart = new Date(lastLog.period_start);
  const dayOfCycle = differenceInDays(today, periodStart) + 1;

  if (!prediction) {
    if (dayOfCycle <= 5) return 'menstrual';
    if (dayOfCycle <= 13) return 'follicular';
    if (dayOfCycle <= 16) return 'ovulation';
    return 'luteal';
  }

  if (prediction.next_period_start) {
    const daysUntil = differenceInDays(new Date(prediction.next_period_start), today);
    if (daysUntil < 0) return 'menstrual';
    if (daysUntil <= 5) return 'late luteal';
    if (prediction.next_ovulation) {
      const daysToOvulation = differenceInDays(new Date(prediction.next_ovulation), today);
      if (Math.abs(daysToOvulation) <= 1) return 'ovulation';
      if (daysToOvulation > 0) return 'follicular';
    }
    return 'luteal';
  }
  return 'unknown';
}

export function buildUserContext(
  profile: Profile | null,
  cycleLogs: CycleLog[],
  prediction: CyclePrediction | null,
  symptomLogs: SymptomLog[]
): Record<string, unknown> {
  const lastLog = cycleLogs[0] ?? null;
  const today = new Date();

  const daysUntilPeriod = prediction?.next_period_start
    ? differenceInDays(new Date(prediction.next_period_start), today)
    : null;

  const recentSymptoms = symptomLogs
    .slice(0, 10)
    .map((s) => s.symptom_type)
    .filter((v, i, a) => a.indexOf(v) === i); // unique

  return {
    name: profile?.display_name ?? null,
    age: profile?.date_of_birth
      ? differenceInDays(today, new Date(profile.date_of_birth)) / 365.25 | 0
      : null,
    lastPeriodStart: lastLog?.period_start ?? null,
    nextPeriodStart: prediction?.next_period_start ?? null,
    daysUntilPeriod,
    nextOvulation: prediction?.next_ovulation ?? null,
    averageCycleLength: profile?.average_cycle_length ?? null,
    currentPhase: getCurrentPhase(prediction, lastLog),
    recentSymptoms,
    pcosRisk: null, // could wire in pcos_assessments table later
  };
}

export async function sendChatMessage(
  messages: ChatMessage[],
  context: Record<string, unknown>
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages, context }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to get AI response');
  }

  const data = await response.json();
  return data.reply as string;
}
