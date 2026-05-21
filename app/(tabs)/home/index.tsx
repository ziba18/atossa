import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { useAlertStore } from '../../../stores/alertStore';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../../constants/theme';
import { AuroraBackground } from '../../../components/layout/AuroraBackground';
import { formatDisplayDate } from '../../../algorithms/dateHelpers';
import { differenceInDays, parseISO, format } from 'date-fns';

// ─── Inner Seasons ────────────────────────────────────────────────────────────
type CycleSeason = 'winter' | 'spring' | 'summer' | 'autumn';

const SEASONS: Record<CycleSeason, {
  name: string;
  phase: string;
  phaseColor: string;
  icon: IconName;
  tagline: string;
  energy: string[];
  selfCare: string;
  affirmation: string;
}> = {
  winter: {
    name: 'Menstrual',
    phase: 'Menstruation',
    phaseColor: Colors.roseDeep,
    icon: 'droplet',
    tagline: 'Rest, reflect & release.',
    energy: ['Introspective', 'Intuitive', 'Honest'],
    selfCare: 'Warm baths · Gentle stretching · Journaling',
    affirmation: '"I honour my body\'s wisdom and allow myself to rest."',
  },
  spring: {
    name: 'Follicular',
    phase: 'Follicular',
    phaseColor: Colors.matchaDeep,
    icon: 'leaf',
    tagline: 'Rising energy & fresh beginnings.',
    energy: ['Creative', 'Optimistic', 'Curious'],
    selfCare: 'Try something new · Start that project · Morning walks',
    affirmation: '"I am full of fresh energy and endless possibility."',
  },
  summer: {
    name: 'Ovulation',
    phase: 'Ovulation',
    phaseColor: Colors.apricot,
    icon: 'sparkles',
    tagline: 'Radiant, magnetic & powerful.',
    energy: ['Confident', 'Magnetic', 'Communicative'],
    selfCare: 'Connect & collaborate · Dress up · Celebrate yourself',
    affirmation: '"I radiate warmth and confidence in everything I do."',
  },
  autumn: {
    name: 'Luteal',
    phase: 'Luteal',
    phaseColor: Colors.lavender,
    icon: 'flower',
    tagline: 'Focused, grounded & reflective.',
    energy: ['Analytical', 'Detail-oriented', 'Nesting'],
    selfCare: 'Finish projects · Cozy nights in · Nourishing meals',
    affirmation: '"I trust the rhythm of my body and honour every phase."',
  },
};

