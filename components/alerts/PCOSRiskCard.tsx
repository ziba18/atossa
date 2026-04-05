import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PCOSAssessment } from '../../types/database';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface Props {
  assessment: PCOSAssessment;
}

const RISK_COLORS: Record<string, string> = {
  low: Colors.emerald,
  moderate: Colors.whiskey,
  high: Colors.cherry,
  very_high: Colors.cherryDark,
};

const RISK_BADGES: Record<string, 'emerald' | 'whiskey' | 'cherry' | 'danger'> = {
  low: 'emerald',
  moderate: 'whiskey',
  high: 'cherry',
  very_high: 'danger',
};

export function PCOSRiskCard({ assessment }: Props) {
  const color = RISK_COLORS[assessment.risk_level] ?? Colors.cherry;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>PCOS Risk Assessment</Text>
        <Badge
          label={assessment.risk_level.replace('_', ' ').toUpperCase()}
          variant={RISK_BADGES[assessment.risk_level] ?? 'cherry'}
        />
      </View>

      {/* Score bar */}
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${assessment.risk_score}%` as any, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.score, { color }]}>{Math.round(assessment.risk_score)}/100</Text>

      {assessment.contributing_factors.length > 0 && (
        <View style={styles.factors}>
          <Text style={styles.factorsTitle}>Contributing Factors:</Text>
          {assessment.contributing_factors.map((f, i) => (
            <Text key={i} style={styles.factor}>• {f}</Text>
          ))}
        </View>
      )}

      <Text style={styles.recommendation}>{assessment.recommendation}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  barBg: { height: 8, backgroundColor: Colors.border, borderRadius: Radius.full },
  barFill: { height: 8, borderRadius: Radius.full },
  score: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, alignSelf: 'flex-end' },
  factors: { marginTop: Spacing.xs },
  factorsTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  factor: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  recommendation: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
});
