import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  LayoutChangeEvent, Alert,
} from 'react-native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '../../../components/ui/Icon';

const BG     = '#f7f3eb';
const CARD   = '#fdf8f1';
const MOSS   = '#3a4d39';
const BARK   = '#4a3728';
const INK    = '#1c1e1c';
const MUTED  = '#7a6e60';
const ENDO_BG   = '#F4E3E0';
const ENDO_FG   = '#6E1F1F';
const PCOS_BG   = '#f0e8dc';
const PCOS_FG   = '#4a3728';
const PMDD_BG   = '#E5DEEC';
const PMDD_FG   = '#5B4B73';

// ── Question data ─────────────────────────────────────────────────────────────
type Condition = 'endo' | 'pcos' | 'pmdd';

interface QuestionOption { id: string; label: string; flag?: Condition }
interface Question {
  id: string;
  prompt: string;
  why: string;
  options: QuestionOption[];
  next: (optionId: string) => string | null;
}

const QUESTIONS: Question[] = [
  {
    id: 'pain-quality',
    prompt: 'How would you describe the pain during your period?',
    why: 'Pain character helps distinguish typical menstrual cramps from endometriosis. Stabbing or burning pain — especially if it radiates — is a key clinical indicator that is frequently dismissed for years.',
    options: [
      { id: 'cramping',  label: 'Cramping' },
      { id: 'stabbing',  label: 'Stabbing or sharp',   flag: 'endo' },
      { id: 'burning',   label: 'Burning or pressure', flag: 'endo' },
      { id: 'dull',      label: 'Dull ache' },
    ],
    next: (id) => (id === 'stabbing' || id === 'burning') ? 'bowel-trigger' : 'cycle-regularity',
  },
  {
    id: 'bowel-trigger',
    prompt: 'Does your pelvic pain get worse with bowel movements during your period?',
    why: 'Bowel pain correlation during menstruation is a significant clinical marker for deep infiltrating endometriosis. This symptom is missed for an average of 7–10 years before diagnosis.',
    options: [
      { id: 'often',     label: 'Yes, often',    flag: 'endo' },
      { id: 'sometimes', label: 'Sometimes',     flag: 'endo' },
      { id: 'rarely',    label: 'Rarely' },
      { id: 'never',     label: 'Never' },
    ],
    next: () => 'cycle-regularity',
  },
  {
    id: 'cycle-regularity',
    prompt: 'How regular are your menstrual cycles?',
    why: 'Cycle irregularity is one of the defining features of PCOS. Cycles consistently over 35 days, or fewer than 8 cycles per year, is clinically significant under Rotterdam criteria.',
    options: [
      { id: 'very-regular',   label: 'Very regular (± 2 days)' },
      { id: 'somewhat',       label: 'Somewhat regular (± 1 week)' },
      { id: 'irregular',      label: 'Irregular (varies widely)',    flag: 'pcos' },
      { id: 'very-irregular', label: 'Very irregular or absent',     flag: 'pcos' },
    ],
    next: (id) => (id === 'irregular' || id === 'very-irregular') ? 'hirsutism' : 'mood-cycle',
  },
  {
    id: 'hirsutism',
    prompt: 'Have you noticed increased hair growth on your face, chest, or back?',
    why: 'Hirsutism — excess androgen-driven hair growth — is one of the three Rotterdam criteria for PCOS diagnosis. Combined with irregular cycles, it significantly increases diagnostic probability.',
    options: [
      { id: 'significant', label: 'Yes, significant growth',  flag: 'pcos' },
      { id: 'mild',        label: 'Mild increase',            flag: 'pcos' },
      { id: 'none',        label: 'Not that I have noticed' },
      { id: 'hair-loss',   label: 'Hair thinning instead',   flag: 'pcos' },
    ],
    next: () => 'mood-cycle',
  },
  {
    id: 'mood-cycle',
    prompt: 'How do your mood and emotions change in the week before your period?',
    why: 'Severe premenstrual mood changes that disrupt daily life are the core feature of PMDD. Unlike typical PMS, PMDD significantly impacts functioning at work, at home, or in relationships.',
    options: [
      { id: 'severe',   label: 'Severely — disrupts daily life', flag: 'pmdd' },
      { id: 'moderate', label: 'Moderate, noticeably worse' },
      { id: 'mild',     label: 'Mild shifts' },
      { id: 'none',     label: 'No noticeable change' },
    ],
    next: () => 'fatigue',
  },
  {
    id: 'fatigue',
    prompt: 'How do you rate your cycle-linked fatigue?',
    why: 'Debilitating fatigue that tracks with your cycle can indicate endometriosis, iron-deficiency anemia from heavy periods, or thyroid dysfunction — all worth raising with your GP.',
    options: [
      { id: 'debilitating', label: 'Debilitating — I cannot function', flag: 'endo' },
      { id: 'significant',  label: 'Significant but manageable' },
      { id: 'moderate',     label: 'Moderate' },
      { id: 'minimal',      label: 'Minimal' },
    ],
    next: () => null,
  },
];

