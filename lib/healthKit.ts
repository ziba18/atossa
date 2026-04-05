import { Platform } from 'react-native';
import { supabase } from './supabase';

// Apple Health integration (iOS only)
// Requires react-native-health installed and linked via EAS Build (not Expo Go)
let AppleHealthKit: any = null;
if (Platform.OS === 'ios') {
  try {
    AppleHealthKit = require('react-native-health').default;
  } catch {
    // Not available in Expo Go — needs EAS Build
  }
}

const PERMISSIONS = {
  permissions: {
    read: ['Weight', 'BloodPressureDiastolic', 'BloodPressureSystolic', 'HeartRate'],
    write: [],
  },
};

export async function initHealthKit(): Promise<boolean> {
  if (!AppleHealthKit) return false;
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(PERMISSIONS, (err: unknown) => {
      resolve(!err);
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
