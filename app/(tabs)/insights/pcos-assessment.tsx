import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Header } from '../../../components/layout/Header';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { computePCOSRisk } from '../../../algorithms/pcosDetection';
import type { PCOSAssessment, SymptomLog, HealthMetric } from '../../../types/database';
import { Icon } from '../../../components/ui/Icon';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../../constants/theme';

// ─── Risk appearance ──────────────────────────────────────────────────────────
const RISK_CONFIG: Record<string, { color: string; bg: string }> = {
  low: { color: Colors.emeraldDark, bg: Colors.emeraldLighter },
  moderate: { color: Colors.whiskeyDark, bg: Colors.whiskeyLighter },
  high: { color: '#c2410c', bg: '#FFF0E8' },
  very_high: { color: Colors.cherryDark, bg: Colors.cherryLighter },
};

function getBarColor(score: number) {
  if (score >= 80) return Colors.cherryDark;
  if (score >= 50) return '#f97316';
  if (score >= 30) return Colors.whiskey;
  return Colors.emerald;
}

export default function PCOSAssessmentScreen() {
  const user = useAuthStore((s) => s.user);
  const { cycleLogs } = useCycleStore();
  const [assessment, setAssessment] = useState<PCOSAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('pcos_assessments').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => { setAssessment(data as PCOSAssessment | null); setLoading(false); });
  }, [user]);

  const runAssessment = async () => {
    if (!user) return;
    if (cycleLogs.length < 2) {
      Alert.alert('Not enough data', 'Log at least 2 cycles to run a PCOS assessment.');
      return;
    }
    setRunning(true);
    const [symptomsRes, metricsRes] = await Promise.all([
      supabase.from('symptom_logs').select('*').eq('user_id', user.id).order('logged_date', { ascending: false }).limit(200),
      supabase.from('health_metrics').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(100),
    ]);

    const result = computePCOSRisk({
      userId: user.id,
      cycleLogs,
      symptomLogs: (symptomsRes.data ?? []) as SymptomLog[],
      healthMetrics: (metricsRes.data ?? []) as HealthMetric[],
    });

    const { data, error } = await supabase.from('pcos_assessments').insert({
      user_id: user.id,
      risk_score: result.riskScore,
      risk_level: result.riskLevel,
      flag_irregular_cycles: result.flagIrregularCycles,
      flag_hyperandrogenism: result.flagHyperandrogenism,
      flag_elevated_lh_fsh_ratio: result.flagElevatedLhFshRatio,
      flag_insulin_resistance: result.flagInsulinResistance,
      flag_weight_gain: result.flagWeightGain,
      contributing_factors: result.contributingFactors,
      recommendation: result.recommendation,
    }).select().single();

    setRunning(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setAssessment(data as PCOSAssessment);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const riskCfg = assessment ? (RISK_CONFIG[assessment.risk_level] ?? RISK_CONFIG.low) : null;

  // Build criteria rows from saved assessment flags
  const criteria = assessment ? [
    {
      label: 'Irregular Cycles',
      flag: assessment.flag_irregular_cycles,
      description: 'Cycle length >35 days or high variability between cycles',
    },
    {
      label: 'Hyperandrogenism',
      flag: assessment.flag_hyperandrogenism,
      description: 'Elevated testosterone, acne, hair loss, or excess hair growth',
    },
    {
      label: 'Elevated LH/FSH Ratio',
      flag: assessment.flag_elevated_lh_fsh_ratio,
      description: 'LH/FSH ratio greater than 2.5 (logged lab results)',
    },
    {
      label: 'Insulin Resistance',
      flag: assessment.flag_insulin_resistance,
      description: 'Elevated blood glucose or insulin levels logged',
    },
    {
      label: 'Rapid Weight Gain',
      flag: assessment.flag_weight_gain,
      description: 'More than 5% weight gain in under 60 days',
    },
  ] : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title="PCOS Risk Analysis" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>
          Based on Rotterdam diagnostic criteria. This is not a medical diagnosis — always consult a licensed healthcare provider.
        </Text>

        {/* ── Risk score card ────────────────────────────────────────────── */}
        {assessment && riskCfg && (
          <>
            <Card style={[styles.riskCard, { backgroundColor: riskCfg.bg }]}>
              <View style={styles.riskTopRow}>
                <View>
                  <Text style={styles.riskLevelLabel}>Risk level</Text>
                  <Text style={[styles.riskLevelValue, { color: riskCfg.color }]}>
                    {assessment.risk_level.replace('_', ' ')}
                  </Text>
                </View>
                <View style={styles.riskScoreBox}>
                  <Text style={styles.riskScoreLabel}>Score</Text>
                  <Text style={[styles.riskScoreValue, { color: riskCfg.color }]}>
                    {Math.round(assessment.risk_score)}
                    <Text style={styles.riskScoreMax}>/100</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${assessment.risk_score}%` as any,
                      backgroundColor: getBarColor(assessment.risk_score),
                    },
                  ]}
                />
              </View>
            </Card>

            {/* ── Rotterdam Criteria ─────────────────────────────────────── */}
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Rotterdam Criteria</Text>
              <Text style={styles.sectionSubtitle}>PCOS is diagnosed when 2+ of the first 3 criteria are met</Text>
              {criteria.map(({ label, flag, description }) => (
                <View key={label} style={[styles.criteriaRow, flag ? styles.criteriaRowFlagged : styles.criteriaRowClear]}>
                  <Icon name={flag ? 'triangle-alert' : 'check-circle'} size={18} color={flag ? Colors.cherry : Colors.emeraldDark} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.criteriaLabel, { color: flag ? Colors.cherry : Colors.emeraldDark }]}>
                      {label}
                    </Text>
                    <Text style={styles.criteriaDesc}>{description}</Text>
                  </View>
                  <View style={[styles.criteriaBadge, { backgroundColor: flag ? Colors.cherryLighter : Colors.emeraldLighter }]}>
                    <Text style={[styles.criteriaBadgeText, { color: flag ? Colors.cherry : Colors.emeraldDark }]}>
                      {flag ? 'Flagged' : 'Clear'}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>

            {/* ── Contributing factors ───────────────────────────────────── */}
            {assessment.contributing_factors.length > 0 && (
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Contributing Factors</Text>
                {assessment.contributing_factors.map((f, i) => (
                  <View key={i} style={styles.factorRow}>
                    <Text style={styles.factorBullet}>•</Text>
                    <Text style={styles.factorText}>{f}</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* ── Recommendation ─────────────────────────────────────────── */}
            <Card style={styles.recommendationCard}>
              <Text style={styles.recommendationTitle}>Recommendation</Text>
              <Text style={styles.recommendationText}>{assessment.recommendation}</Text>
              <View style={styles.disclaimerRow}>
                <Icon name="triangle-alert" size={14} color={Colors.textMuted} />
                <Text style={styles.disclaimer}>
                  This is for informational purposes only. Always consult a licensed healthcare provider for a clinical diagnosis.
                </Text>
              </View>
            </Card>
          </>
        )}

        {/* No assessment yet */}
        {!assessment && (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Icon name="stethoscope" size={56} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No assessment yet</Text>
            <Text style={styles.emptySubtitle}>
              Run your first PCOS assessment to see your risk level based on your logged cycle data.
            </Text>
          </Card>
        )}

        <Button
          label={assessment ? 'Re-run Assessment' : 'Run PCOS Assessment'}
          onPress={runAssessment}
          loading={running}
          size="lg"
          fullWidth
          style={styles.btn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  subtitle: { fontSize: FontSize.md, color: Colors.textMuted, lineHeight: 22, marginBottom: Spacing.lg },

  riskCard: { borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  riskTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  riskLevelLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 4 },
  riskLevelValue: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, textTransform: 'capitalize' },
  riskScoreBox: { alignItems: 'flex-end' },
  riskScoreLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 4 },
  riskScoreValue: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold },
  riskScoreMax: { fontSize: FontSize.md, fontWeight: FontWeight.regular, color: Colors.textMuted },
  barBg: { height: 12, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: Radius.full, overflow: 'hidden' },
  barFill: { height: 12, borderRadius: Radius.full },

  section: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  sectionSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.md, lineHeight: 18 },

  criteriaRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.sm, borderRadius: Radius.md,
    marginBottom: Spacing.xs, borderWidth: 1,
  },
  criteriaRowFlagged: { backgroundColor: Colors.cherryLighter, borderColor: '#FFCDD6' },
  criteriaRowClear: { backgroundColor: Colors.background, borderColor: Colors.border },
  criteriaLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: 2 },
  criteriaDesc: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16 },
  criteriaBadge: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', flexShrink: 0 },
  criteriaBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  factorRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.xs },
  factorBullet: { fontSize: FontSize.md, color: Colors.whiskey, marginTop: 1 },
  factorText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  recommendationCard: { backgroundColor: Colors.cherryLighter, borderColor: '#FFCDD6', marginBottom: Spacing.md },
  recommendationTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.cherryDark, marginBottom: Spacing.xs },
  recommendationText: { fontSize: FontSize.sm, color: Colors.cherryDark, lineHeight: 20, opacity: 0.85 },
  disclaimerRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: Spacing.md },
  disclaimer: { flex: 1, fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16 },

  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xl, marginBottom: Spacing.md },
  emptyIconWrap: { marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  btn: { marginTop: Spacing.sm },
});
