import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Header } from '../../../components/layout/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontSize, Spacing, Radius } from '../../../constants/theme';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { today } from '../../../algorithms/dateHelpers';

// ─── Category icons (inline SVG paths) ───────────────────────────────────────
function CycleIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
    </Svg>
  );
}

function HormonalIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        d="m10 16 1.5 1.5M14 8l-1.5-1.5M15 2c-1.798 1.998-2.518 3.995-2.807 5.993M2 15c6.667-6 13.333 0 20-6M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
    </Svg>
  );
}

function PainIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </Svg>
  );
}

function DigestiveIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <Path stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </Svg>
  );
}

function PelvicIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
      <Circle stroke={color} strokeWidth={2} cx="12" cy="15" r="2" />
    </Svg>
  );
}

function MoodIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        d="M12 18V5M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
      <Path stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
    </Svg>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: 'cycle',
    label: 'Cycle',
    description: 'Menstrual & bleeding symptoms',
    color: '#4E9E5A',
    bg: '#EBF5EB',
    Icon: CycleIcon,
    symptoms: [
      { value: 'cramps',           label: 'Cramps' },
      { value: 'bloating',         label: 'Bloating' },
      { value: 'spotting',         label: 'Spotting' },
      { value: 'heavy_bleeding',   label: 'Heavy Bleeding' },
      { value: 'light_bleeding',   label: 'Light Bleeding' },
      { value: 'ovulation_pain',   label: 'Ovulation Pain' },
      { value: 'clotting',         label: 'Clotting' },
      { value: 'irregular_period', label: 'Irregular Period' },
      { value: 'missed_period',    label: 'Missed Period' },
    ],
  },
  {
    key: 'hormonal',
    label: 'Hormonal / PCOS',
    description: 'Hormonal imbalance & PCOS signs',
    color: '#4E9E5A',
    bg: '#EBF5EB',
    Icon: HormonalIcon,
    symptoms: [
      { value: 'acne',                  label: 'Acne' },
      { value: 'hair_loss',             label: 'Hair Loss' },
      { value: 'excessive_hair_growth', label: 'Excess Hair Growth' },
      { value: 'oily_skin',             label: 'Oily Skin' },
      { value: 'hot_flashes',           label: 'Hot Flashes' },
      { value: 'night_sweats',          label: 'Night Sweats' },
      { value: 'weight_gain',           label: 'Weight Gain' },
      { value: 'weight_loss',           label: 'Weight Loss' },
      { value: 'water_retention',       label: 'Water Retention' },
    ],
  },
  {
    key: 'pain',
    label: 'Pain & Energy',
    description: 'Pain, fatigue and energy levels',
    color: '#A85A5A',
    bg: '#FAF0F0',
    Icon: PainIcon,
    symptoms: [
      { value: 'fatigue',         label: 'Fatigue' },
      { value: 'extreme_fatigue', label: 'Extreme Fatigue' },
      { value: 'headache',        label: 'Headache' },
      { value: 'migraine',        label: 'Migraine' },
      { value: 'back_pain',       label: 'Back Pain' },
      { value: 'hip_pain',        label: 'Hip Pain' },
      { value: 'joint_pain',      label: 'Joint Pain' },
      { value: 'muscle_aches',    label: 'Muscle Aches' },
      { value: 'dizziness',       label: 'Dizziness' },
    ],
  },
  {
    key: 'digestive',
    label: 'Digestive',
    description: 'Gut and digestive symptoms',
    color: '#3D8055',
    bg: '#E8F5EE',
    Icon: DigestiveIcon,
    symptoms: [
      { value: 'nausea',            label: 'Nausea' },
      { value: 'vomiting',          label: 'Vomiting' },
      { value: 'constipation',      label: 'Constipation' },
      { value: 'diarrhea',          label: 'Diarrhea' },
      { value: 'food_cravings',     label: 'Food Cravings' },
      { value: 'appetite_increase', label: 'Increased Appetite' },
      { value: 'appetite_loss',     label: 'Appetite Loss' },
    ],
  },
  {
    key: 'pelvic',
    label: 'Pelvic / Urinary',
    description: 'Pelvic, breast and urinary symptoms',
    color: '#2E6DA4',
    bg: '#E3EEF8',
    Icon: PelvicIcon,
    symptoms: [
      { value: 'pelvic_pain',        label: 'Pelvic Pain' },
      { value: 'breast_tenderness',  label: 'Breast Tenderness' },
      { value: 'breast_swelling',    label: 'Breast Swelling' },
      { value: 'frequent_urination', label: 'Frequent Urination' },
      { value: 'vaginal_dryness',    label: 'Vaginal Dryness' },
      { value: 'discharge_change',   label: 'Discharge Change' },
    ],
  },
  {
    key: 'mood',
    label: 'Mood & Mental',
    description: 'Emotional and mental wellbeing',
    color: '#7B4D8C',
    bg: '#F0E8F6',
    Icon: MoodIcon,
    symptoms: [
      { value: 'mood_swings',  label: 'Mood Swings' },
      { value: 'anxiety',      label: 'Anxiety' },
      { value: 'depression',   label: 'Depression' },
      { value: 'irritability', label: 'Irritability' },
      { value: 'brain_fog',    label: 'Brain Fog' },
      { value: 'insomnia',     label: 'Insomnia' },
      { value: 'poor_sleep',   label: 'Poor Sleep' },
      { value: 'pms',          label: 'PMS' },
      { value: 'stress',       label: 'Stress' },
      { value: 'low_libido',   label: 'Low Libido' },
    ],
  },
] as const;

