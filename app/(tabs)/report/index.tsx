import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '../../../components/ui/Icon';

const BG    = '#f7f3eb';
const CARD  = '#fdf8f1';
const BLUE  = '#5B4B73';
const LBLUE = '#A89AC0';
const BLUE_SOFT = '#E5DEEC';
const PINK  = '#3a4d39';
const MATCHA= '#4d6b4c';
const CREAM = '#1c1e1c';
const MUTED = '#7a6e60';
const RED   = '#8B3A3A';

// ── Key findings ───────────────────────────────────────────────────────────────
const FINDINGS = [
  {
    bar:   RED,
    emoji: '🔴',
    title: 'Pain score 7.4/10',
    desc:  'Sustained · 8 consecutive weeks · clinically significant',
    badge: 'FLAG',
    badgeColor: RED,
    badgeBg:    RED + '22',
  },
  {
    bar:   RED,
    emoji: '🔴',
    title: 'Heavy flow · 3 of 3 cycles',
    desc:  'Abnormal volume · logged by wearable + self-report',
    badge: 'FLAG',
    badgeColor: RED,
    badgeBg:    RED + '22',
  },
  {
    bar:   LBLUE,
    emoji: '🔵',
    title: 'Cycle · 34–47 days',
    desc:  'Irregular pattern · consistent across tracked period',
    badge: null,
    badgeColor: '',
    badgeBg:    '',
  },
];

// ── SHAP bars ──────────────────────────────────────────────────────────────────
const SHAP = [
  { label: 'Cycle phase',    pct: 86 },
  { label: 'HRV drop',       pct: 69 },
  { label: 'Sleep quality',  pct: 48 },
  { label: 'Hormonal data',  pct: 36 },
];

// ── GP questions ───────────────────────────────────────────────────────────────
const GP_QUESTIONS = [
  'Could this be PCOS or endometriosis based on my symptom history?',
  'Is my menstrual flow clinically abnormal?',
  'What further tests would you recommend — blood panel, ultrasound?',
  'Are there treatment options to reduce my pain and regulate my cycle?',
];

