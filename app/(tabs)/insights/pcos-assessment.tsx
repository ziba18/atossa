import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../../../components/layout/Header';
import { Icon } from '../../../components/ui/Icon';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius, Shadow } from '../../../constants/theme';
import { usePCOSQuizStore } from '../../../stores/pcosQuizStore';

// ── Quiz data ─────────────────────────────────────────────────────────────────
// Based on: Rotterdam Criteria (2004), 2023 International Evidence-based PCOS
// Guideline (Monash/ESHRE/ASRM), and WHO PCOS factsheet (2023).

interface QuizOption { label: string; points: number }
interface QuizQuestion {
  id: string;
  emoji: string;
  category: string;
  categoryColor: string;
  question: string;
  hint?: string;
  options: QuizOption[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'cycle_regularity',
    emoji: '🗓️',
    category: 'Menstrual Cycle',
    categoryColor: Colors.cherry,
    question: 'How would you describe your periods?',
    options: [
      { label: 'Regular — I could set my clock by them', points: 0 },
      { label: 'Mostly regular, off by a few days', points: 1 },
      { label: 'Hit or miss — varies by a week or more', points: 3 },
      { label: 'Very unpredictable every month', points: 5 },
      { label: 'Rare or absent — I skip months', points: 7 },
    ],
  },
  {
    id: 'cycle_length',
    emoji: '📆',
    category: 'Menstrual Cycle',
    categoryColor: Colors.cherry,
    question: 'How long is your typical cycle? (Day 1 of one period to Day 1 of the next)',
    hint: 'The typical range is 21–35 days. Longer cycles can indicate anovulation.',
    options: [
      { label: '21–35 days — within the typical range', points: 0 },
      { label: '36–45 days — a bit on the longer side', points: 4 },
      { label: 'Over 45 days', points: 6 },
      { label: 'Under 21 days', points: 1 },
      { label: 'No idea — it changes every time', points: 5 },
    ],
  },
  {
    id: 'acne',
    emoji: '✨',
    category: 'Skin',
    categoryColor: '#D4692A',
    question: 'How would you describe your breakouts and skin?',
    options: [
      { label: 'Clear — minimal or no breakouts', points: 0 },
      { label: 'Mild — occasional pimples', points: 1 },
      { label: 'Moderate — especially on jaw, chin, chest or back', points: 3 },
      { label: 'Persistent or cystic acne that won\'t quit', points: 5 },
    ],
  },
  {
    id: 'facial_hair',
    emoji: '🌿',
    category: 'Androgens',
    categoryColor: Colors.forest,
    question: 'Do you notice unwanted hair in unexpected places? (face, chin, chest, stomach, back)',
    hint: 'Called hirsutism — this is one of the key signs of elevated androgens (male hormones).',
    options: [
      { label: 'Not at all', points: 0 },
      { label: 'A little on my upper lip', points: 1 },
      { label: 'Some on my chin or jaw', points: 3 },
      { label: 'Yes — noticeable in multiple areas', points: 5 },
    ],
  },
  {
    id: 'hair_loss',
    emoji: '💆',
    category: 'Androgens',
    categoryColor: Colors.forest,
    question: 'What\'s going on with the hair on your head?',
    options: [
      { label: 'Full and healthy — no concerns', points: 0 },
      { label: 'Some thinning, but nothing alarming', points: 1 },
      { label: 'Noticeable thinning at the crown or along the parting', points: 4 },
      { label: 'Significant hair loss', points: 5 },
    ],
  },
  {
    id: 'weight',
    emoji: '⚖️',
    category: 'Metabolism',
    categoryColor: Colors.gold,
    question: 'Where does your body tend to store extra weight?',
    options: [
      { label: 'Pretty evenly distributed', points: 0 },
      { label: 'Hips and thighs', points: 0 },
      { label: 'Mainly around my belly and abdomen', points: 4 },
      { label: 'I struggle to lose weight despite eating well', points: 3 },
    ],
  },
  {
    id: 'insulin_signs',
    emoji: '🔬',
    category: 'Metabolism',
    categoryColor: Colors.gold,
    question: 'Have you ever noticed any of the following?',
    hint: 'These can be signs of insulin resistance, which is present in 50–80% of people with PCOS.',
    options: [
      { label: 'None of these', points: 0 },
      { label: 'Dark, velvety patches on my neck, armpits or groin', points: 5 },
      { label: 'Small skin tags (tiny benign growths)', points: 2 },
      { label: 'Both of the above', points: 6 },
    ],
  },
  {
    id: 'energy',
    emoji: '⚡',
    category: 'Wellbeing',
    categoryColor: Colors.forest,
    question: 'How\'s your day-to-day energy?',
    options: [
      { label: 'Good — I feel energised most days', points: 0 },
      { label: 'Tired sometimes, but manageable', points: 1 },
      { label: 'Frequently fatigued, especially in the afternoon', points: 2 },
      { label: 'Exhausted most of the time regardless of sleep', points: 3 },
    ],
  },
  {
    id: 'family_history',
    emoji: '🧬',
    category: 'Family History',
    categoryColor: Colors.gold,
    question: 'Does anyone in your close family have PCOS, type 2 diabetes, or very irregular periods?',
    hint: 'PCOS has a strong genetic component — first-degree relatives have a 20–40% higher risk.',
    options: [
      { label: 'Not that I know of', points: 0 },
      { label: 'Maybe — I\'m genuinely not sure', points: 1 },
      { label: 'Yes — one family member', points: 3 },
      { label: 'Yes — multiple family members', points: 4 },
    ],
  },
  {
    id: 'mood',
    emoji: '🌊',
    category: 'Wellbeing',
    categoryColor: Colors.gold,
    question: 'How would you describe your mood throughout the month?',
    options: [
      { label: 'Mostly steady and balanced', points: 0 },
      { label: 'Some mood swings, usually around my period', points: 1 },
      { label: 'Noticeable anxiety or low mood most months', points: 2 },
      { label: 'Significant mood struggles that affect daily life', points: 3 },
    ],
  },
];

