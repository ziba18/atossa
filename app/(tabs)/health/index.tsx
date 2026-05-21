import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity,
  Modal, TextInput, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, Spacing, Radius, Shadow } from '../../../constants/theme';
import { Type } from '../../../constants/typography';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { today } from '../../../algorithms/dateHelpers';
import { BodyPainMap, type PainEntry } from '../../../components/tracking/BodyPainMap';
import { useContentWidth } from '../../../hooks/useContentWidth';

const TOTAL_PAGES = 3;

// ── Symptom categories ────────────────────────────────────────────────────────
const SYMPTOM_CATEGORIES = [
  {
    key: 'cycle',
    label: 'Cycle',
    color: '#4E9E5A',
    symptoms: [
      { value: 'cramps',            label: 'Cramps' },
      { value: 'bloating',          label: 'Bloating' },
      { value: 'spotting',          label: 'Spotting' },
      { value: 'heavy_bleeding',    label: 'Heavy Bleeding' },
      { value: 'irregular_period',  label: 'Irregular Period' },
      { value: 'missed_period',     label: 'Missed Period' },
      { value: 'ovulation_pain',    label: 'Ovulation Pain' },
    ],
  },
  {
    key: 'hormonal',
    label: 'Hormonal / PCOS',
    color: '#4E9E5A',
    symptoms: [
      { value: 'acne',                  label: 'Acne' },
      { value: 'hair_loss',             label: 'Hair Loss' },
      { value: 'excessive_hair_growth', label: 'Excess Hair Growth' },
      { value: 'hot_flashes',           label: 'Hot Flashes' },
      { value: 'night_sweats',          label: 'Night Sweats' },
      { value: 'weight_gain',           label: 'Weight Gain' },
      { value: 'water_retention',       label: 'Water Retention' },
    ],
  },
  {
    key: 'energy',
    label: 'Energy & Pain',
    color: '#A85A5A',
    symptoms: [
      { value: 'fatigue',         label: 'Fatigue' },
      { value: 'extreme_fatigue', label: 'Extreme Fatigue' },
      { value: 'headache',        label: 'Headache' },
      { value: 'migraine',        label: 'Migraine' },
      { value: 'dizziness',       label: 'Dizziness' },
      { value: 'nausea',          label: 'Nausea' },
      { value: 'muscle_aches',    label: 'Muscle Aches' },
    ],
  },
  {
    key: 'digestive',
    label: 'Digestive',
    color: '#3D8055',
    symptoms: [
      { value: 'constipation',    label: 'Constipation' },
      { value: 'diarrhea',        label: 'Diarrhea' },
      { value: 'food_cravings',   label: 'Food Cravings' },
      { value: 'appetite_loss',   label: 'Appetite Loss' },
    ],
  },
  {
    key: 'mood',
    label: 'Mood & Mental',
    color: '#7B4D8C',
    symptoms: [
      { value: 'mood_swings',  label: 'Mood Swings' },
      { value: 'anxiety',      label: 'Anxiety' },
      { value: 'depression',   label: 'Depression' },
      { value: 'irritability', label: 'Irritability' },
      { value: 'brain_fog',    label: 'Brain Fog' },
      { value: 'insomnia',     label: 'Insomnia' },
      { value: 'stress',       label: 'Stress' },
      { value: 'low_libido',   label: 'Low Libido' },
    ],
  },
] as const;

const DOSAGE_UNITS = ['mg', 'g', 'ml', 'IU', 'tablet(s)', 'capsule(s)', 'drop(s)'];

const COMMON_MEDICATIONS = [
  'Ibuprofen', 'Naproxen', 'Acetaminophen', 'Mefenamic Acid', 'Tranexamic Acid',
  'Birth Control Pill', 'Depo-Provera', 'IUD', 'Contraceptive Patch', 'Norethindrone',
  'Metformin', 'Spironolactone', 'Clomid', 'Letrozole', 'Progesterone', 'Estrogen',
  'Levothyroxine', 'Iron Supplement', 'Folic Acid', 'Vitamin D', 'Magnesium',
  'Omega-3', 'Prenatal Vitamins', 'Drospirenone', 'Prednisone', 'Omeprazole',
  'Metronidazole', 'Fluconazole', 'Doxycycline', 'Amoxicillin',
];

const SYMPTOM_LABELS: Record<string, string> = Object.fromEntries(
  SYMPTOM_CATEGORIES.flatMap((cat) => cat.symptoms.map((s) => [s.value, s.label])),
);

