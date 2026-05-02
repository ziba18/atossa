import { Platform } from 'react-native';
import { supabase } from './supabase';

// Apple Health integration (iPhone only — react-native-health is not reliable on iPad).
// Requires react-native-health installed and linked via EAS Build (not Expo Go).
let AppleHealthKit: any = null;
const isIPhone = Platform.OS === 'ios' && !(Platform as any).isPad;
if (isIPhone) {
  try {
    AppleHealthKit = require('react-native-health').default;
  } catch {
    // Not available in Expo Go — needs EAS Build
  }
}

export type HealthKitAvailability =
  | { available: true }
  | { available: false; reason: 'ipad' | 'expo_go' | 'platform' };

export function getHealthKitAvailability(): HealthKitAvailability {
  if (Platform.OS !== 'ios') return { available: false, reason: 'platform' };
  if ((Platform as any).isPad) return { available: false, reason: 'ipad' };
  if (!AppleHealthKit) return { available: false, reason: 'expo_go' };
  return { available: true };
}

export type InitHealthKitResult =
  | { ok: true }
  | { ok: false; reason: 'unavailable' | 'denied' | 'error'; message?: string };

const PERMISSIONS = {
  permissions: {
    read: ['Weight', 'BloodPressureDiastolic', 'BloodPressureSystolic', 'HeartRate'],
    write: [],
  },
};

export async function initHealthKit(): Promise<InitHealthKitResult> {
  if (!AppleHealthKit) return { ok: false, reason: 'unavailable' };
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(PERMISSIONS, (err: unknown) => {
      if (!err) return resolve({ ok: true });
      const msg = err instanceof Error ? err.message : String(err);
      // react-native-health surfaces "User has denied" / "not authorized" strings
      if (/denied|authoriz/i.test(msg)) {
        resolve({ ok: false, reason: 'denied', message: msg });
      } else {
        resolve({ ok: false, reason: 'error', message: msg });
      }
    });
  });
}

export async function syncWeightFromHealthKit(userId: string): Promise<void> {
  if (!AppleHealthKit) return;
  const options = {
    unit: 'kg',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
    ascending: false,
    limit: 10,
  };

  AppleHealthKit.getWeightSamples(options, async (err: unknown, results: any[]) => {
    if (err || !results?.length) return;
    const rows = results.map((r) => ({
      user_id: userId,
      recorded_at: r.startDate,
      metric_type: 'weight',
      value: r.value,
      unit: 'kg',
      source: 'apple_health',
    }));
    await supabase.from('health_metrics').upsert(rows, { onConflict: 'user_id,metric_type,recorded_at' });
  });
}

export async function syncBloodPressureFromHealthKit(userId: string): Promise<void> {
  if (!AppleHealthKit) return;
  const options = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
    ascending: false,
    limit: 10,
  };

  AppleHealthKit.getBloodPressureSamples(options, async (err: unknown, results: any[]) => {
    if (err || !results?.length) return;
    const rows: object[] = [];
    results.forEach((r) => {
      rows.push({
        user_id: userId,
        recorded_at: r.startDate,
        metric_type: 'blood_pressure_systolic',
        value: r.bloodPressureSystolicValue,
        unit: 'mmHg',
        source: 'apple_health',
      });
      rows.push({
        user_id: userId,
        recorded_at: r.startDate,
        metric_type: 'blood_pressure_diastolic',
        value: r.bloodPressureDiastolicValue,
        unit: 'mmHg',
        source: 'apple_health',
      });
    });
    await supabase.from('health_metrics').upsert(rows, { onConflict: 'user_id,metric_type,recorded_at' });
  });
}
