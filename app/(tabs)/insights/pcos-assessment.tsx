import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { supabase } from '../../../lib/supabase';
import { PCOSRiskCard } from '../../../components/alerts/PCOSRiskCard';
import { Button } from '../../../components/ui/Button';
import { Header } from '../../../components/layout/Header';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { computePCOSRisk } from '../../../algorithms/pcosDetection';
import type { PCOSAssessment, SymptomLog, HealthMetric } from '../../../types/database';
import { Colors } from '../../../constants/colors';
import { FontSize, Spacing } from '../../../constants/theme';

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title="PCOS Assessment" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>
          This assessment uses the Rotterdam criteria and your logged data to estimate your PCOS risk. It is not a medical diagnosis.
        </Text>

        {assessment && <PCOSRiskCard assessment={assessment} />}

        <Button
          label={assessment ? 'Re-run Assessment' : 'Run PCOS Assessment'}
          onPress={runAssessment}
          loading={running}
          size="lg"
          fullWidth
          style={styles.btn}
        />

        <Text style={styles.disclaimer}>
          ⚠️ This is for informational purposes only. Always consult a licensed healthcare provider for a clinical diagnosis.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md },
  subtitle: { fontSize: FontSize.md, color: Colors.textMuted, lineHeight: 22, marginBottom: Spacing.xl },
  btn: { marginTop: Spacing.lg },
  disclaimer: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.lg, lineHeight: 18 },
});