const MAX_SCORE = QUESTIONS.reduce(
  (sum, q) => sum + Math.max(...q.options.map((o) => o.points)),
  0,
); // = 7+6+5+5+5+4+6+3+4+3 = 48

// ── Result tiers ──────────────────────────────────────────────────────────────
interface ResultTier {
  label: string;
  subtitle: string;
  color: string;
  bgColor: string;
  gradientColors: [string, string];
  icon: string;
  minPct: number;
  whatNext: string[];
  facts: string[];
}

const RESULT_TIERS: ResultTier[] = [
  {
    label: 'Low Likelihood',
    subtitle: 'Your responses suggest few PCOS indicators right now.',
    color: '#4A9A6A',
    bgColor: '#EDF8F2',
    gradientColors: ['#EDF8F2', '#F5EDE5'],
    icon: '🌿',
    minPct: 0,
    whatNext: [
      'Keep tracking your cycle — patterns over time are powerful',
      'Maintain a balanced diet rich in whole foods and fibre',
      'Schedule your annual gynaecology check-up',
    ],
    facts: [
      'PCOS affects roughly 1 in 10 women of reproductive age globally (WHO, 2023).',
      'Early lifestyle habits — regular movement and balanced nutrition — support long-term hormonal health.',
      'Even without PCOS, tracking your cycle is a valuable tool for understanding your overall health.',
    ],
  },
  {
    label: 'Some Indicators',
    subtitle: 'A few patterns in your responses are worth keeping an eye on.',
    color: '#B07D20',
    bgColor: '#FFF9ED',
    gradientColors: ['#FFF9ED', '#F5EDE5'],
    icon: '🌤️',
    minPct: 19,
    whatNext: [
      'Mention your cycle patterns to your doctor at your next visit',
      'Try tracking your symptoms consistently for 2–3 months',
      'Reducing processed sugars and refined carbs is one of the most impactful dietary shifts for hormonal health',
    ],
    facts: [
      'Up to 70% of people with PCOS remain undiagnosed (PCOS Awareness Association, 2023).',
      'Irregular cycles are the most common first sign — yet they\'re often dismissed.',
      'Anti-inflammatory diets have shown measurable benefit for PCOS symptoms in multiple clinical studies.',
    ],
  },
  {
    label: 'Moderate Indicators',
    subtitle: 'Several of your responses align with common PCOS symptom patterns.',
    color: '#C4611A',
    bgColor: '#FFF2E8',
    gradientColors: ['#FFF2E8', '#F5EDE5'],
    icon: '☁️',
    minPct: 40,
    whatNext: [
      'Book an appointment with a gynaecologist or endocrinologist',
      'Ask about blood tests: LH, FSH, total testosterone, AMH, and fasting insulin',
      'A pelvic ultrasound may be recommended to assess ovarian morphology',
    ],
    facts: [
      'PCOS is diagnosed using the Rotterdam Criteria: at least 2 of 3 must be present — irregular cycles, elevated androgens, or polycystic ovaries on ultrasound.',
      'Insulin resistance affects 50–80% of people with PCOS, regardless of body weight.',
      'With the right support, PCOS is highly manageable through lifestyle changes and/or targeted medication.',
    ],
  },
  {
    label: 'High Indicators',
    subtitle: 'Your responses strongly align with several key PCOS symptoms.',
    color: '#A05558',
    bgColor: '#FDF0F0',
    gradientColors: ['#FDF0F0', '#F5EDE5'],
    icon: '⚠️',
    minPct: 62,
    whatNext: [
      'See a gynaecologist or endocrinologist — bring this quiz as a conversation starter',
      'Request a full hormonal panel + pelvic ultrasound',
      'Know that PCOS is very manageable: you\'re not alone, and this is the first step',
    ],
    facts: [
      'PCOS is the leading cause of anovulatory infertility — but it is very treatable.',
      'The 2023 International PCOS Guidelines recommend a holistic approach: lifestyle medicine, psychological support, and individualised medical treatment.',
      'A quiz cannot diagnose PCOS — only a clinician can. But awareness is the most important first step.',
    ],
  },
];