const BODY_REGION_LABELS: Record<string, string> = {
  head: 'Head', neck: 'Neck',
  left_shoulder: 'Left Shoulder', right_shoulder: 'Right Shoulder',
  chest: 'Chest', upper_abdomen: 'Upper Abdomen',
  lower_abdomen: 'Lower Abdomen', pelvis: 'Pelvis / Uterus',
  left_upper_arm: 'Left Upper Arm', right_upper_arm: 'Right Upper Arm',
  left_forearm: 'Left Forearm', right_forearm: 'Right Forearm',
  left_thigh: 'Left Thigh', right_thigh: 'Right Thigh',
  left_knee: 'Left Knee', right_knee: 'Right Knee',
  left_shin: 'Left Shin', right_shin: 'Right Shin',
  neck_back: 'Neck (Back)', left_shoulder_b: 'Left Shoulder (Back)',
  right_shoulder_b: 'Right Shoulder (Back)', upper_back: 'Upper Back',
  mid_back: 'Mid Back', lower_back: 'Lower Back', buttocks: 'Buttocks',
  left_upper_arm_b: 'Left Upper Arm (Back)', right_upper_arm_b: 'Right Upper Arm (Back)',
  left_forearm_b: 'Left Forearm (Back)', right_forearm_b: 'Right Forearm (Back)',
  left_thigh_b: 'Left Thigh (Back)', right_thigh_b: 'Right Thigh (Back)',
  left_knee_b: 'Left Knee (Back)', right_knee_b: 'Right Knee (Back)',
  left_calf: 'Left Calf', right_calf: 'Right Calf',
};

const BODY_REGION_IDS = new Set(Object.keys(BODY_REGION_LABELS));

interface Medication { name: string; dosage: string; unit: string; notes: string }
interface SymptomEntry {
  value: string;
  label: string;
  severity: number;
  notes: string;
}