export default function GPReportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>GP Report</Text>
          <Text style={styles.sub}>Your data. Your story. — Atossa</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>READY TO SHARE</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/profile' as any)} style={styles.avatarBtn} hitSlop={8}>
            <Icon name="user" size={16} color={PINK} />
          </Pressable>
        </View>
      </View>

      {/* ── Patient card ── */}
      <View style={styles.patientCard}>
        <View style={styles.patientRow}>
          <Text style={styles.patientName}>Ziba Fotouhi</Text>
          <Text style={styles.patientAge}>Age: 28</Text>
        </View>
        <Text style={styles.patientSub}>Suspected PCOS · 8 weeks · multimodal data</Text>
      </View>

      {/* ── Key findings ── */}
      <Text style={styles.sectionTitle}>Key Findings</Text>
      {FINDINGS.map((f, i) => (
        <View key={i} style={styles.findingCard}>
          <View style={[styles.findingBar, { backgroundColor: f.bar }]} />
          <View style={styles.findingBody}>
            <View style={styles.findingTitleRow}>
              <Text style={styles.findingEmoji}>{f.emoji}</Text>
              <Text style={styles.findingTitle}>{f.title}</Text>
              {f.badge && (
                <View style={[styles.findingBadge, { backgroundColor: f.badgeBg, borderColor: f.badgeColor }]}>
                  <Text style={[styles.findingBadgeText, { color: f.badgeColor }]}>{f.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.findingDesc}>{f.desc}</Text>
          </View>
        </View>
      ))}

      {/* ── SHAP bars ── */}
      <Text style={styles.sectionTitle}>What Is Driving Symptoms?</Text>
      <View style={styles.shapCard}>
        <Text style={styles.shapAiLabel}>AI explanation — SHAP-powered</Text>
        {SHAP.map((s, i) => (
          <View key={i} style={styles.shapRow}>
            <Text style={styles.shapLabel}>{s.label}</Text>
            <View style={styles.shapTrack}>
              <View style={[styles.shapFill, { width: `${s.pct}%` }]} />
            </View>
            <Text style={styles.shapPct}>{s.pct}%</Text>
          </View>
        ))}
      </View>

      {/* ── GP questions ── */}
      <Text style={styles.sectionTitle}>Questions for Your GP</Text>
      <View style={styles.questionsCard}>
        {GP_QUESTIONS.map((q, i) => (
          <View key={i} style={styles.questionRow}>
            <Text style={styles.questionNum}>{i + 1}.</Text>
            <Text style={styles.questionText}>{q}</Text>
          </View>
        ))}
      </View>

      {/* ── Export buttons ── */}
      <View style={styles.exportRow}>
        <Pressable
          style={styles.exportFilled}
          onPress={() => Alert.alert('Sharing coming soon')}
        >
          <Text style={styles.exportFilledText}>📤 Share with GP</Text>
          <Text style={styles.exportFilledSub}>Send via NHS app</Text>
        </Pressable>
        <Pressable
          style={styles.exportOutlined}
          onPress={() => Alert.alert('PDF export coming soon')}
        >
          <Text style={styles.exportOutlinedText}>⬇ Export PDF</Text>
          <Text style={styles.exportOutlinedSub}>Download full report</Text>
        </Pressable>
      </View>

      {/* ── Footer ── */}
      <Text style={styles.footer}>Your data. Your story. Your health.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 16, paddingTop: 4 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 8,
  },
  title: { color: CREAM, fontSize: 22, fontWeight: '700' },
  sub:   { color: MUTED, fontSize: 12, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    backgroundColor: '#E3DCC6',
    borderWidth: 1, borderColor: PINK,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  badgeText: { color: PINK, fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  avatarBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: CARD,
    borderWidth: 1.5, borderColor: PINK,
    alignItems: 'center', justifyContent: 'center',
  },

  patientCard: {
    backgroundColor: CARD,
    borderRadius: 14, padding: 16,
    borderWidth: 2, borderColor: CREAM,
    marginBottom: 20,
    shadowColor: CREAM,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 3,
  },
  patientRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  patientName: { color: CREAM, fontSize: 16, fontWeight: '700' },
  patientAge:  { color: BLUE, fontSize: 13, fontWeight: '600' },
  patientSub:  { color: MUTED, fontSize: 12, marginTop: 6 },

  sectionTitle: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 4,
  },

  findingCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 2, borderColor: CREAM,
    shadowColor: CREAM,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 0,
    elevation: 2,
  },
  findingBar:  { width: 4, backgroundColor: RED },
  findingBody: { flex: 1, padding: 12 },
  findingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  findingEmoji: { fontSize: 14 },
  findingTitle: { color: CREAM, fontSize: 13, fontWeight: '700', flex: 1 },
  findingBadge: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  findingBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  findingDesc: { color: MUTED, fontSize: 11, lineHeight: 17 },

  shapCard: {
    backgroundColor: CARD,
    borderRadius: 14, padding: 16,
    marginBottom: 20,
    borderWidth: 2, borderColor: CREAM,
    shadowColor: CREAM,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 3,
  },
  shapAiLabel: { color: MUTED, fontSize: 10, fontWeight: '600', letterSpacing: 0.4, marginBottom: 12 },
  shapRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  shapLabel: { color: CREAM, fontSize: 11, fontWeight: '500', width: 100 },
  shapTrack: {
    flex: 1, height: 8,
    backgroundColor: BLUE + '22',
    borderRadius: 4, overflow: 'hidden',
  },
  shapFill: { height: '100%', backgroundColor: BLUE, borderRadius: 4 },
  shapPct:  { color: BLUE, fontSize: 11, fontWeight: '700', width: 34, textAlign: 'right' },

  questionsCard: {
    backgroundColor: CARD,
    borderRadius: 14, padding: 16,
    marginBottom: 20,
    borderWidth: 2, borderColor: CREAM,
    shadowColor: CREAM,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 3,
    gap: 12,
  },
  questionRow:  { flexDirection: 'row', gap: 8 },
  questionNum:  { color: BLUE, fontSize: 13, fontWeight: '700', width: 18 },
  questionText: { color: CREAM, fontSize: 13, lineHeight: 20, flex: 1 },

  exportRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  exportFilled: {
    flex: 1,
    backgroundColor: BLUE,
    borderRadius: 12, padding: 14,
    alignItems: 'center',
  },
  exportFilledText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  exportFilledSub:  { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 3 },

  exportOutlined: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5, borderColor: BLUE,
    borderRadius: 12, padding: 14,
    alignItems: 'center',
  },
  exportOutlinedText: { color: BLUE, fontSize: 13, fontWeight: '700' },
  exportOutlinedSub:  { color: MUTED, fontSize: 10, marginTop: 3 },

  footer: {
    color: MUTED,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
});
