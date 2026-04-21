import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Header } from '../../../components/layout/Header';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/colors';
import { FontSize, Spacing, Radius } from '../../../constants/theme';
import { today } from '../../../algorithms/dateHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Data ─────────────────────────────────────────────────────────────────────
const PAIN_LOCATIONS = [
  { value: 'pain_head',           label: 'Head' },
  { value: 'pain_neck',           label: 'Neck' },
  { value: 'pain_shoulders',      label: 'Shoulders' },
  { value: 'pain_chest',          label: 'Chest' },
  { value: 'pain_breasts',        label: 'Breasts' },
  { value: 'pain_upper_abdomen',  label: 'Upper Abdomen' },
  { value: 'pain_lower_abdomen',  label: 'Lower Abdomen' },
  { value: 'pain_pelvis',         label: 'Pelvis / Uterus' },
  { value: 'pain_lower_back',     label: 'Lower Back' },
  { value: 'pain_hips',           label: 'Hips' },
  { value: 'pain_thighs',         label: 'Thighs' },
  { value: 'pain_legs',           label: 'Legs' },
  { value: 'pain_joints',         label: 'Joints' },
  { value: 'pain_full_body',      label: 'Full Body' },
];

const SYMPTOM_CATEGORIES = [
  {
    key: 'cycle',
    label: 'Cycle',
    color: Colors.cherry,
    bg: Colors.cherryLighter,
    symptoms: [
      { value: 'cramps',            label: 'Cramps' },
      { value: 'bloating',          label: 'Bloating' },
      { value: 'spotting',          label: 'Spotting' },
      { value: 'heavy_bleeding',    label: 'Heavy Bleeding' },
      { value: 'irregular_period',  label: 'Irregular Period' },
      { value: 'missed_period',     label: 'Missed Period' },
    ],
  },
  {
    key: 'hormonal',
    label: 'Hormonal / PCOS',
    color: Colors.forest,
    bg: Colors.forestLighter,
    symptoms: [
      { value: 'acne',                  label: 'Acne' },
      { value: 'hair_loss',             label: 'Hair Loss' },
      { value: 'excessive_hair_growth', label: 'Excess Hair Growth' },
      { value: 'hot_flashes',           label: 'Hot Flashes' },
      { value: 'weight_gain',           label: 'Weight Gain' },
      { value: 'water_retention',       label: 'Water Retention' },
    ],
  },
  {
    key: 'pain_energy',
    label: 'Pain & Energy',
    color: Colors.whiskeyDark,
    bg: Colors.whiskeyLighter,
    symptoms: [
      { value: 'fatigue',   label: 'Fatigue' },
      { value: 'headache',  label: 'Headache' },
      { value: 'migraine',  label: 'Migraine' },
      { value: 'back_pain', label: 'Back Pain' },
      { value: 'dizziness', label: 'Dizziness' },
    ],
  },
  {
    key: 'digestive',
    label: 'Digestive',
    color: Colors.emeraldDark,
    bg: Colors.emeraldLighter,
    symptoms: [
      { value: 'nausea',        label: 'Nausea' },
      { value: 'constipation',  label: 'Constipation' },
      { value: 'diarrhea',      label: 'Diarrhea' },
      { value: 'food_cravings', label: 'Food Cravings' },
    ],
  },
  {
    key: 'mood',
    label: 'Mood & Mental',
    color: '#7B4D8C',
    bg: '#F0E8F6',
    symptoms: [
      { value: 'mood_swings',  label: 'Mood Swings' },
      { value: 'anxiety',      label: 'Anxiety' },
      { value: 'depression',   label: 'Depression' },
      { value: 'irritability', label: 'Irritability' },
      { value: 'brain_fog',    label: 'Brain Fog' },
      { value: 'insomnia',     label: 'Insomnia' },
      { value: 'stress',       label: 'Stress' },
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
const TOTAL_PAGES = 4;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getPainInfo(level: number): { label: string; color: string } {
  if (level === 0) return { label: 'No pain',   color: Colors.textMuted };
  if (level <= 2)  return { label: 'Mild',       color: Colors.emeraldDark };
  if (level <= 4)  return { label: 'Moderate',   color: Colors.whiskeyDark };
  if (level <= 6)  return { label: 'Significant',color: '#C05A1F' };
  if (level <= 8)  return { label: 'Severe',     color: Colors.cherry };
  return               { label: 'Extreme',    color: Colors.cherryDark };
}

interface Medication { name: string; dosage: string; unit: string; notes: string }

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LogHealthScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [page, setPage] = useState(0);
  const [carouselHeight, setCarouselHeight] = useState(0);
  const [sliderActive, setSliderActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Page 1 — Medications
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showMedForm, setShowMedForm] = useState(false);
  const [newMed, setNewMed] = useState<Medication>({ name: '', dosage: '', unit: 'mg', notes: '' });
  const [medSuggestions, setMedSuggestions] = useState<string[]>([]);

  const handleMedNameChange = (v: string) => {
    setNewMed((p) => ({ ...p, name: v }));
    if (v.trim().length > 0) {
      const filtered = COMMON_MEDICATIONS.filter((m) =>
        m.toLowerCase().includes(v.toLowerCase())
      ).slice(0, 5);
      setMedSuggestions(filtered);
    } else {
      setMedSuggestions([]);
    }
  };

  const selectMedSuggestion = (name: string) => {
    setNewMed((p) => ({ ...p, name }));
    setMedSuggestions([]);
  };

  // Page 2 — Pain
  const [painLevel, setPainLevel] = useState(0);
  const [painLocations, setPainLocations] = useState<string[]>([]);

  // Page 3 — Symptoms
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, boolean>>({});

  // Page 4 — Notes
  const [notes, setNotes] = useState('');

  const painInfo = getPainInfo(painLevel);
  const selectedSymptomList = Object.keys(selectedSymptoms).filter((k) => selectedSymptoms[k]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goToPage = (p: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_PAGES - 1, p));
    scrollRef.current?.scrollTo({ x: clamped * SCREEN_WIDTH, animated: true });
    setPage(clamped);
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setPage(p);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const addMedication = () => {
    if (!newMed.name.trim()) { Alert.alert('Enter a medication name.'); return; }
    setMedications((prev) => [...prev, { ...newMed }]);
    setNewMed({ name: '', dosage: '', unit: 'mg', notes: '' });
    setShowMedForm(false);
  };

  const toggleLocation = (value: string) =>
    setPainLocations((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );

  const toggleSymptom = (value: string) =>
    setSelectedSymptoms((prev) => ({ ...prev, [value]: !prev[value] }));

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const hasData =
      medications.length > 0 || painLevel > 0 ||
      painLocations.length > 0 || selectedSymptomList.length > 0;

    if (!hasData) { Alert.alert('Nothing to save', 'Go back and log at least one item.'); return; }
    if (!user) return;

    setLoading(true);
    const now = new Date().toTimeString().slice(0, 8);
    const todayStr = today();
    const recordedAt = new Date().toISOString();
    const errors: string[] = [];

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

    if (painLevel > 0) {
      const { error } = await supabase.from('health_metrics').insert({
        user_id: user.id,
        recorded_at: recordedAt,
        metric_type: 'pain_level',
        value: painLevel,
        unit: 'score',
        source: 'manual',
        notes: notes || null,
      });
      if (error) errors.push('pain level');
    }

    const symptomRows = [
      ...painLocations.map((loc) => ({
        user_id: user.id, logged_date: todayStr, logged_time: now,
        symptom_type: loc, severity: painLevel > 0 ? painLevel : null, notes: null,
      })),
      ...selectedSymptomList.map((sym) => ({
        user_id: user.id, logged_date: todayStr, logged_time: now,
        symptom_type: sym, severity: null, notes: null,
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
      if (painLevel > 0) parts.push(`pain level ${painLevel}/10`);
      if (painLocations.length > 0) parts.push(`${painLocations.length} pain location${painLocations.length !== 1 ? 's' : ''}`);
      if (selectedSymptomList.length > 0) parts.push(`${selectedSymptomList.length} symptom${selectedSymptomList.length !== 1 ? 's' : ''}`);
      Alert.alert('Saved!', `Logged: ${parts.join(', ')}.`, [
        { text: 'Done', onPress: () => router.back() },
      ]);
    }
  };

  const isReviewPage = page === TOTAL_PAGES - 1;
  const isFirstPage = page === 0;

  // ── Summary items for review page ─────────────────────────────────────────
  const summaryItems = [
    medications.length > 0 && {
      icon: 'pill' as IconName,
      text: medications.map((m) => m.name).join(', '),
      count: medications.length,
      label: 'Medication',
    },
    painLevel > 0 && {
      icon: 'bandage' as IconName,
      text: `${painLevel}/10 · ${painInfo.label}`,
      count: 1,
      label: 'Pain Level',
    },
    painLocations.length > 0 && {
      icon: 'map-pin' as IconName,
      text: painLocations.map((v) => PAIN_LOCATIONS.find((l) => l.value === v)?.label ?? v).join(', '),
      count: painLocations.length,
      label: 'Pain Location',
    },
    selectedSymptomList.length > 0 && {
      icon: 'thermometer' as IconName,
      text: `${selectedSymptomList.length} symptom${selectedSymptomList.length !== 1 ? 's' : ''} selected`,
      count: selectedSymptomList.length,
      label: 'Symptom',
    },
  ].filter(Boolean) as { icon: IconName; text: string; count: number; label: string }[];

  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Health Log" showBack />

      <View
        style={{ flex: 1 }}
        onLayout={(e) => setCarouselHeight(e.nativeEvent.layout.height - 44 - 64)}
      >
        {/* ── Progress dots ─────────────────────────────────────────────── */}
        <View style={styles.dotsRow}>
          {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goToPage(i)} hitSlop={8}>
              <View style={[
                styles.dot,
                i < page && styles.dotPast,
                i === page && styles.dotActive,
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Carousel ──────────────────────────────────────────────────── */}
        {carouselHeight > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={32}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            decelerationRate="fast"
            scrollEnabled={!sliderActive && !showMedForm}
            style={{ height: carouselHeight }}
          >

            {/* ════════════════════════════════════════════════════════════
                PAGE 1 — Medications
            ════════════════════════════════════════════════════════════ */}
            <View style={[styles.page, { width: SCREEN_WIDTH, height: carouselHeight }]}>
              <LinearGradient colors={['#390517', '#6B1530']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
                <Icon name="pill" size={28} color={Colors.white} />
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
                {/* Medication list */}
                {medications.length === 0 && !showMedForm ? (
                  <View style={styles.emptyCard}>
                    <Icon name="leaf" size={44} color={Colors.textMuted} />
                    <Text style={styles.emptyTitle}>No medications yet</Text>
                    <Text style={styles.emptySubtitle}>Tap the button below to add one</Text>
                  </View>
                ) : (
                  medications.map((med, idx) => (
                    <View key={idx} style={styles.medItem}>
                      <View style={styles.medIcon}>
                        <Icon name="pill" size={16} color={Colors.cherry} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medName}>{med.name}</Text>
                        <Text style={styles.medDetail}>
                          {med.dosage ? `${med.dosage} ${med.unit}` : med.unit}
                          {med.notes ? ` · ${med.notes}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setMedications((p) => p.filter((_, i) => i !== idx))} style={styles.removeBtn}>
                        <Icon name="x" size={16} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                {/* Inline add form */}
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
                            onPress={() => selectMedSuggestion(s)}
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

            {/* ════════════════════════════════════════════════════════════
                PAGE 2 — Pain Level & Locations
            ════════════════════════════════════════════════════════════ */}
            <View style={[styles.page, { width: SCREEN_WIDTH, height: carouselHeight }]}>
              <LinearGradient colors={['#C05A1F', '#8B3A10']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
                <Icon name="bandage" size={28} color={Colors.white} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>Pain</Text>
                  <Text style={styles.bannerDesc}>Rate your pain and mark affected areas</Text>
                </View>
                {(painLevel > 0 || painLocations.length > 0) && (
                  <View style={styles.countBadge}>
                    <Icon name="check" size={14} color={Colors.white} />
                  </View>
                )}
              </LinearGradient>

              <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {/* Pain level */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>Pain Level</Text>
                  <View style={styles.painDisplay}>
                    <Text style={[styles.painScore, { color: painInfo.color }]}>{painLevel}</Text>
                    <View>
                      <Text style={[styles.painLabelText, { color: painInfo.color }]}>{painInfo.label}</Text>
                      <Text style={styles.painOutOf}>out of 10</Text>
                    </View>
                  </View>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={10}
                    step={1}
                    value={painLevel}
                    onValueChange={setPainLevel}
                    onSlidingStart={() => setSliderActive(true)}
                    onSlidingComplete={() => setSliderActive(false)}
                    minimumTrackTintColor={painInfo.color}
                    maximumTrackTintColor={Colors.border}
                    thumbTintColor={painInfo.color}
                  />
                  <View style={styles.sliderEndLabels}>
                    <Text style={styles.sliderEndLabel}>None</Text>
                    <Text style={styles.sliderEndLabel}>Extreme</Text>
                  </View>
                </View>

                {/* Pain locations */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>
                    Where does it hurt?
                    {painLocations.length > 0 && (
                      <Text style={styles.sectionCardCount}> · {painLocations.length} selected</Text>
                    )}
                  </Text>
                  <View style={styles.chips}>
                    {PAIN_LOCATIONS.map(({ value, label }) => {
                      const isActive = painLocations.includes(value);
                      return (
                        <TouchableOpacity
                          key={value}
                          onPress={() => toggleLocation(value)}
                          style={[styles.chip, isActive && styles.chipPain]}
                          activeOpacity={0.72}
                        >
                          {isActive && <Icon name="check" size={12} color={Colors.white} />}
                          <Text style={[styles.chipText, isActive && styles.chipTextWhite]}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* ════════════════════════════════════════════════════════════
                PAGE 3 — Symptoms
            ════════════════════════════════════════════════════════════ */}
            <View style={[styles.page, { width: SCREEN_WIDTH, height: carouselHeight }]}>
              <LinearGradient colors={['#16302B', '#0D4A3A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
                <Icon name="thermometer" size={28} color={Colors.white} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>Symptoms</Text>
                  <Text style={styles.bannerDesc}>Select any symptoms you're experiencing</Text>
                </View>
                {selectedSymptomList.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{selectedSymptomList.length}</Text>
                  </View>
                )}
              </LinearGradient>

              <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {SYMPTOM_CATEGORIES.map((cat) => {
                  const catCount = cat.symptoms.filter((s) => selectedSymptoms[s.value]).length;
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
                          const isActive = !!selectedSymptoms[value];
                          return (
                            <TouchableOpacity
                              key={value}
                              onPress={() => toggleSymptom(value)}
                              style={[styles.chip, isActive && { backgroundColor: cat.color, borderColor: cat.color }]}
                              activeOpacity={0.72}
                            >
                              {isActive && <Icon name="check" size={12} color={Colors.white} />}
                              <Text style={[styles.chipText, isActive && styles.chipTextWhite]}>{label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* ════════════════════════════════════════════════════════════
                PAGE 4 — Notes & Save
            ════════════════════════════════════════════════════════════ */}
            <View style={[styles.page, { width: SCREEN_WIDTH, height: carouselHeight }]}>
              <LinearGradient colors={['#A38560', '#7A6245']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
                <Icon name="file-text" size={28} color={Colors.white} />
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
                {/* Summary cards */}
                {summaryItems.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Icon name="flower" size={44} color={Colors.textMuted} />
                    <Text style={styles.emptyTitle}>Nothing logged yet</Text>
                    <Text style={styles.emptySubtitle}>Swipe left to go back and fill in the sections</Text>
                  </View>
                ) : (
                  summaryItems.map((item) => (
                    <View key={item.label} style={styles.summaryRow}>
                      <View style={styles.summaryIcon}>
                        <Icon name={item.icon} size={18} color={Colors.cherry} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.summaryLabel}>
                          {item.label}{item.count > 1 ? 's' : ''}
                        </Text>
                        <Text style={styles.summaryText} numberOfLines={2}>{item.text}</Text>
                      </View>
                      <View style={styles.summaryCheck}>
                        <Icon name="check" size={14} color={Colors.emeraldDark} />
                      </View>
                    </View>
                  ))
                )}

                {/* Notes */}
                <Input
                  label="Notes (optional)"
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

        {/* ── Bottom navigation ──────────────────────────────────────────── */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => goToPage(page - 1)}
            disabled={isFirstPage}
            style={[styles.navBtn, isFirstPage && styles.navBtnDisabled]}
            activeOpacity={0.7}
          >
            <Text style={[styles.navBtnText, isFirstPage && styles.navBtnTextDisabled]}>
              ← Back
            </Text>
          </TouchableOpacity>

          <Text style={styles.pageCounter}>
            {page + 1} <Text style={styles.pageCounterOf}>of</Text> {TOTAL_PAGES}
          </Text>

          {isReviewPage ? (
            <View style={[styles.navBtn, { opacity: 0 }]} pointerEvents="none">
              <Text style={styles.navBtnText}>Next →</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => goToPage(page + 1)}
              style={styles.navBtnNext}
              activeOpacity={0.7}
            >
              <Text style={styles.navBtnNextText}>
                {page === TOTAL_PAGES - 2 ? 'Review →' : 'Next →'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  // ── Dots ──────────────────────────────────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotPast: { backgroundColor: Colors.whiskey },
  dotActive: { width: 24, backgroundColor: Colors.cherry },

  // ── Page ──────────────────────────────────────────────────────────────────
  page: {
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },

  // ── Banner ────────────────────────────────────────────────────────────────
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  bannerTitle: {
    fontSize: 22,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  bannerDesc: {
    fontSize: FontSize.xs,
    fontFamily: 'Jost_400Regular',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  countBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  countBadgeText: {
    fontSize: FontSize.xs,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.white,
  },

  // ── Page content ──────────────────────────────────────────────────────────
  pageContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Medications ───────────────────────────────────────────────────────────
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  medIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cherryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.textPrimary,
  },
  medDetail: {
    fontSize: FontSize.xs,
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
    marginTop: 2,
  },
  removeBtn: { padding: Spacing.xs },

  medForm: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  formTitle: {
    fontSize: FontSize.md,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  unitLabel: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_500Medium',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  unitChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  unitChipActive: { backgroundColor: Colors.cherry, borderColor: Colors.cherry },
  unitChipText: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: Colors.textSecondary },
  unitChipTextActive: { color: Colors.white, fontFamily: 'Jost_600SemiBold' },

  suggestionsBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionItemText: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_400Regular',
    color: Colors.textPrimary,
  },
  addMedBtn: {
    borderWidth: 1.5,
    borderColor: Colors.cherry,
    borderRadius: Radius.lg,
    borderStyle: 'dashed',
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  addMedBtnText: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.cherry,
  },

  // ── Pain ──────────────────────────────────────────────────────────────────
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionCardTitle: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionCardCount: {
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
  },
  painDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  painScore: {
    fontSize: 52,
    fontFamily: 'CormorantGaramond_600SemiBold',
    lineHeight: 60,
  },
  painLabelText: {
    fontSize: FontSize.lg,
    fontFamily: 'Jost_600SemiBold',
  },
  painOutOf: {
    fontSize: FontSize.xs,
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
    marginTop: 2,
  },
  sliderEndLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderEndLabel: {
    fontSize: 11,
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
  },

  // ── Chips ─────────────────────────────────────────────────────────────────
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipPain: { backgroundColor: '#C05A1F', borderColor: '#C05A1F' },
  chipText: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_400Regular',
    color: Colors.textSecondary,
  },
  chipTextWhite: { color: Colors.white, fontFamily: 'Jost_600SemiBold' },

  // ── Symptoms ──────────────────────────────────────────────────────────────
  symptomCategory: { marginBottom: Spacing.lg },
  catLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catLabel: {
    fontSize: FontSize.xs,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  catCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  catCountText: {
    fontSize: 11,
    fontFamily: 'Jost_600SemiBold',
  },

  // ── Review / Save ─────────────────────────────────────────────────────────
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.whiskeyLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_400Regular',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  summaryCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.emeraldLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notesInput: { marginTop: Spacing.sm },
  saveBtn: { marginTop: Spacing.md },

  // ── Bottom nav ────────────────────────────────────────────────────────────
  navRow: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  navBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minWidth: 80,
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.textSecondary,
  },
  navBtnTextDisabled: { color: Colors.textMuted },
  navBtnNext: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.cherry,
    borderRadius: Radius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  navBtnNextText: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.white,
  },
  pageCounter: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
  },
  pageCounterOf: {
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
  },
});