export default function HealthLogScreen() {
  const theme = useColors();
  const styles = createStyles(theme);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const SCREEN_WIDTH = useContentWidth();
  const insets = useSafeAreaInsets();
  // Tab bar floats absolutely at bottom:12 with height:68. Reserve that space
  // so the bottom navigation row isn't hidden behind it.
  const navSpacerHeight = 68 + 12 + insets.bottom;

  const [page, setPage] = useState(0);
  const [carouselHeight, setCarouselHeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [showMedForm, setShowMedForm] = useState(false);
  const [newMed, setNewMed] = useState<Medication>({ name: '', dosage: '', unit: 'mg', notes: '' });
  const [medSuggestions, setMedSuggestions] = useState<string[]>([]);

  const [painEntries, setPainEntries] = useState<PainEntry[]>([]);
  const [symptomEntries, setSymptomEntries] = useState<Record<string, SymptomEntry>>({});

  const [modalSymptom, setModalSymptom] = useState<{ value: string; label: string; color: string } | null>(null);
  const [modalSeverity, setModalSeverity] = useState(5);
  const [modalNotes, setModalNotes] = useState('');

  const [notes, setNotes] = useState('');

  const selectedSymptomCount = Object.keys(symptomEntries).length;

  // ── Fetch today's existing data on mount ────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      const todayStr = today();

      const { data: medsData } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_type', 'medication')
        .gte('recorded_at', `${todayStr}T00:00:00.000Z`)
        .lte('recorded_at', `${todayStr}T23:59:59.999Z`);

      if (medsData && medsData.length > 0) {
        setMedications(medsData.map((row) => {
          const dashIdx = (row.notes ?? '').indexOf(' — ');
          return {
            name:   dashIdx >= 0 ? row.notes.slice(0, dashIdx) : (row.notes ?? ''),
            dosage: row.value != null ? String(row.value) : '',
            unit:   row.unit ?? 'mg',
            notes:  dashIdx >= 0 ? row.notes.slice(dashIdx + 3) : '',
          };
        }));
      }

      const { data: sympData } = await supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('logged_date', todayStr);

      if (sympData && sympData.length > 0) {
        const painRows    = sympData.filter((r) => BODY_REGION_IDS.has(r.symptom_type));
        const symptomRows = sympData.filter((r) => !BODY_REGION_IDS.has(r.symptom_type));

        if (painRows.length > 0) {
          setPainEntries(painRows.map((row) => {
            const parts = (row.notes ?? '').split(' · ');
            return {
              regionId:    row.symptom_type,
              regionLabel: BODY_REGION_LABELS[row.symptom_type] ?? row.symptom_type,
              intensity:   row.severity ?? 5,
              painType:    parts[0] ?? '',
              notes:       parts.slice(1).join(' · '),
            };
          }));
        }

        if (symptomRows.length > 0) {
          const entries: Record<string, SymptomEntry> = {};
          symptomRows.forEach((row) => {
            entries[row.symptom_type] = {
              value:    row.symptom_type,
              label:    SYMPTOM_LABELS[row.symptom_type] ?? row.symptom_type,
              severity: row.severity ?? 0,
              notes:    row.notes ?? '',
            };
          });
          setSymptomEntries(entries);
        }
      }
    })();
  }, [user?.id]);

  const goToPage = (p: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_PAGES - 1, p));
    scrollRef.current?.scrollTo({ x: clamped * SCREEN_WIDTH, animated: true });
    setPage(clamped);
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setPage(p);
  };

  const handleMedNameChange = (v: string) => {
    setNewMed((p) => ({ ...p, name: v }));
    if (v.trim().length > 0) {
      setMedSuggestions(
        COMMON_MEDICATIONS.filter((m) => m.toLowerCase().includes(v.toLowerCase())).slice(0, 5)
      );
    } else {
      setMedSuggestions([]);
    }
  };

  const addMedication = () => {
    if (!newMed.name.trim()) { Alert.alert('Enter a medication name.'); return; }
    setMedications((prev) => [...prev, { ...newMed }]);
    setNewMed({ name: '', dosage: '', unit: 'mg', notes: '' });
    setShowMedForm(false);
  };

  const openSymptomModal = (item: { value: string; label: string }, color: string) => {
    const existing = symptomEntries[item.value];
    setModalSymptom({ ...item, color });
    setModalSeverity(existing?.severity ?? 5);
    setModalNotes(existing?.notes ?? '');
  };

  const saveSymptomModal = () => {
    if (!modalSymptom) return;
    setSymptomEntries((prev) => ({
      ...prev,
      [modalSymptom.value]: {
        value: modalSymptom.value,
        label: modalSymptom.label,
        severity: modalSeverity,
        notes: modalNotes,
      },
    }));
    setModalSymptom(null);
  };

  const removeSymptomModal = () => {
    if (!modalSymptom) return;
    setSymptomEntries((prev) => {
      const next = { ...prev };
      delete next[modalSymptom.value];
      return next;
    });
    setModalSymptom(null);
  };

  const handleSave = async () => {
    const hasData = medications.length > 0 || painEntries.length > 0 || selectedSymptomCount > 0;
    if (!hasData) { Alert.alert('Nothing to save', 'Log at least one item first.'); return; }
    if (!user) return;

    setLoading(true);
    const recordedAt = new Date().toISOString();
    const todayStr = today();
    const errors: string[] = [];

    await supabase.from('health_metrics')
      .delete()
      .eq('user_id', user.id)
      .eq('metric_type', 'medication')
      .gte('recorded_at', `${todayStr}T00:00:00.000Z`)
      .lte('recorded_at', `${todayStr}T23:59:59.999Z`);

    await supabase.from('symptom_logs')
      .delete()
      .eq('user_id', user.id)
      .eq('logged_date', todayStr);

    if (medications.length > 0) {
      const { error } = await supabase.from('health_metrics').insert(
        medications.map((m) => ({
          user_id: user.id,
          recorded_at: recordedAt,
          metric_type: 'medication',
          value: parseFloat(m.dosage) || 0,
          unit: m.unit,
          source: 'manual',
          notes: m.name + (m.notes ? ` — ${m.notes}` : ''),
        }))
      );
      if (error) errors.push('medications');
    }

    const symptomRows = [
      ...painEntries.map((entry) => ({
        user_id: user.id, logged_date: todayStr, logged_time: recordedAt,
        symptom_type: entry.regionId,
        severity: entry.intensity,
        notes: [entry.painType, entry.notes].filter(Boolean).join(' · ') || null,
      })),
      ...Object.values(symptomEntries).map((entry) => ({
        user_id: user.id, logged_date: todayStr, logged_time: recordedAt,
        symptom_type: entry.value,
        severity: entry.severity > 0 ? entry.severity : null,
        notes: [entry.notes, notes].filter(Boolean).join(' · ') || null,
      })),
    ];

    if (symptomRows.length > 0) {
      const { error } = await supabase.from('symptom_logs').insert(symptomRows);
      if (error) errors.push('symptoms');
    }

    setLoading(false);

    if (errors.length > 0) {
      Alert.alert('Error', `Failed to save: ${errors.join(', ')}`);
    } else {
      const parts: string[] = [];
      if (medications.length > 0) parts.push(`${medications.length} medication${medications.length !== 1 ? 's' : ''}`);
      if (painEntries.length > 0) parts.push(`${painEntries.length} pain area${painEntries.length !== 1 ? 's' : ''}`);
      if (selectedSymptomCount > 0) parts.push(`${selectedSymptomCount} symptom${selectedSymptomCount !== 1 ? 's' : ''}`);
      Alert.alert('Saved!', `Logged: ${parts.join(', ')}.`, [
        {
          text: 'View History',
          onPress: () => {
            goToPage(0);
            router.push('/(tabs)/health/history');
          },
        },
        { text: 'Done', onPress: () => goToPage(0) },
      ]);
    }
  };

  const isReviewPage = page === TOTAL_PAGES - 1;
  const isFirstPage = page === 0;

  const summaryItems = [
    medications.length > 0 && {
      icon: 'pill' as IconName,
      text: medications.map((m) => m.name).join(', '),
      count: medications.length,
      label: 'Medication',
    },
    painEntries.length > 0 && {
      icon: 'map-pin' as IconName,
      text: painEntries.map((e) => `${e.regionLabel} (${e.intensity}/10)`).join(', '),
      count: painEntries.length,
      label: 'Pain Area',
    },
    selectedSymptomCount > 0 && {
      icon: 'thermometer' as IconName,
      text: Object.values(symptomEntries).map((e) =>
        e.severity > 0 ? `${e.label} (${e.severity}/10)` : e.label
      ).join(', '),
      count: selectedSymptomCount,
      label: 'Symptom',
    },
  ].filter(Boolean) as { icon: IconName; text: string; count: number; label: string }[];

  return (
    <SafeAreaView style={styles.screen}>
      {/* Title header (no back button — this is a tab) */}
      <View style={styles.titleBar}>
        <View>
          <Text style={styles.kicker}>FIELD NOTES</Text>
          <Text style={styles.titleBarText}>Today, gently</Text>
        </View>
        <View style={styles.titleBarRight}>
          <Text style={styles.titleBarDate}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/health/history')}
            style={styles.historyBtn}
            hitSlop={8}
            activeOpacity={0.7}
            accessibilityLabel="View logged health entries"
          >
            <Icon name="clock" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={{ flex: 1 }}
        onLayout={(e) => setCarouselHeight(e.nativeEvent.layout.height - 44 - 64 - navSpacerHeight)}
      >
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goToPage(i)} hitSlop={8}>
              <View style={[styles.dot, i < page && styles.dotPast, i === page && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {carouselHeight > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={32}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            decelerationRate="fast"
            scrollEnabled={!showMedForm}
            style={{ height: carouselHeight }}
          >

            {/* PAGE 1 — Medications */}
            <View style={[styles.page, { width: SCREEN_WIDTH, height: carouselHeight }]}>
              <LinearGradient
                colors={['#C76E72', '#A05558']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.banner}
              >
                <Icon name="pill" size={28} color="#FFFFFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>Medications</Text>
                  <Text style={styles.bannerDesc}>Log any medications or supplements taken today</Text>
                </View>
                {medications.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{medications.length}</Text>
                  </View>
                )}
              </LinearGradient>

              <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {medications.length === 0 && !showMedForm ? (
                  <View style={styles.emptyCard}>
                    <Icon name="leaf" size={44} color={theme.textMuted} />
                    <Text style={styles.emptyTitle}>No medications yet</Text>
                    <Text style={styles.emptySubtitle}>Tap the button below to add one</Text>
                  </View>
                ) : (
                  medications.map((med, idx) => (
                    <View key={idx} style={styles.medItem}>
                      <View style={styles.medIcon}>
                        <Icon name="pill" size={16} color={theme.cherry} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medName}>{med.name}</Text>
                        <Text style={styles.medDetail}>
                          {med.dosage ? `${med.dosage} ${med.unit}` : med.unit}
                          {med.notes ? ` · ${med.notes}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setMedications((p) => p.filter((_, i) => i !== idx))}
                        style={styles.removeBtn}
                      >
                        <Icon name="x" size={16} color={theme.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                {showMedForm ? (
                  <View style={styles.medForm}>
                    <Text style={styles.formTitle}>Add Medication</Text>
                    <Input
                      label="Name"
                      value={newMed.name}
                      onChangeText={handleMedNameChange}
                      placeholder="e.g. Ibuprofen, Birth control…"
                    />
                    {medSuggestions.length > 0 && (
                      <View style={styles.suggestionsBox}>
                        {medSuggestions.map((s) => (
                          <TouchableOpacity
                            key={s}
                            style={styles.suggestionItem}
                            onPress={() => {
                              setNewMed((p) => ({ ...p, name: s }));
                              setMedSuggestions([]);
                            }}
                          >
                            <Text style={styles.suggestionItemText}>{s}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    <Input
                      label="Dosage"
                      value={newMed.dosage}
                      onChangeText={(v) => setNewMed((p) => ({ ...p, dosage: v }))}
                      placeholder="400"
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.unitLabel}>Unit</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
                      <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                        {DOSAGE_UNITS.map((u) => (
                          <TouchableOpacity
                            key={u}
                            onPress={() => setNewMed((p) => ({ ...p, unit: u }))}
                            style={[styles.unitChip, newMed.unit === u && styles.unitChipActive]}
                          >
                            <Text style={[styles.unitChipText, newMed.unit === u && styles.unitChipTextActive]}>{u}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                    <Input
                      label="Notes (optional)"
                      value={newMed.notes}
                      onChangeText={(v) => setNewMed((p) => ({ ...p, notes: v }))}
                      placeholder="e.g. Taken for cramps…"
                    />
                    <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs }}>
                      <Button label="Add" onPress={addMedication} style={{ flex: 1 }} />
                      <Button label="Cancel" onPress={() => setShowMedForm(false)} variant="outline" style={{ flex: 1 }} />
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addMedBtn} onPress={() => setShowMedForm(true)} activeOpacity={0.75}>
                    <Text style={styles.addMedBtnText}>+ Add Medication</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>

            {/* PAGE 2 — Symptoms */}
            <View style={[styles.page, { width: SCREEN_WIDTH, height: carouselHeight }]}>
              <LinearGradient
                colors={['#9B8EC4', '#7A6EA0']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.banner}
              >
                <Icon name="activity" size={28} color="#FFFFFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>Symptoms</Text>
                  <Text style={styles.bannerDesc}>Tap body regions or select symptoms below</Text>
                </View>
                {(painEntries.length > 0 || selectedSymptomCount > 0) && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {painEntries.length + selectedSymptomCount}
                    </Text>
                  </View>
                )}
              </LinearGradient>

              <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                <View style={styles.bodySection}>
                  <Text style={styles.bodySectionTitle}>Pain by Location</Text>
                  <Text style={styles.bodySectionSub}>Tap any region on the body to log pain and intensity</Text>
                  <BodyPainMap value={painEntries} onChange={setPainEntries} />
                </View>

                <View style={styles.sectionDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerLabel}>General Symptoms</Text>
                  <View style={styles.dividerLine} />
                </View>
                <Text style={styles.dividerSub}>
                  Tap a symptom to log it — you can also add pain level and notes
                </Text>

                {SYMPTOM_CATEGORIES.map((cat) => {
                  const catCount = cat.symptoms.filter((s) => !!symptomEntries[s.value]).length;
                  return (
                    <View key={cat.key} style={styles.symptomCategory}>
                      <View style={styles.catLabelRow}>
                        <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                        <Text style={styles.catLabel}>{cat.label}</Text>
                        {catCount > 0 && (
                          <View style={[styles.catCountPill, { backgroundColor: cat.color + '22' }]}>
                            <Text style={[styles.catCountText, { color: cat.color }]}>{catCount}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.chips}>
                        {cat.symptoms.map(({ value, label }) => {
                          const entry = symptomEntries[value];
                          const isActive = !!entry;
                          return (
                            <TouchableOpacity
                              key={value}
                              onPress={() => openSymptomModal({ value, label }, cat.color)}
                              activeOpacity={0.75}
                              style={[
                                styles.chip,
                                isActive && { backgroundColor: cat.color, borderColor: cat.color },
                              ]}
                            >
                              {isActive && entry.severity > 0 && (
                                <View style={styles.severityBadge}>
                                  <Text style={styles.severityBadgeText}>{entry.severity}</Text>
                                </View>
                              )}
                              <Text style={[styles.chipText, isActive && styles.chipTextWhite]}>
                                {label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* PAGE 3 — Review & Save */}
            <View style={[styles.page, { width: SCREEN_WIDTH, height: carouselHeight }]}>
              <LinearGradient
                colors={['#8DBF8A', '#5E9E6A']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.banner}
              >
                <Icon name="file-text" size={28} color="#FFFFFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>Review & Save</Text>
                  <Text style={styles.bannerDesc}>
                    {summaryItems.length > 0
                      ? `${summaryItems.length} section${summaryItems.length !== 1 ? 's' : ''} logged today`
                      : 'Nothing logged yet — swipe back to add'}
                  </Text>
                </View>
              </LinearGradient>

              <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {summaryItems.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Icon name="flower" size={44} color={theme.textMuted} />
                    <Text style={styles.emptyTitle}>Nothing logged yet</Text>
                    <Text style={styles.emptySubtitle}>Swipe left to go back and fill in the sections</Text>
                  </View>
                ) : (
                  summaryItems.map((item) => (
                    <View key={item.label} style={styles.summaryRow}>
                      <View style={styles.summaryIcon}>
                        <Icon name={item.icon} size={18} color={theme.cherry} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.summaryLabel}>
                          {item.count} {item.label}{item.count > 1 ? 's' : ''}
                        </Text>
                        <Text style={styles.summaryText} numberOfLines={2}>{item.text}</Text>
                      </View>
                      <View style={styles.summaryCheck}>
                        <Icon name="check" size={14} color="#3D8055" />
                      </View>
                    </View>
                  ))
                )}

                <Input
                  label="Additional notes (optional)"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="How are you feeling overall today?"
                  multiline
                  numberOfLines={4}
                  containerStyle={styles.notesInput}
                />

                <Button
                  label={summaryItems.length > 0 ? 'Save Health Log' : 'Nothing to save'}
                  onPress={handleSave}
                  loading={loading}
                  size="lg"
                  fullWidth
                  disabled={summaryItems.length === 0}
                  style={styles.saveBtn}
                />
              </ScrollView>
            </View>

          </ScrollView>
        )}

        {/* Bottom navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => goToPage(page - 1)}
            disabled={isFirstPage}
            style={[styles.navBtn, isFirstPage && styles.navBtnDisabled]}
            activeOpacity={0.7}
          >
            <Text style={[styles.navBtnText, isFirstPage && styles.navBtnTextDisabled]}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.pageCounter}>
            {page + 1} <Text style={styles.pageCounterOf}>of</Text> {TOTAL_PAGES}
          </Text>

          {isReviewPage ? (
            <View style={[styles.navBtn, { opacity: 0 }]} pointerEvents="none">
              <Text style={styles.navBtnText}>Next →</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={() => goToPage(page + 1)} style={styles.navBtnNext} activeOpacity={0.7}>
              <Text style={styles.navBtnNextText}>
                {page === TOTAL_PAGES - 2 ? 'Review →' : 'Next →'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Spacer to clear the floating tab bar */}
        <View style={{ height: navSpacerHeight }} />
      </View>

      {/* Symptom severity modal */}
      {modalSymptom && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setModalSymptom(null)}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalSymptom(null)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <View style={[styles.modalSymptomDot, { backgroundColor: modalSymptom.color }]} />
                <Text style={styles.modalTitle}>{modalSymptom.label}</Text>
                <Text style={styles.modalSub}>How severe is this symptom?</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalSymptom(null)}>
                <Text style={styles.modalCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSectionLabel}>PAIN / SEVERITY LEVEL</Text>
            <View style={styles.severityRow}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                const active = n === modalSeverity;
                const col = n <= 3 ? '#8DBF8A' : n <= 6 ? '#D4C870' : '#D4878A';
                return (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setModalSeverity(n)}
                    style={[
                      styles.severityDot,
                      { backgroundColor: active ? col : col + '30', borderColor: col },
                      active && { transform: [{ scale: 1.15 }] },
                    ]}
                  >
                    <Text style={[styles.severityNum, { color: active ? '#fff' : col }]}>{n}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[
              styles.severityDesc,
              { color: modalSeverity <= 3 ? '#8DBF8A' : modalSeverity <= 6 ? '#C4A020' : '#D4878A' },
            ]}>
              {modalSeverity <= 3 ? 'Mild' : modalSeverity <= 6 ? 'Moderate' : 'Severe'} · Level {modalSeverity}/10
            </Text>

            <Text style={styles.modalSectionLabel}>NOTES (OPTIONAL)</Text>
            <TextInput
              value={modalNotes}
              onChangeText={setModalNotes}
              placeholder="When did it start, what makes it better or worse…"
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              style={styles.modalNotesInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: modalSymptom.color }]}
                onPress={saveSymptomModal}
              >
                <Text style={styles.modalSaveTxt}>
                  {symptomEntries[modalSymptom.value] ? 'Update Symptom' : 'Log Symptom'}
                </Text>
              </TouchableOpacity>
              {symptomEntries[modalSymptom.value] && (
                <TouchableOpacity style={styles.modalRemoveBtn} onPress={removeSymptomModal}>
                  <Text style={styles.modalRemoveTxt}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ height: 32 }} />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },

    titleBar: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    titleBarRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    kicker:       { ...Type.health.kicker },
    titleBarText: { ...Type.health.title, fontSize: 30, lineHeight: 36, marginTop: 2 },
    titleBarDate: { fontSize: 12, fontFamily: 'Fraunces_400Regular_Italic', color: '#5E7E62', letterSpacing: 0.8 },
    historyBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.glassBgSoft,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    dotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 44,
      gap: 8,
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.border },
    dotPast: { backgroundColor: c.gold },
    dotActive: { width: 24, backgroundColor: c.cherry },

    page: { backgroundColor: c.background, overflow: 'hidden' },

    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      gap: Spacing.md,
    },
    bannerTitle: {
      fontSize: 22,
      fontFamily: 'Fraunces_500Medium',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    bannerDesc: {
      fontSize: FontSize.xs,
      fontFamily: 'Fraunces_400Regular',
      color: 'rgba(255,255,255,0.8)',
      marginTop: 2,
    },
    countBadge: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    },
    countBadgeText: { fontSize: FontSize.xs, fontFamily: 'Fraunces_500Medium', color: '#FFFFFF' },

    pageContent: { padding: Spacing.md, paddingBottom: Spacing.xl },

    emptyCard: { alignItems: 'center', paddingVertical: Spacing.xxl },
    emptyTitle: {
      fontSize: FontSize.lg, fontFamily: 'Fraunces_500Medium',
      color: c.textPrimary, marginBottom: Spacing.xs, marginTop: Spacing.sm,
    },
    emptySubtitle: {
      fontSize: FontSize.sm, fontFamily: 'Fraunces_400Regular',
      color: c.textMuted, textAlign: 'center', lineHeight: 20,
    },

    medItem: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.surface, borderRadius: Radius.md,
      borderWidth: 1, borderColor: c.border,
      padding: Spacing.sm, marginBottom: Spacing.xs, gap: Spacing.sm,
    },
    medIcon: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: c.cherryLighter,
      alignItems: 'center', justifyContent: 'center',
    },
    medName: { fontSize: FontSize.sm, fontFamily: 'Fraunces_500Medium', color: c.textPrimary },
    medDetail: { fontSize: FontSize.xs, fontFamily: 'Fraunces_400Regular', color: c.textMuted, marginTop: 2 },
    removeBtn: { padding: Spacing.xs },
    medForm: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.border,
      padding: Spacing.md, marginBottom: Spacing.md,
    },
    formTitle: { fontSize: FontSize.md, fontFamily: 'Fraunces_500Medium', color: c.textPrimary, marginBottom: Spacing.md },
    unitLabel: { fontSize: FontSize.sm, fontFamily: 'Fraunces_400Regular', color: c.textSecondary, marginBottom: Spacing.xs },
    unitChip: {
      paddingHorizontal: Spacing.sm, paddingVertical: 6,
      borderRadius: Radius.sm, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    unitChipActive: { backgroundColor: c.cherry, borderColor: c.cherry },
    unitChipText: { fontSize: FontSize.xs, fontFamily: 'Fraunces_400Regular', color: c.textSecondary },
    unitChipTextActive: { color: '#FFFFFF', fontFamily: 'Fraunces_500Medium' },
    suggestionsBox: {
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
      borderRadius: Radius.md, marginTop: -Spacing.sm, marginBottom: Spacing.sm, overflow: 'hidden',
    },
    suggestionItem: {
      paddingHorizontal: Spacing.md, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    suggestionItemText: { fontSize: FontSize.sm, fontFamily: 'Fraunces_400Regular', color: c.textPrimary },
    addMedBtn: {
      borderWidth: 1.5, borderColor: c.cherry, borderRadius: Radius.lg,
      borderStyle: 'dashed', paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
    },
    addMedBtnText: { fontSize: FontSize.sm, fontFamily: 'Fraunces_500Medium', color: c.cherry },

    bodySection: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.border,
      padding: Spacing.md, marginBottom: Spacing.md,
    },
    bodySectionTitle: { fontSize: FontSize.md, fontFamily: 'Fraunces_500Medium', color: c.textPrimary },
    bodySectionSub: {
      fontSize: FontSize.xs, fontFamily: 'Fraunces_400Regular',
      color: c.textMuted, marginTop: 2, marginBottom: Spacing.md,
    },
    sectionDivider: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
    dividerLabel: {
      fontSize: FontSize.xs, fontFamily: 'Fraunces_500Medium',
      color: c.textMuted, letterSpacing: 0.8,
    },
    dividerSub: {
      fontSize: FontSize.xs, fontFamily: 'Fraunces_400Regular',
      color: c.textMuted, marginBottom: Spacing.md, textAlign: 'center',
    },
    symptomCategory: { marginBottom: Spacing.lg },
    catLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
    catDot: { width: 8, height: 8, borderRadius: 4 },
    catLabel: {
      fontSize: FontSize.xs, fontFamily: 'Fraunces_500Medium',
      color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, flex: 1,
    },
    catCountPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
    catCountText: { fontSize: 11, fontFamily: 'Fraunces_500Medium' },

    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    chip: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.md, paddingVertical: 9,
      borderRadius: Radius.full, borderWidth: 1.5,
      borderColor: c.border, backgroundColor: c.surface,
      gap: 5,
    },
    chipText: { fontSize: FontSize.sm, fontFamily: 'Fraunces_400Regular', color: c.textSecondary },
    chipTextWhite: { color: '#FFFFFF', fontFamily: 'Fraunces_500Medium' },
    severityBadge: {
      width: 18, height: 18, borderRadius: 9,
      backgroundColor: 'rgba(255,255,255,0.3)',
      alignItems: 'center', justifyContent: 'center',
    },
    severityBadgeText: { fontSize: 10, fontFamily: 'Fraunces_500Medium', color: '#FFFFFF' },

    summaryRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.border,
      padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm,
    },
    summaryIcon: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.cherryLighter,
      alignItems: 'center', justifyContent: 'center',
    },
    summaryLabel: {
      fontSize: FontSize.xs, fontFamily: 'Fraunces_500Medium',
      color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    summaryText: { fontSize: FontSize.sm, fontFamily: 'Fraunces_400Regular', color: c.textPrimary, marginTop: 2 },
    summaryCheck: {
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: c.emeraldLighter,
      alignItems: 'center', justifyContent: 'center',
    },
    notesInput: { marginTop: Spacing.sm },
    saveBtn: { marginTop: Spacing.md },

    navRow: {
      height: 64, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingHorizontal: Spacing.md,
      borderTopWidth: 1, borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    navBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, minWidth: 80 },
    navBtnDisabled: { opacity: 0.3 },
    navBtnText: { fontSize: FontSize.sm, fontFamily: 'Fraunces_500Medium', color: c.textSecondary },
    navBtnTextDisabled: { color: c.textMuted },
    navBtnNext: {
      paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
      backgroundColor: c.cherry, borderRadius: Radius.full, minWidth: 80, alignItems: 'center',
    },
    navBtnNextText: { fontSize: FontSize.sm, fontFamily: 'Fraunces_500Medium', color: '#FFFFFF' },
    pageCounter: { fontSize: FontSize.sm, fontFamily: 'Fraunces_400Regular', color: c.textMuted },
    pageCounterOf: { fontFamily: 'Fraunces_400Regular', color: c.textMuted },

    modalBackdrop: { flex: 1, backgroundColor: 'rgba(42,28,24,0.4)' },
    modalSheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      maxHeight: '80%',
      ...Shadow.lg,
    },
    modalHandle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: c.border, alignSelf: 'center', marginBottom: Spacing.md,
    },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-start', marginBottom: Spacing.md,
    },
    modalSymptomDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
    modalTitle: { fontSize: FontSize.xl, fontFamily: 'Fraunces_500Medium', color: c.textPrimary },
    modalSub: { fontSize: FontSize.xs, fontFamily: 'Fraunces_400Regular', color: c.textMuted, marginTop: 2 },
    modalCloseBtn: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center', justifyContent: 'center',
    },
    modalCloseTxt: { fontSize: FontSize.sm, color: c.textMuted },
    modalSectionLabel: {
      fontSize: 10, fontFamily: 'Fraunces_500Medium',
      color: c.textMuted, letterSpacing: 1.2,
      marginBottom: Spacing.sm, marginTop: Spacing.md,
    },
    severityRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
    severityDot: {
      width: 34, height: 34, borderRadius: 17,
      borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    },
    severityNum: { fontSize: FontSize.sm, fontFamily: 'Fraunces_500Medium' },
    severityDesc: { fontSize: FontSize.sm, fontFamily: 'Fraunces_400Regular', marginTop: Spacing.sm },
    modalNotesInput: {
      backgroundColor: c.surfaceElevated,
      borderRadius: Radius.md, borderWidth: 1, borderColor: c.border,
      padding: Spacing.md, fontSize: FontSize.sm, fontFamily: 'Fraunces_400Regular',
      color: c.textPrimary, minHeight: 80, textAlignVertical: 'top',
    },
    modalActions: { gap: Spacing.sm, marginTop: Spacing.lg },
    modalSaveBtn: {
      borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center',
    },
    modalSaveTxt: { fontSize: FontSize.md, fontFamily: 'Fraunces_500Medium', color: '#FFFFFF' },
    modalRemoveBtn: {
      borderRadius: Radius.full, paddingVertical: Spacing.sm,
      alignItems: 'center', borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surfaceElevated,
    },
    modalRemoveTxt: { fontSize: FontSize.sm, fontFamily: 'Fraunces_400Regular', color: c.textMuted },
  });
}