type SymptomValue = typeof CATEGORIES[number]['symptoms'][number]['value'];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LogSymptomsScreen() {
  const router = useRouter();
  const theme = useColors();
  const styles = createStyles(theme);
  const user = useAuthStore((s) => s.user);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ cycle: true });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedList = Object.keys(selected).filter((k) => selected[k]);
  const totalSelected = selectedList.length;

  const toggleSymptom = (value: string) => {
    setSelected((prev) => ({ ...prev, [value]: !prev[value] }));
  };

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (totalSelected === 0 || !user) {
      Alert.alert('No symptoms selected', 'Tap at least one symptom to log.');
      return;
    }
    setLoading(true);
    const now = new Date().toTimeString().slice(0, 8);
    const rows = selectedList.map((sym) => ({
      user_id: user.id,
      symptom_type: sym,
      severity: null,
      logged_date: today(),
      logged_time: now,
      notes: notes || null,
    }));
    const { error } = await supabase.from('symptom_logs').insert(rows);
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert(
      'Logged!',
      `${rows.length} symptom${rows.length !== 1 ? 's' : ''} recorded.`,
      [{ text: 'Done', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Log Symptoms" showBack />

      {/* Selected count bar */}
      {totalSelected > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionBarText}>
            {totalSelected} symptom{totalSelected !== 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity onPress={() => setSelected({})}>
            <Text style={styles.selectionBarClear}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {CATEGORIES.map((cat) => {
          const catSelected = cat.symptoms.filter((s) => selected[s.value]).length;
          const isExpanded = expanded[cat.key];

          return (
            <View key={cat.key} style={styles.categoryCard}>
              {/* Category header — tap to expand/collapse */}
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleExpand(cat.key)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconWrap, { backgroundColor: cat.bg }]}>
                  <cat.Icon color={cat.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                  <Text style={styles.categoryDesc}>{cat.description}</Text>
                </View>
                <View style={styles.categoryRight}>
                  {catSelected > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: cat.color }]}>
                      <Text style={styles.countBadgeText}>{catSelected}</Text>
                    </View>
                  )}
                  <Text style={[styles.chevron, { color: cat.color }]}>
                    {isExpanded ? '▲' : '▼'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Symptoms chips */}
              {isExpanded && (
                <View style={styles.chipsWrap}>
                  <View style={styles.chips}>
                    {cat.symptoms.map(({ value, label }) => {
                      const isActive = !!selected[value];
                      return (
                        <TouchableOpacity
                          key={value}
                          onPress={() => toggleSymptom(value)}
                          activeOpacity={0.72}
                          style={[
                            styles.chip,
                            isActive && { backgroundColor: cat.color, borderColor: cat.color },
                          ]}
                        >
                          {isActive && (
                            <Text style={styles.chipCheck}>✓ </Text>
                          )}
                          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Notes */}
        <View style={styles.notesSection}>
          <Input
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional details about how you're feeling..."
            multiline
            numberOfLines={3}
          />
        </View>

        <Button
          label={
            totalSelected > 0
              ? `Save ${totalSelected} Symptom${totalSelected !== 1 ? 's' : ''}`
              : 'Select symptoms above'
          }
          onPress={handleSave}
          loading={loading}
          size="lg"
          fullWidth
          disabled={totalSelected === 0}
          style={styles.saveBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },

    selectionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: c.cherryLighter,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    selectionBarText: {
      fontSize: FontSize.sm,
      fontFamily: 'Jost_600SemiBold',
      color: c.cherry,
    },
    selectionBarClear: {
      fontSize: FontSize.sm,
      fontFamily: 'Jost_400Regular',
      color: c.cherry,
      textDecorationLine: 'underline',
    },

    content: {
      padding: Spacing.md,
      paddingBottom: Spacing.xxl,
      gap: Spacing.sm,
    },

    categoryCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },

    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      gap: Spacing.md,
    },

    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },

    categoryInfo: { flex: 1 },
    categoryLabel: {
      fontSize: FontSize.md,
      fontFamily: 'Jost_600SemiBold',
      color: c.textPrimary,
    },
    categoryDesc: {
      fontSize: FontSize.xs,
      fontFamily: 'Jost_400Regular',
      color: c.textMuted,
      marginTop: 2,
    },

    categoryRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    countBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    countBadgeText: {
      fontSize: 11,
      fontFamily: 'Jost_600SemiBold',
      color: '#FFFFFF',
    },
    chevron: {
      fontSize: 11,
      fontFamily: 'Jost_600SemiBold',
    },

    chipsWrap: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: Spacing.md,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderRadius: Radius.full,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    chipCheck: {
      fontSize: FontSize.xs,
      color: '#FFFFFF',
      fontFamily: 'Jost_600SemiBold',
    },
    chipText: {
      fontSize: FontSize.sm,
      fontFamily: 'Jost_400Regular',
      color: c.textSecondary,
    },
    chipTextActive: {
      color: '#FFFFFF',
      fontFamily: 'Jost_600SemiBold',
    },

    notesSection: { marginTop: Spacing.xs },
    saveBtn: { marginTop: Spacing.md },
  });
}