function getTier(score: number): ResultTier {
  const pct = (score / MAX_SCORE) * 100;
  return [...RESULT_TIERS].reverse().find((t) => pct >= t.minPct) ?? RESULT_TIERS[0];
}

// ── Component ─────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'quiz' | 'results';

export default function PCOSAssessmentScreen() {
  const setQuizResult = usePCOSQuizStore((s) => s.setResult);

  const [phase, setPhase] = useState<Phase>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const question = QUESTIONS[currentQ];
  const totalScore = Object.values(answers).reduce((s, v) => s + v, 0);
  const tier = getTier(totalScore);
  const scorePct = Math.round((totalScore / MAX_SCORE) * 100);
  const progress = (currentQ + (phase === 'results' ? 1 : 0)) / QUESTIONS.length;

  function transition(callback: () => void) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    });
  }

  function handleStart() {
    transition(() => { setPhase('quiz'); setCurrentQ(0); setAnswers({}); setSelected(null); });
  }

  function handleSelect(idx: number) { setSelected(idx); }

  function handleNext() {
    if (selected === null) return;
    const pts = question.options[selected].points;
    const next = { ...answers, [question.id]: pts };
    setAnswers(next);
    transition(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ((q) => q + 1);
        setSelected(null);
      } else {
        // Persist result so Insights page can display it
        const finalScore = Object.values(next).reduce((s, v) => s + v, 0);
        const finalTier = getTier(finalScore);
        const finalPct = Math.round((finalScore / MAX_SCORE) * 100);
        setQuizResult({
          scorePct: finalPct,
          tierKey: finalTier.label === 'Low Likelihood' ? 'low'
            : finalTier.label === 'Some Indicators' ? 'some'
            : finalTier.label === 'Moderate Indicators' ? 'moderate'
            : 'high',
          tierLabel: finalTier.label,
          tierColor: finalTier.color,
          takenAt: new Date().toISOString(),
        });
        setPhase('results');
      }
    });
  }

  function handleRetake() {
    transition(() => { setPhase('intro'); setCurrentQ(0); setAnswers({}); setSelected(null); });
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <SafeAreaView style={styles.screen}>
        <Header title="PCOS Quiz" showBack />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <LinearGradient colors={['#F0EEFB', '#EDF5ED']} style={styles.introHero}>
              <Text style={styles.introHeroEmoji}>🩺</Text>
              <Text style={styles.introTitle}>Could it be PCOS?</Text>
              <Text style={styles.introSubtitle}>
                A fun, science-backed quiz to help you understand your symptoms and know when to talk to a doctor
              </Text>
            </LinearGradient>

            <View style={styles.introBody}>
              <View style={styles.infoCard}>
                {([
                  ['⏱️', '3 minutes · 10 questions'],
                  ['🔬', 'Based on Rotterdam Criteria & 2023 PCOS Guidelines'],
                  ['🔒', 'Private — your answers stay on your device'],
                ] as [string, string][]).map(([emoji, text]) => (
                  <View key={text} style={styles.infoRow}>
                    <Text style={styles.infoEmoji}>{emoji}</Text>
                    <Text style={styles.infoText}>{text}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.disclaimerBox}>
                <Icon name="info" size={14} color={Colors.textMuted} />
                <Text style={styles.disclaimerText}>
                  This quiz is for awareness only and is not a substitute for medical advice. Only a qualified healthcare professional can diagnose PCOS.
                </Text>
              </View>

              <TouchableOpacity onPress={handleStart} style={styles.startBtn} activeOpacity={0.85}>
                <Text style={styles.startBtnText}>Start Quiz</Text>
                <Icon name="arrow-right" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    return (
      <SafeAreaView style={styles.screen}>
        <Header title={`Question ${currentQ + 1} of ${QUESTIONS.length}`} showBack />

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* Category badge */}
            <View style={[styles.categoryBadge, { backgroundColor: question.categoryColor + '18', borderColor: question.categoryColor + '30' }]}>
              <Text style={[styles.categoryText, { color: question.categoryColor }]}>
                {question.category.toUpperCase()}
              </Text>
            </View>

            {/* Emoji + Question */}
            <Text style={styles.questionEmoji}>{question.emoji}</Text>
            <Text style={styles.questionText}>{question.question}</Text>

            {/* Hint */}
            {question.hint && (
              <View style={styles.hintBox}>
                <Icon name="info" size={13} color={Colors.gold} />
                <Text style={styles.hintText}>{question.hint}</Text>
              </View>
            )}

            {/* Options */}
            <View style={styles.optionsWrap}>
              {question.options.map((opt, idx) => {
                const isSelected = selected === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSelect(idx)}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Next / Finish */}
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.nextBtn, selected === null && styles.nextBtnDisabled]}
              activeOpacity={0.85}
              disabled={selected === null}
            >
              <Text style={styles.nextBtnText}>
                {currentQ === QUESTIONS.length - 1 ? 'See My Results' : 'Next'}
              </Text>
              <Icon name="arrow-right" size={18} color={Colors.white} />
            </TouchableOpacity>

            <View style={{ height: Spacing.xxl }} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Your Results" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Score card */}
          <LinearGradient colors={tier.gradientColors} style={styles.scoreCard}>
            <Text style={styles.resultIcon}>{tier.icon}</Text>
            <Text style={[styles.resultLabel, { color: tier.color }]}>{tier.label}</Text>
            <Text style={styles.resultSubtitle}>{tier.subtitle}</Text>

            {/* Score bar */}
            <View style={styles.gaugeRow}>
              <View style={styles.gaugeBg}>
                <View style={[styles.gaugeFill, { width: `${scorePct}%` as any, backgroundColor: tier.color }]} />
              </View>
              <Text style={[styles.scorePct, { color: tier.color }]}>{scorePct}%</Text>
            </View>
            <View style={styles.legendRow}>
              <Text style={styles.legendLabel}>Low</Text>
              <Text style={styles.legendLabel}>Moderate</Text>
              <Text style={styles.legendLabel}>High</Text>
            </View>
          </LinearGradient>

          {/* What to do next */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What to do next</Text>
            {tier.whatNext.map((item, i) => (
              <View key={i} style={styles.nextStepRow}>
                <View style={[styles.stepDot, { backgroundColor: tier.color }]} />
                <Text style={styles.nextStepText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Did you know */}
          <View style={[styles.section, styles.factsCard, { backgroundColor: tier.bgColor, borderColor: tier.color + '25' }]}>
            <Text style={[styles.sectionTitle, { color: tier.color }]}>Did you know?</Text>
            {tier.facts.map((fact, i) => (
              <View key={i} style={styles.factRow}>
                <Text style={styles.factEmoji}>💡</Text>
                <Text style={styles.factText}>{fact}</Text>
              </View>
            ))}
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerBox}>
            <Icon name="triangle-alert" size={14} color={Colors.textMuted} />
            <Text style={styles.disclaimerText}>
              This quiz cannot diagnose PCOS. Diagnosis requires clinical evaluation, blood tests (LH, FSH, testosterone, AMH, fasting insulin), and often a pelvic ultrasound. Please speak with a qualified healthcare professional.
            </Text>
          </View>

          {/* Retake */}
          <TouchableOpacity onPress={handleRetake} style={styles.retakeBtn} activeOpacity={0.8}>
            <Icon name="refresh" size={16} color={Colors.cherry} />
            <Text style={styles.retakeBtnText}>Retake Quiz</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing.xxl }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.md },

  // ── Intro ──────────────────────────────────────────────────────────────────
  introHero: {
    borderRadius: 24, padding: Spacing.xl,
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  introHeroEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  introTitle: {
    fontSize: 30, fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm,
  },
  introSubtitle: {
    fontSize: FontSize.md, fontFamily: 'Jost_400Regular',
    color: Colors.textSecondary, textAlign: 'center', lineHeight: 22,
  },

  introBody: { gap: Spacing.md },

  infoCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.sm,
    ...Shadow.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  infoText: {
    flex: 1, fontSize: FontSize.sm, fontFamily: 'Jost_400Regular',
    color: Colors.textSecondary, lineHeight: 20,
  },

  startBtn: {
    backgroundColor: Colors.cherry, borderRadius: 99,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 16,
    ...Shadow.sm,
  },
  startBtnText: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', color: Colors.white },

  // ── Progress bar ──────────────────────────────────────────────────────────
  progressBg: {
    height: 4, backgroundColor: Colors.border,
    marginHorizontal: 0,
  },
  progressFill: {
    height: 4, backgroundColor: Colors.cherry, borderRadius: 2,
  },

  // ── Quiz ───────────────────────────────────────────────────────────────────
  categoryBadge: {
    alignSelf: 'flex-start', borderRadius: 99,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, marginBottom: Spacing.md,
  },
  categoryText: { fontSize: 10, fontFamily: 'Jost_600SemiBold', letterSpacing: 1.2 },

  questionEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  questionText: {
    fontSize: 22, fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.textPrimary, lineHeight: 28, marginBottom: Spacing.md,
  },

  hintBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: Colors.goldLighter, borderRadius: 10,
    padding: Spacing.sm, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.gold + '30',
  },
  hintText: {
    flex: 1, fontSize: FontSize.xs, fontFamily: 'Jost_400Regular',
    color: Colors.goldDark, lineHeight: 17,
  },

  optionsWrap: { gap: Spacing.sm, marginBottom: Spacing.lg },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    padding: Spacing.md, ...Shadow.sm,
  },
  optionCardSelected: {
    borderColor: Colors.cherry,
    backgroundColor: Colors.cherryLighter,
  },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  radioSelected: { borderColor: Colors.cherry },
  radioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.cherry,
  },
  optionLabel: {
    flex: 1, fontSize: FontSize.sm, fontFamily: 'Jost_400Regular',
    color: Colors.textSecondary, lineHeight: 20,
  },
  optionLabelSelected: { fontFamily: 'Jost_500Medium', color: Colors.cherryDark },

  nextBtn: {
    backgroundColor: Colors.cherry, borderRadius: 99,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 16,
  },
  nextBtnDisabled: { opacity: 0.35 },
  nextBtnText: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', color: Colors.white },

  // ── Results ────────────────────────────────────────────────────────────────
  scoreCard: {
    borderRadius: 24, padding: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(180,150,140,0.15)',
  },
  resultIcon: { fontSize: 48, marginBottom: Spacing.sm },
  resultLabel: {
    fontSize: 28, fontFamily: 'CormorantGaramond_600SemiBold',
    marginBottom: Spacing.xs,
  },
  resultSubtitle: {
    fontSize: FontSize.sm, fontFamily: 'Jost_400Regular',
    color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 20,
  },

  gaugeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  gaugeBg: {
    flex: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: Radius.full, overflow: 'hidden',
  },
  gaugeFill: { height: 12, borderRadius: Radius.full },
  scorePct: { fontSize: FontSize.lg, fontFamily: 'Jost_600SemiBold', minWidth: 44, textAlign: 'right' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between' },
  legendLabel: {
    fontSize: 10, fontFamily: 'Jost_400Regular',
    color: Colors.textMuted, letterSpacing: 0.3,
  },

  section: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold',
    color: Colors.textPrimary, marginBottom: Spacing.md,
  },

  nextStepRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  stepDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  nextStepText: {
    flex: 1, fontSize: FontSize.sm, fontFamily: 'Jost_400Regular',
    color: Colors.textSecondary, lineHeight: 20,
  },

  factsCard: { borderWidth: 1 },
  factRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  factEmoji: { fontSize: 16, lineHeight: 22 },
  factText: {
    flex: 1, fontSize: FontSize.sm, fontFamily: 'Jost_400Regular',
    color: Colors.textSecondary, lineHeight: 20,
  },

  retakeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.md,
    backgroundColor: Colors.cherryLighter, borderRadius: 99,
    borderWidth: 1, borderColor: Colors.cherry + '30',
  },
  retakeBtnText: {
    fontSize: FontSize.sm, fontFamily: 'Jost_600SemiBold', color: Colors.cherry,
  },

  disclaimerBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.sm, marginBottom: Spacing.md,
  },
  disclaimerText: {
    flex: 1, fontSize: FontSize.xs, fontFamily: 'Jost_400Regular',
    color: Colors.textMuted, lineHeight: 16,
  },
});
