import type { SymptomLog, HealthMetric } from '../types/database';

export interface HealthAlert {
  type: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  title: string;
  body: string;
}

export function detectHealthRisks(
  symptomLogs: SymptomLog[],
  healthMetrics: HealthMetric[]
): HealthAlert[] {
  const alerts: HealthAlert[] = [];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Heavy bleeding + dizziness within 1 hour = fainting risk
  const recentHeavy = symptomLogs.filter(
    (s) => s.symptom_type === 'spotting' && s.logged_time >= oneHourAgo
  );
  const recentDizzy = symptomLogs.filter(
    (s) => s.symptom_type === 'dizziness' && s.logged_time >= oneHourAgo
  );
  if (recentHeavy.length > 0 && recentDizzy.length > 0) {
    alerts.push({
      type: 'fainting_risk',
      severity: 'emergency',
      title: 'Fainting Risk Detected',
      body: 'You have logged heavy bleeding and dizziness in the last hour. Please sit down, drink water, and contact someone nearby. Tap the emergency button if you need help.',
    });
  }

  // High blood pressure
  const recentBPSystolic = healthMetrics
    .filter((m) => m.metric_type === 'blood_pressure_systolic')
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
  if (recentBPSystolic && recentBPSystolic.value > 140) {
    alerts.push({
      type: 'health_metric_abnormal',
      severity: 'warning',
      title: 'High Blood Pressure',
      body: `Your recent systolic blood pressure (${recentBPSystolic.value} mmHg) is above normal. Please consult a healthcare provider.`,
    });
  }

  // Missed period detection is handled via prediction logic separately

  return alerts;
}

export function isEmergencySymptomCombination(symptomLogs: SymptomLog[]): boolean {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recentDizzy = symptomLogs.some(
    (s) => s.symptom_type === 'dizziness' && s.logged_time >= oneHourAgo
  );
  const recentHeavy = symptomLogs.some(
    (s) =>
      (s.symptom_type === 'spotting') &&
      s.logged_time >= oneHourAgo
  );
  return recentDizzy && recentHeavy;
}