const MAX_STEPS = QUESTIONS.length;

const CONDITION_INFO: Record<Condition, { label: string; bg: string; fg: string; desc: string }> = {
  endo: {
    label: 'Endometriosis signals',
    bg: ENDO_BG, fg: ENDO_FG,
    desc: 'Several of your responses match patterns associated with endometriosis: pain character, bowel-linked symptoms, or debilitating fatigue. Worth raising with your GP as a specific concern.',
  },
  pcos: {
    label: 'PCOS signals',
    bg: PCOS_BG, fg: PCOS_FG,
    desc: 'Cycle irregularity and other markers you reported are consistent with PCOS indicators. An androgen blood panel and pelvic ultrasound are common first diagnostic steps.',
  },
  pmdd: {
    label: 'PMDD signals',
    bg: PMDD_BG, fg: PMDD_FG,
    desc: 'You reported premenstrual mood symptoms that significantly impact daily life. PMDD is distinct from PMS and responds well to treatment when properly identified.',
  },
};

// ── Vine progress bar ─────────────────────────────────────────────────────────
function VineProgress({ step, total }: { step: number; total: number }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = Math.min(1, (step - 1) / total);
  const mushroomLeft = Math.max(0, trackWidth * progress - 10);

  return (
    <View style={styles.vineContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={styles.stepLabel}>Step {step} of {total}</Text>
      </View>
      <View style={{ marginTop: 6 }}>
        <View
          style={styles.vineTrack}
          onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          <View style={[styles.vineFill, { width: trackWidth * progress }]} />
        </View>
        {trackWidth > 0 && (
          <Text style={[styles.mushroomEmoji, { left: mushroomLeft }]}>🍄</Text>
        )}
      </View>
    </View>
  );
}

// ── Intro screen ──────────────────────────────────────────────────────────────
function IntroScreen({ onBegin, insets }: { onBegin: () => void; insets: EdgeInsets }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={[styles.introContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.introKicker}>SYMPTOM ANALYSIS</Text>
      <Text style={styles.introTitle}>Understand your body's signals</Text>
      <Text style={styles.introBody}>
        Six adaptive questions that surface patterns associated with PCOS, endometriosis, and PMDD. Your responses never leave your device.
      </Text>

      <View style={styles.introCard}>
        <View style={styles.introRow}>
          <Icon name="clock" size={16} color={MOSS} />
          <Text style={styles.introRowText}>~3 minutes</Text>
        </View>
        <View style={styles.introRow}>
          <Icon name="shield" size={16} color={MOSS} />
          <Text style={styles.introRowText}>Fully private — no data is sent anywhere</Text>
        </View>
        <View style={styles.introRow}>
          <Icon name="stethoscope" size={16} color={MOSS} />
          <Text style={styles.introRowText}>Not a diagnosis — a structured summary for your GP</Text>
        </View>
      </View>

      <View style={styles.conditionChips}>
        {(['Endometriosis', 'PCOS', 'PMDD'] as const).map(c => (
          <View key={c} style={styles.conditionChip}>
            <Text style={styles.conditionChipText}>{c}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.beginBtn} onPress={onBegin}>
        <Text style={styles.beginBtnText}>Begin Analysis →</Text>
      </Pressable>

      <Text style={styles.disclaimer}>
        This tool identifies patterns only. Always discuss results with a qualified healthcare provider.
      </Text>
    </ScrollView>
  );
}

// ── Question screen ───────────────────────────────────────────────────────────
interface QuestionScreenProps {
  question: Question;
  stepNum: number;
  selectedId: string | undefined;
  showWhy: boolean;
  onToggleWhy: () => void;
  onOption: (id: string) => void;
  onBack: () => void;
  insets: EdgeInsets;
}

function QuestionScreen({
  question, stepNum, selectedId, showWhy,
  onToggleWhy, onOption, onBack, insets,
}: QuestionScreenProps) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={[styles.questionContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 }]}
      showsVerticalScrollIndicator={false}
    >
      <VineProgress step={stepNum} total={MAX_STEPS} />

      <Text style={styles.questionPrompt}>{question.prompt}</Text>

      {/* Why this matters */}
      <Pressable style={styles.whyToggle} onPress={onToggleWhy}>
        <Icon name="info" size={14} color={MOSS} />
        <Text style={styles.whyToggleText}>Why this matters</Text>
        <Icon name={showWhy ? 'chevron-left' : 'chevron-right'} size={14} color={MOSS} />
      </Pressable>

      {showWhy && (
        <View style={styles.whyCard}>
          <Text style={styles.whyText}>{question.why}</Text>
        </View>
      )}

      {/* Options */}
      <View style={styles.optionList}>
        {question.options.map(opt => {
          const selected = selectedId === opt.id;
          return (
            <Pressable
              key={opt.id}
              style={[styles.optionBtn, selected && styles.optionBtnSelected]}
              onPress={() => onOption(opt.id)}
            >
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {opt.label}
              </Text>
              {selected && <Icon name="check" size={16} color="#fff" />}
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.backBtn} onPress={onBack}>
        <Icon name="arrow-left" size={16} color={MUTED} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

// ── Results screen ────────────────────────────────────────────────────────────
function ResultsScreen({
  flags, onRedo, insets,
}: { flags: Condition[]; onRedo: () => void; insets: EdgeInsets }) {
  const router = useRouter();
  const noFlags = flags.length === 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={[styles.resultsContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.resultsKicker}>ANALYSIS COMPLETE</Text>
      <Text style={styles.resultsTitle}>
        {noFlags ? 'No clinical flags detected' : `${flags.length} pattern${flags.length > 1 ? 's' : ''} flagged`}
      </Text>

      {noFlags ? (
        <View style={styles.noFlagsCard}>
          <Icon name="check-circle" size={32} color={MOSS} />
          <Text style={styles.noFlagsText}>
            Your responses do not show strong signals for PCOS, endometriosis, or PMDD. If you still have concerns, track your symptoms for 1–2 more cycles before your next GP visit.
          </Text>
        </View>
      ) : (
        <View style={styles.flagList}>
          {flags.map(condition => {
            const info = CONDITION_INFO[condition];
            return (
              <View key={condition} style={[styles.flagCard, { backgroundColor: info.bg, borderColor: info.fg }]}>
                <Text style={[styles.flagLabel, { color: info.fg }]}>{info.label}</Text>
                <Text style={[styles.flagDesc, { color: info.fg + 'CC' }]}>{info.desc}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.resultActions}>
        <Pressable
          style={styles.gpBtn}
          onPress={() => router.push('/(tabs)/report' as any)}
        >
          <Icon name="file-text" size={16} color="#fff" />
          <Text style={styles.gpBtnText}>View GP Report</Text>
        </Pressable>
        <Pressable style={styles.redoBtn} onPress={onRedo}>
          <Text style={styles.redoBtnText}>Redo Analysis</Text>
        </Pressable>
      </View>

      <Text style={styles.disclaimer}>
        This analysis identifies patterns only and is not a medical diagnosis. Always discuss results with a qualified healthcare provider.
      </Text>
    </ScrollView>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
type AnalysisState = 'intro' | 'questions' | 'results';

export default function AnalysisScreen() {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<AnalysisState>('intro');
  const [currentQId, setCurrentQId] = useState('pain-quality');
  const [history, setHistory] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showWhy, setShowWhy] = useState(false);

  const currentQ = QUESTIONS.find(q => q.id === currentQId)!;
  const stepNum = history.length + 1;

  const handleOption = (optionId: string) => {
    const nextId = currentQ.next(optionId);
    setAnswers(prev => ({ ...prev, [currentQId]: optionId }));
    setHistory(prev => [...prev, currentQId]);
    setShowWhy(false);
    if (nextId) {
      setCurrentQId(nextId);
    } else {
      setScreen('results');
    }
  };

  const handleBack = () => {
    if (history.length === 0) { setScreen('intro'); return; }
    const prevId = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentQId(prevId);
    setShowWhy(false);
  };

  const handleReset = () => {
    setScreen('intro');
    setCurrentQId('pain-quality');
    setHistory([]);
    setAnswers({});
    setShowWhy(false);
  };

  const getFlaggedConditions = (): Condition[] => {
    const counts: Record<Condition, number> = { endo: 0, pcos: 0, pmdd: 0 };
    Object.entries(answers).forEach(([qId, optId]) => {
      const q = QUESTIONS.find(q => q.id === qId);
      const opt = q?.options.find(o => o.id === optId);
      if (opt?.flag) counts[opt.flag]++;
    });
    return (Object.keys(counts) as Condition[]).filter(c => counts[c] > 0);
  };

  if (screen === 'intro') return <IntroScreen onBegin={() => setScreen('questions')} insets={insets} />;
  if (screen === 'results') return <ResultsScreen flags={getFlaggedConditions()} onRedo={handleReset} insets={insets} />;

  return (
    <QuestionScreen
      question={currentQ}
      stepNum={stepNum}
      selectedId={answers[currentQId]}
      showWhy={showWhy}
      onToggleWhy={() => setShowWhy(w => !w)}
      onOption={handleOption}
      onBack={handleBack}
      insets={insets}
    />
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Vine progress ──
  vineContainer: { marginBottom: 24 },
  stepLabel: { fontSize: 11, fontFamily: 'Fraunces_400Regular', color: MUTED, letterSpacing: 1.2 },
  vineTrack: {
    height: 6, backgroundColor: 'rgba(28,30,28,0.10)', borderRadius: 3,
    marginTop: 8, overflow: 'visible',
  },
  vineFill: { height: 6, backgroundColor: MOSS, borderRadius: 3 },
  mushroomEmoji: { position: 'absolute', top: -11, fontSize: 20 },

  // ── Intro ──
  introContent: { paddingHorizontal: 20 },
  introKicker: { fontSize: 10, fontFamily: 'Fraunces_300Light', color: MOSS, letterSpacing: 3, marginBottom: 8 },
  introTitle: { fontSize: 30, fontFamily: 'Fraunces_400Regular_Italic', color: INK, letterSpacing: -0.4, lineHeight: 36, marginBottom: 12 },
  introBody: { fontSize: 14, fontFamily: 'Fraunces_400Regular', color: MUTED, lineHeight: 22, marginBottom: 24 },
  introCard: {
    backgroundColor: CARD, borderRadius: 16,
    borderWidth: 2, borderColor: INK,
    shadowColor: INK, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.12, shadowRadius: 0,
    elevation: 3, padding: 16, gap: 12, marginBottom: 20,
  },
  introRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  introRowText: { fontSize: 13, fontFamily: 'Fraunces_400Regular', color: INK, flex: 1, lineHeight: 19 },
  conditionChips: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  conditionChip: {
    borderWidth: 2, borderColor: MOSS, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(58,77,57,0.06)',
  },
  conditionChipText: { fontSize: 12, fontFamily: 'Fraunces_500Medium', color: MOSS },
  beginBtn: {
    backgroundColor: MOSS, borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 2, borderColor: INK,
    shadowColor: INK, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.15, shadowRadius: 0,
    elevation: 3, marginBottom: 16,
  },
  beginBtnText: { fontSize: 16, fontFamily: 'Fraunces_500Medium', color: '#fff', letterSpacing: 0.2 },

  // ── Question ──
  questionContent: { paddingHorizontal: 20 },
  questionPrompt: {
    fontSize: 22, fontFamily: 'Fraunces_400Regular_Italic', color: INK,
    lineHeight: 30, marginBottom: 16, letterSpacing: -0.2,
  },
  whyToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 8, alignSelf: 'flex-start', paddingVertical: 4,
  },
  whyToggleText: { fontSize: 12, fontFamily: 'Fraunces_500Medium', color: MOSS },
  whyCard: {
    backgroundColor: 'rgba(58,77,57,0.07)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(58,77,57,0.25)',
    padding: 14, marginBottom: 16,
  },
  whyText: { fontSize: 13, fontFamily: 'Fraunces_400Regular_Italic', color: BARK, lineHeight: 20 },
  optionList: { gap: 10, marginBottom: 28 },
  optionBtn: {
    backgroundColor: CARD, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 2, borderColor: INK,
    shadowColor: INK, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.10, shadowRadius: 0,
    elevation: 2,
  },
  optionBtnSelected: { backgroundColor: MOSS, borderColor: INK },
  optionLabel: { fontSize: 14, fontFamily: 'Fraunces_400Regular', color: INK, flex: 1 },
  optionLabelSelected: { color: '#fff', fontFamily: 'Fraunces_500Medium' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { fontSize: 13, fontFamily: 'Fraunces_400Regular', color: MUTED },

  // ── Results ──
  resultsContent: { paddingHorizontal: 20 },
  resultsKicker: { fontSize: 10, fontFamily: 'Fraunces_300Light', color: MOSS, letterSpacing: 3, marginBottom: 8 },
  resultsTitle: { fontSize: 28, fontFamily: 'Fraunces_400Regular_Italic', color: INK, lineHeight: 34, marginBottom: 20, letterSpacing: -0.3 },
  noFlagsCard: {
    backgroundColor: CARD, borderRadius: 16, padding: 20, alignItems: 'center', gap: 12,
    borderWidth: 2, borderColor: MOSS,
    shadowColor: MOSS, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.12, shadowRadius: 0,
    elevation: 3, marginBottom: 24,
  },
  noFlagsText: { fontSize: 14, fontFamily: 'Fraunces_400Regular', color: MUTED, textAlign: 'center', lineHeight: 22 },
  flagList: { gap: 12, marginBottom: 24 },
  flagCard: {
    borderRadius: 16, padding: 16,
    borderWidth: 2,
    shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.12, shadowRadius: 0, elevation: 3,
  },
  flagLabel: { fontSize: 14, fontFamily: 'Fraunces_500Medium', marginBottom: 6, letterSpacing: 0.2 },
  flagDesc: { fontSize: 13, fontFamily: 'Fraunces_400Regular', lineHeight: 20 },
  resultActions: { gap: 10, marginBottom: 20 },
  gpBtn: {
    backgroundColor: MOSS, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: INK,
    shadowColor: INK, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.15, shadowRadius: 0, elevation: 3,
  },
  gpBtnText: { fontSize: 15, fontFamily: 'Fraunces_500Medium', color: '#fff' },
  redoBtn: { padding: 14, alignItems: 'center' },
  redoBtnText: { fontSize: 13, fontFamily: 'Fraunces_400Regular', color: MUTED },

  // ── Shared ──
  disclaimer: {
    fontSize: 11, fontFamily: 'Fraunces_400Regular_Italic', color: MUTED,
    textAlign: 'center', lineHeight: 17, paddingHorizontal: 8,
  },
});
