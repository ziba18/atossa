import type { CycleLog, SymptomLog, HealthMetric, PCOSAssessment } from '../types/database';
import { daysBetween, standardDeviation } from './dateHelpers';
import { PCOS_INDICATOR_SYMPTOMS } from '../constants/symptomTypes';

export interface PCOSInput {
  userId: string;
  cycleLogs: CycleLog[];          // last 12 months
  symptomLogs: SymptomLog[];      // last 90 days
  healthMetrics: HealthMetric[];  // all available
}

export interface PCOSResult {
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  flagIrregularCycles: boolean;
  flagHyperandrogenism: boolean;
  flagElevatedLhFshRatio: boolean;
  flagInsulinResistance: boolean;
  flagWeightGain: boolean;
  contributingFactors: string[];
  recommendation: string;
}

export function computePCOSRisk(input: PCOSInput): PCOSResult {
  const { cycleLogs, symptomLogs, healthMetrics } = input;
  const factors: string[] = [];
  let score = 0;

  // --- Rotterdam Flag 1: Irregular cycles ---
  let flagIrregular = false;
  const cycleLengths: number[] = [];
  for (let i = 1; i < cycleLogs.length; i++) {
    const len = daysBetween(cycleLogs[i - 1].period_start, cycleLogs[i].period_start);
    if (len >= 15 && len <= 90) cycleLengths.push(len);
  }
  if (cycleLengths.length >= 2) {
    const avg = cycleLengths.reduce((s, v) => s + v, 0) / cycleLengths.length;
    const sd = standardDeviation(cycleLengths);
    const longCycles = cycleLengths.filter((l) => l > 38).length;

    if (avg > 35 || sd > 10 || longCycles >= 2) {
      flagIrregular = true;
      score += 30;
      factors.push(`Irregular cycle pattern (avg ${Math.round(avg)} days, SD ${sd.toFixed(1)})`);
    }
  }

  // --- Rotterdam Flag 2: Hyperandrogenism ---
  let flagHyperandrogenism = false;
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentSymptoms = symptomLogs.filter(
    (s) => new Date(s.logged_date) >= ninetyDaysAgo
  );

  const acneSevere = recentSymptoms.filter(
    (s) => s.symptom_type === 'acne' && (s.severity ?? 0) >= 7
  ).length;
  const hairLoss = recentSymptoms.filter((s) => s.symptom_type === 'hair_loss').length;
  const excessHair = recentSymptoms.filter((s) => s.symptom_type === 'excessive_hair_growth').length;

  const testosteroneMetrics = healthMetrics.filter((m) => m.metric_type === 'testosterone');
  const highTestosterone = testosteroneMetrics.some((m) => {
    const val = m.unit === 'ng/dL' ? m.value : m.value * 0.0347; // convert pg/mL if needed
    return val > 70;
  });

  let androgenSignals = 0;
  if (acneSevere >= 3) { androgenSignals++; factors.push('Severe acne logged frequently'); }
  if (hairLoss >= 2) { androgenSignals++; factors.push('Hair loss reported multiple times'); }
  if (excessHair >= 2) { androgenSignals++; factors.push('Excess hair growth reported'); }
  if (highTestosterone) { androgenSignals++; factors.push('Elevated testosterone level'); }

  if (androgenSignals >= 2) {
    flagHyperandrogenism = true;
    score += 30;
  }

  // --- Rotterdam Flag 3: Elevated LH/FSH ratio ---
  let flagLhFsh = false;
  const lhMetrics = healthMetrics.filter((m) => m.metric_type === 'lh');
  const fshMetrics = healthMetrics.filter((m) => m.metric_type === 'fsh');

  if (lhMetrics.length > 0 && fshMetrics.length > 0) {
    const latestLh = lhMetrics.sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
    const latestFsh = fshMetrics.sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
    const ratio = latestLh.value / latestFsh.value;
    if (ratio > 2.5) {
      flagLhFsh = true;
      score += 30;
      factors.push(`Elevated LH/FSH ratio (${ratio.toFixed(1)})`);
    }
  }

  // --- Additional: Insulin resistance ---
  let flagInsulin = false;
  const glucoseMetrics = healthMetrics.filter((m) => m.metric_type === 'blood_glucose');
  const highGlucose = glucoseMetrics.some((m) => m.value > 100 && m.unit === 'mg/dL');
  const insulinMetrics = healthMetrics.filter((m) => m.metric_type === 'insulin');
  const highInsulin = insulinMetrics.some((m) => m.value > 25); // µIU/mL fasting
  if (highGlucose || highInsulin) {
    flagInsulin = true;
    score += 10;
    factors.push('Signs of insulin resistance detected');
  }

  // --- Additional: Weight gain trend ---
  let flagWeightGain = false;
  const weightMetrics = healthMetrics
    .filter((m) => m.metric_type === 'weight')
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));

  if (weightMetrics.length >= 2) {
    const first = weightMetrics[0];
    const last = weightMetrics[weightMetrics.length - 1];
    const gainPct = ((last.value - first.value) / first.value) * 100;
    const daysDiff = daysBetween(first.recorded_at.split('T')[0], last.recorded_at.split('T')[0]);
    if (gainPct > 5 && daysDiff <= 60) {
      flagWeightGain = true;
      score += 10;
      factors.push(`Significant weight gain (${gainPct.toFixed(1)}% in ${daysDiff} days)`);
    }
  }

  const riskLevel =
    score >= 80 ? 'very_high' :
    score >= 50 ? 'high' :
    score >= 30 ? 'moderate' :
    'low';

  const rotterdamCount = [flagIrregular, flagHyperandrogenism, flagLhFsh].filter(Boolean).length;

  let recommendation = '';
  if (rotterdamCount >= 2) {
    recommendation =
      'Based on your logged data, you may meet criteria for PCOS. We strongly recommend speaking with a gynecologist or endocrinologist for a professional evaluation, including an ultrasound and blood tests.';
  } else if (score >= 30) {
    recommendation =
      'Some patterns in your data suggest possible hormonal imbalance. Consider tracking your symptoms more closely and discussing them with your healthcare provider.';
  } else {
    recommendation =
      'Your current data does not strongly indicate PCOS. Continue tracking your cycle and symptoms regularly for better insights.';
  }

  return {
    riskScore: Math.min(score, 100),
    riskLevel,
    flagIrregularCycles: flagIrregular,
    flagHyperandrogenism,
    flagElevatedLhFshRatio: flagLhFsh,
    flagInsulinResistance: flagInsulin,
    flagWeightGain,
    contributingFactors: factors,
    recommendation,
  };
}