function getCycleSeasonInfo(
  today: Date,
  cycleLogs: { period_start: string; period_end: string | null; period_length: number | null }[],
  prediction: { next_period_start: string | null; fertile_window_start: string | null; fertile_window_end: string | null; predicted_cycle_length: number | null } | null,
  defaultPeriodLength: number,
): { season: CycleSeason; cycleDay: number; cycleLength: number } | null {
  if (cycleLogs.length === 0) return null;
  const lastLog = cycleLogs[cycleLogs.length - 1];
  const lastStart = parseISO(lastLog.period_start);
  const periodLen = lastLog.period_length ?? defaultPeriodLength;
  const cycleLength = prediction?.predicted_cycle_length ?? 28;
  if (prediction?.next_period_start) {
    const nextPStart = parseISO(prediction.next_period_start);
    if (today >= nextPStart) {
      return { season: 'winter', cycleDay: differenceInDays(today, nextPStart) + 1, cycleLength };
    }
    const dayInCycle = differenceInDays(today, lastStart) + 1;
    let season: CycleSeason;
    if (dayInCycle <= periodLen) {
      season = 'winter';
    } else if (prediction.fertile_window_start && today < parseISO(prediction.fertile_window_start)) {
      season = 'spring';
    } else if (prediction.fertile_window_end && today <= parseISO(prediction.fertile_window_end)) {
      season = 'summer';
    } else {
      season = 'autumn';
    }
    return { season, cycleDay: dayInCycle, cycleLength };
  }
  const dayInCycle = differenceInDays(today, lastStart) + 1;
  return { season: dayInCycle <= periodLen ? 'winter' : 'spring', cycleDay: dayInCycle, cycleLength };
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const Colors = useColors();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const { cycleLogs, prediction, fetchCycleLogs, fetchPrediction } = useCycleStore();
  const { alerts, unreadCount, fetchAlerts } = useAlertStore();

  useEffect(() => {
    if (user) { fetchCycleLogs(user.id); fetchPrediction(user.id); fetchAlerts(user.id); }
  }, [user]);

  const today = new Date();
  const greeting = (() => {
    const h = today.getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();
  const firstName = profile?.display_name?.split(' ')[0] ?? '';

  const sortedLogs = [...cycleLogs].sort(
    (a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime()
  );
  const seasonInfo = getCycleSeasonInfo(today, sortedLogs, prediction, profile?.average_period_length ?? 5);
  const season = seasonInfo ? SEASONS[seasonInfo.season] : null;

  const daysUntilPeriod = prediction?.next_period_start
    ? differenceInDays(parseISO(prediction.next_period_start), today)
    : null;

  const bottomPad = 68 + 12 + insets.bottom + 16;

  // ── Suggest cards ──────────────────────────────────────────────────────────
  // Each card uses one accent colour for the icon + CTA only — body text
  // stays in textPrimary/Secondary so the carousel feels calm, not
  // multi-coloured.
  const suggestions = [
    {
      key: 'log',
      icon: 'heart' as IconName,
      title: 'Log your cycle',
      body: season ? `In ${season.name} — ${season.tagline}` : 'Start tracking your period',
      accent: Colors.roseDeep,
      bg: 'rgba(176,69,90,0.07)',
      onPress: () => router.push('/(tabs)/cycle/log-period' as any),
    },
    {
      key: 'calendar',
      icon: 'calendar' as IconName,
      title: 'View calendar',
      body: prediction?.next_period_start
        ? `Next period ~${formatDisplayDate(prediction.next_period_start)}`
        : 'Year-ahead cycle predictions',
      accent: Colors.cherryDark,
      bg: 'rgba(122,42,61,0.06)',
      onPress: () => router.push('/(tabs)/cycle/calendar' as any),
    },
    {
      key: 'health',
      icon: 'clipboard-list' as IconName,
      title: 'Health log',
      body: 'Record symptoms, mood & metrics for today',
      accent: Colors.gold,
      bg: 'rgba(196,155,137,0.10)',
      onPress: () => router.push('/(tabs)/health' as any),
    },
    {
      key: 'learn',
      icon: 'book-open' as IconName,
      title: 'Read & learn',
      body: season ? `Articles for the ${season.name} phase` : 'Evidence-based articles',
      accent: Colors.lavender,
      bg: 'rgba(168,154,181,0.10)',
      onPress: () => router.push('/(tabs)/education' as any),
    },
  ];

  const styles = createStyles(Colors);

  return (
    <View style={styles.screen}>
      <AuroraBackground />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        >

          {/* ── Header ──────────────────────────────────────────────────── */}
          <View style={styles.headerRow}>
            <Text style={styles.dateSmallcaps}>
              {format(today, 'EEEE, d MMMM').toUpperCase()}
            </Text>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/home/notifications' as any)}
                  style={styles.bellBtn}
                >
                  <Icon name="bell" size={22} color={Colors.textSecondary} />
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile' as any)}
                style={styles.profileBtn}
              >
                <Icon name="user" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.greeting}>
            {greeting}{firstName ? `, ${firstName}` : ''}.
          </Text>
          <Text style={styles.tagline}>You are exactly where you need to be.</Text>

          {/* ── Hero glass card ──────────────────────────────────────────── */}
          {season && seasonInfo ? (
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={[styles.phaseDotBig, { backgroundColor: season.phaseColor }]} />
                <Text style={styles.smallcaps}>DAY {seasonInfo.cycleDay} OF {seasonInfo.cycleLength}</Text>
              </View>
              <Text style={[styles.heroPhase, { color: season.phaseColor }]}>
                {season.name} phase
              </Text>
              <Text style={styles.heroTagline}>{season.tagline}</Text>

              {/* Energy chips — neutral, cohesive */}
              <View style={styles.chipsRow}>
                {season.energy.map((e) => (
                  <View key={e} style={styles.chip}>
                    <Text style={styles.chipText}>{e}</Text>
                  </View>
                ))}
              </View>

              {/* Self-care */}
              <View style={styles.selfCareRow}>
                <Icon name="leaf" size={14} color={season.phaseColor} />
                <Text style={styles.selfCareText}>{season.selfCare}</Text>
              </View>

              <Text style={styles.affirmation}>
                {season.affirmation}
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/cycle' as any)}
                style={styles.heroLink}
              >
                <Text style={styles.heroLinkText}>
                  View full cycle
                </Text>
                <Icon name="arrow-right" size={14} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.heroCard}>
              <Text style={styles.smallcaps}>WELCOME</Text>
              <Text style={styles.heroPhase}>Start your journey</Text>
              <Text style={styles.heroTagline}>Log your first period to unlock personalised cycle insights.</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/cycle/log-period' as any)}
                style={styles.heroCta}
              >
                <Text style={styles.heroCtaText}>Log first period</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Stat tiles ──────────────────────────────────────────────── */}
          {seasonInfo && (
            <View style={styles.statsRow}>
              <StatTile
                label="Next period"
                value={daysUntilPeriod != null ? (daysUntilPeriod <= 0 ? 'Today' : `${daysUntilPeriod}d`) : '—'}
                hint={prediction?.next_period_start ? formatDisplayDate(prediction.next_period_start) : ''}
                dotColor={Colors.roseDeep}
              />
              <StatTile
                label="Cycle length"
                value={`${seasonInfo.cycleLength}d`}
                hint="average"
                dotColor={Colors.matchaDeep}
              />
              <StatTile
                label="Cycle day"
                value={`${seasonInfo.cycleDay}`}
                hint={`of ${seasonInfo.cycleLength}`}
                dotColor={Colors.skyDeep}
              />
              <StatTile
                label="Logged"
                value={`${cycleLogs.length}`}
                hint="cycles"
                dotColor={Colors.apricot}
              />
            </View>
          )}

          {/* ── Recent alerts ────────────────────────────────────────────── */}
          {alerts.filter((a) => !a.is_read).slice(0, 2).map((alert) => (
            <View
              key={alert.id}
              style={[styles.alertBanner, alert.severity === 'emergency' && styles.alertEmergency]}
            >
              <Icon name="triangle-alert" size={16} color={alert.severity === 'emergency' ? Colors.roseDeep : Colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                {alert.body && <Text style={styles.alertBody} numberOfLines={2}>{alert.body}</Text>}
              </View>
            </View>
          ))}

          {/* ── For you today ────────────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>For you today</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
          >
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s.key}
                onPress={s.onPress}
                activeOpacity={0.82}
                style={[styles.suggestCard, { backgroundColor: s.bg }]}
              >
                <View style={[styles.suggestIcon, { backgroundColor: s.accent + '22' }]}>
                  <Icon name={s.icon} size={18} color={s.accent} />
                </View>
                <Text style={styles.suggestTitle}>{s.title}</Text>
                <Text style={styles.suggestBody} numberOfLines={2}>{s.body}</Text>
                <View style={styles.suggestCta}>
                  <Text style={[styles.suggestCtaText, { color: s.accent }]}>Open</Text>
                  <Icon name="arrow-right" size={12} color={s.accent} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Disclaimer ───────────────────────────────────────────────── */}
          <Text style={styles.disclaimer}>
            Atossa is for personal tracking and education. It is not a medical device and does not provide diagnoses.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatTile({ label, value, hint, dotColor }: {
  label: string; value: string; hint?: string; dotColor: string;
}) {
  const Colors = useColors();
  const styles = createStyles(Colors);
  return (
    <View style={styles.statTile}>
      <View style={styles.statTileHeader}>
        <View style={[styles.statDot, { backgroundColor: dotColor }]} />
        <Text style={styles.statTileLabel}>{label}</Text>
      </View>
      <Text style={styles.statTileValue}>{value}</Text>
      {hint ? <Text style={styles.statTileHint}>{hint}</Text> : null}
    </View>
  );
}

function createStyles(c: AppColors) {
  const Colors = c;
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  // Header
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  dateSmallcaps: {
    fontSize: 11,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.textMuted,
    letterSpacing: 1.4,
    flex: 1,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  bellBtn: { padding: 6, position: 'relative' },
  profileBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.glassBgSoft,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: Colors.roseDeep,
    borderRadius: 99, width: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, color: Colors.white, fontFamily: 'CormorantGaramond_600SemiBold' },

  greeting: {
    fontSize: 30,
    fontFamily: 'CormorantGaramond_500Medium_Italic',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    lineHeight: 36,
  },
  tagline: {
    fontSize: FontSize.md,
    fontFamily: 'CormorantGaramond_400Regular',
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },

  // Hero card
  heroCard: {
    backgroundColor: Colors.glassBg,
    borderRadius: 28,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    shadowColor: '#2A1F26',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: Spacing.md,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  phaseDotBig: { width: 10, height: 10, borderRadius: 5 },
  smallcaps: {
    fontSize: 11,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.textMuted,
    letterSpacing: 1.4,
  },
  heroPhase: {
    fontSize: 26,
    fontFamily: 'CormorantGaramond_500Medium_Italic',
    lineHeight: 32,
    marginBottom: 4,
  },
  heroTagline: {
    fontSize: FontSize.sm,
    fontFamily: 'CormorantGaramond_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.md },
  chip: {
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.glassBgSubtle,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontFamily: 'CormorantGaramond_500Medium',
    color: Colors.textSecondary,
  },
  selfCareRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: Spacing.sm },
  selfCareText: { fontSize: FontSize.xs, fontFamily: 'CormorantGaramond_400Regular', color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  affirmation: {
    fontSize: FontSize.sm,
    fontFamily: 'CormorantGaramond_500Medium',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  heroLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroLinkText: { fontSize: FontSize.sm, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.textPrimary },
  heroCta: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.cherry,
    borderRadius: 99,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    marginTop: Spacing.sm,
  },
  heroCtaText: { fontSize: FontSize.sm, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.white },

  // Stat tiles
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statTile: {
    flex: 1,
    backgroundColor: Colors.glassBgSoft,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statTileHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statTileLabel: { fontSize: 10, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.textMuted, letterSpacing: 0.6, flex: 1 },
  statTileValue: { fontSize: 22, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.textPrimary, lineHeight: 26 },
  statTileHint: { fontSize: 10, fontFamily: 'CormorantGaramond_400Regular', color: Colors.textMuted, marginTop: 2 },

  // Alerts
  alertBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.glassBgSoft,
    borderRadius: 16, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  alertEmergency: { borderColor: Colors.roseDeep + '55', backgroundColor: 'rgba(176,69,90,0.08)' },
  alertTitle: { fontSize: FontSize.sm, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.textPrimary },
  alertBody: { fontSize: FontSize.xs, fontFamily: 'CormorantGaramond_400Regular', color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },

  // For you today
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSize.xl, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.textPrimary },
  carouselContent: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  suggestCard: {
    width: 180,
    borderRadius: 22,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  suggestIcon: {
    width: 38, height: 38, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  suggestTitle: {
    fontSize: FontSize.md,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  suggestBody: {
    fontSize: FontSize.xs,
    fontFamily: 'CormorantGaramond_400Regular',
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
    flex: 1,
  },
  suggestCta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  suggestCtaText: { fontSize: FontSize.xs, fontFamily: 'CormorantGaramond_600SemiBold' },

  disclaimer: {
    fontSize: 10,
    fontFamily: 'CormorantGaramond_400Regular',
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  });
}
