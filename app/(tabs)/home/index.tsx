import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { useAlertStore } from '../../../stores/alertStore';
import { Card } from '../../../components/ui/Card';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing, Shadow, Radius } from '../../../constants/theme';
import { formatDisplayDate } from '../../../algorithms/dateHelpers';
import { SafeAreaView } from 'react-native-safe-area-context';
import { differenceInDays, parseISO } from 'date-fns';

// ─── Inner Seasons (exact web SEASONS data) ───────────────────────────────────
type CycleSeason = 'winter' | 'spring' | 'summer' | 'autumn';

const SEASONS: Record<CycleSeason, {
  name: string;
  phase: string;
  gradientColors: [string, string, string];
  textAccent: string;
  icon: IconName;
  tagline: string;
  energy: string[];
  power: string;
  selfCare: string;
  affirmation: string;
}> = {
  winter: {
    name: 'Inner Winter',
    phase: 'Menstruation',
    gradientColors: ['#2a0310', '#390517', '#1a020b'],
    textAccent: '#e8a0b0',
    icon: 'sparkles',
    tagline: 'Rest, reflect & release',
    energy: ['Introspective', 'Intuitive', 'Honest'],
    power: 'Deep knowing & emotional clarity',
    selfCare: 'Warm baths · Gentle stretching · Journaling',
    affirmation: '"I honor my body\'s wisdom and allow myself to rest."',
  },
  spring: {
    name: 'Inner Spring',
    phase: 'Follicular',
    gradientColors: ['#0a1f1c', '#16302B', '#0d261f'],
    textAccent: '#7dcfad',
    icon: 'leaf',
    tagline: 'Rising energy & fresh beginnings',
    energy: ['Creative', 'Optimistic', 'Curious'],
    power: 'Fresh ideas & unstoppable momentum',
    selfCare: 'Try something new · Start that project · Morning walks',
    affirmation: '"I am full of fresh energy and endless possibility."',
  },
  summer: {
    name: 'Inner Summer',
    phase: 'Ovulation',
    gradientColors: ['#4a3010', '#7A5A2A', '#A38560'],
    textAccent: '#f5d480',
    icon: 'zap',
    tagline: 'Radiant, magnetic & powerful',
    energy: ['Confident', 'Magnetic', 'Communicative'],
    power: 'Peak charisma & natural leadership',
    selfCare: 'Connect & collaborate · Dress up · Celebrate yourself',
    affirmation: '"I radiate warmth and confidence in everything I do."',
  },
  autumn: {
    name: 'Inner Autumn',
    phase: 'Luteal',
    gradientColors: ['#2a1508', '#4a2510', '#3d1e0a'],
    textAccent: '#e0956a',
    icon: 'flower',
    tagline: 'Focused, grounded & reflective',
    energy: ['Analytical', 'Detail-oriented', 'Nesting'],
    power: 'Deep focus & sharp precision',
    selfCare: 'Finish projects · Cozy nights in · Nourishing meals',
    affirmation: '"I trust the rhythm of my body and honour every phase."',
  },
};

function getCycleSeasonInfo(
  today: Date,
  cycleLogs: { period_start: string; period_end: string | null; period_length: number | null }[],
  prediction: { next_period_start: string; fertile_window_start: string; fertile_window_end: string; predicted_cycle_length: number } | null,
  defaultPeriodLength: number,
): { season: CycleSeason; cycleDay: number; cycleLength: number } | null {
  if (cycleLogs.length === 0) return null;
  const lastLog = cycleLogs[cycleLogs.length - 1];
  const lastStart = parseISO(lastLog.period_start);
  const periodLen = lastLog.period_length ?? defaultPeriodLength;
  const cycleLength = prediction?.predicted_cycle_length ?? 28;
  if (prediction) {
    const nextPStart = parseISO(prediction.next_period_start);
    if (today >= nextPStart) {
      return { season: 'winter', cycleDay: differenceInDays(today, nextPStart) + 1, cycleLength };
    }
    const dayInCycle = differenceInDays(today, lastStart) + 1;
    const fertileStart = parseISO(prediction.fertile_window_start);
    const fertileEnd = parseISO(prediction.fertile_window_end);
    let season: CycleSeason;
    if (dayInCycle <= periodLen) season = 'winter';
    else if (today < fertileStart) season = 'spring';
    else if (today <= fertileEnd) season = 'summer';
    else season = 'autumn';
    return { season, cycleDay: dayInCycle, cycleLength };
  }
  const dayInCycle = differenceInDays(today, lastStart) + 1;
  return { season: dayInCycle <= periodLen ? 'winter' : 'spring', cycleDay: dayInCycle, cycleLength };
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const { cycleLogs, prediction, fetchCycleLogs, fetchPrediction } = useCycleStore();
  const { alerts, unreadCount, fetchAlerts } = useAlertStore();

  useEffect(() => {
    if (user) { fetchCycleLogs(user.id); fetchPrediction(user.id); fetchAlerts(user.id); }
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const sortedLogs = [...cycleLogs].sort(
    (a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime()
  );
  const today = new Date();
  const seasonInfo = getCycleSeasonInfo(today, sortedLogs, prediction, profile?.average_period_length ?? 5);
  const season = seasonInfo ? SEASONS[seasonInfo.season] : null;
  const daysUntilPeriod = prediction?.next_period_start
    ? differenceInDays(parseISO(prediction.next_period_start), today)
    : null;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero: dark burgundy-to-forest gradient (matches web cycle card) ─ */}
        <LinearGradient
          colors={['#390517', '#03110D']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Top row */}
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <Image source={require('../../../assets/icon.png')} style={styles.headerLogo} />
              <View>
                <Text style={styles.greeting}>
                  {greeting()}, {profile?.display_name?.split(' ')[0] ?? 'there'}
                </Text>
                <Text style={styles.heroDate}>
                  {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/home/notifications' as any)}
              style={styles.bellBtn}
            >
              <Icon name="bell" size={24} color={Colors.white} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Prediction */}
          {prediction?.next_period_start && (
            <View style={styles.predCard}>
              <Text style={styles.predLabel}>Next period in</Text>
              <Text style={styles.predValue}>
                {daysUntilPeriod !== null && daysUntilPeriod > 0
                  ? `${daysUntilPeriod} days`
                  : daysUntilPeriod === 0 ? 'Today' : 'Due'}
              </Text>
              <Text style={styles.predSub}>
                Around {formatDisplayDate(prediction.next_period_start)}
                {' · '}{Math.round(prediction.confidence_score ?? 0)}% confidence
              </Text>
              {prediction.next_ovulation && (
                <View style={styles.predMetaRow}>
                  <View style={styles.predMeta}>
                    <Text style={styles.predMetaLabel}>Ovulation</Text>
                    <Text style={styles.predMetaValue}>{formatDisplayDate(prediction.next_ovulation)}</Text>
                  </View>
                  <View style={styles.predMetaDivider} />
                  <View style={styles.predMeta}>
                    <Text style={styles.predMetaLabel}>Cycle length</Text>
                    <Text style={styles.predMetaValue}>{prediction.predicted_cycle_length} days</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </LinearGradient>

        <View style={styles.content}>

          {/* ── Inner Seasons Card ─────────────────────────────────────────── */}
          {season && seasonInfo && (
            <LinearGradient colors={season.gradientColors} style={styles.seasonCard}>
              <View style={styles.seasonTopRow}>
                <View style={styles.seasonLeft}>
                  <Icon name={season.icon} size={28} color={season.textAccent} />
                  <View>
                    <Text style={[styles.seasonName, { color: season.textAccent }]}>
                      {season.name}
                    </Text>
                    <Text style={styles.seasonPhase}>{season.phase} phase</Text>
                  </View>
                </View>
                <View style={styles.cycleDayBox}>
                  <Text style={styles.cycleDayLabel}>Cycle day</Text>
                  <Text style={[styles.cycleDayValue, { color: season.textAccent }]}>
                    {seasonInfo.cycleDay}
                    <Text style={styles.cycleDayMax}>/{seasonInfo.cycleLength}</Text>
                  </Text>
                </View>
              </View>

              <Text style={styles.seasonTagline}>{season.tagline}</Text>

              <View style={styles.energyRow}>
                {season.energy.map((e) => (
                  <View key={e} style={[styles.energyPill, { borderColor: season.textAccent + '50' }]}>
                    <Text style={[styles.energyText, { color: season.textAccent }]}>{e}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.seasonInfoBox}>
                <View style={styles.seasonInfoRow}>
                  <Icon name="zap" size={17} color="rgba(255,255,255,0.7)" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.siLabel}>TODAY'S POWER</Text>
                    <Text style={styles.siValue}>{season.power}</Text>
                  </View>
                </View>
                <View style={[styles.seasonInfoRow, styles.siRowBorder]}>
                  <Icon name="flower" size={17} color="rgba(255,255,255,0.7)" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.siLabel}>SELF-CARE</Text>
                    <Text style={styles.siValue}>{season.selfCare}</Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.affirmation, { color: season.textAccent }]}>
                {season.affirmation}
              </Text>
            </LinearGradient>
          )}

          {/* ── Fertile window ─────────────────────────────────────────────── */}
          {prediction?.fertile_window_start && (
            <Card style={styles.fertileCard}>
              <View style={styles.fertileHeader}>
                <Icon name="leaf" size={18} color={Colors.forest} />
                <Text style={styles.fertileTitle}>Fertile Window</Text>
              </View>
              <Text style={styles.fertileDate}>
                {formatDisplayDate(prediction.fertile_window_start)} – {formatDisplayDate(prediction.fertile_window_end!)}
              </Text>
            </Card>
          )}

          {/* ── Quick Log ──────────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Quick Log</Text>
          <View style={styles.quickRow}>
            {([
              { icon: 'droplets', label: 'Log Period', route: '/(tabs)/track/log-period' },
              { icon: 'activity', label: 'Symptoms', route: '/(tabs)/track/log-symptoms' },
              { icon: 'clipboard-list', label: 'Health Log', route: '/(tabs)/track/log-health' },
            ] as { icon: IconName; label: string; route: string }[]).map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => router.push(item.route as any)}
                style={styles.quickBtn}
                activeOpacity={0.8}
              >
                <Icon name={item.icon} size={28} color={Colors.cherry} />
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Recent alerts ──────────────────────────────────────────────── */}
          {alerts.filter((a) => !a.is_read).slice(0, 3).map((alert) => (
            <View key={alert.id} style={[
              styles.alertBanner,
              alert.severity === 'emergency' && styles.alertEmergency,
            ]}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              {alert.body && <Text style={styles.alertBody} numberOfLines={2}>{alert.body}</Text>}
            </View>
          ))}

          {/* ── No data CTA ─────────────────────────────────────────────────── */}
          {cycleLogs.length === 0 && (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Icon name="calendar" size={48} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Start tracking your cycle</Text>
              <Text style={styles.emptySub}>
                Log your first period to get personalized predictions and insights
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/track/log-period' as any)}
                style={styles.emptyBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyBtnText}>Log first period</Text>
              </TouchableOpacity>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  // Hero — web: linear-gradient(135deg, #390517 0%, #03110D 100%)
  hero: { padding: Spacing.xl, paddingTop: Spacing.lg },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  headerLogo: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  greeting: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold,
    fontFamily: 'Jost_600SemiBold', color: Colors.white,
  },
  heroDate: { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  bellBtn: { position: 'relative', padding: Spacing.xs },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: Colors.whiskey, borderRadius: 99,
    width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold },

  // Prediction card in hero
  predCard: {
    backgroundColor: 'rgba(163,133,96,0.12)',
    borderRadius: 16, padding: Spacing.md, marginTop: Spacing.lg,
    borderWidth: 1, borderColor: 'rgba(163,133,96,0.2)',
  },
  predLabel: { fontSize: FontSize.sm, fontFamily: 'Jost_500Medium', color: Colors.whiskey, marginBottom: 4 },
  predValue: { fontSize: FontSize.display, fontWeight: FontWeight.bold, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.white, lineHeight: 44 },
  predSub: { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  predMetaRow: {
    flexDirection: 'row', marginTop: Spacing.md, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: 'rgba(163,133,96,0.2)',
  },
  predMeta: { flex: 1 },
  predMetaDivider: { width: 1, backgroundColor: 'rgba(163,133,96,0.2)', marginHorizontal: Spacing.sm },
  predMetaLabel: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: 'rgba(255,255,255,0.5)' },
  predMetaValue: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', color: Colors.white, marginTop: 2 },

  content: { padding: Spacing.md, gap: Spacing.md },

  // Inner Seasons
  seasonCard: { borderRadius: 20, padding: Spacing.lg, overflow: 'hidden' },
  seasonTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  seasonLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  seasonName: { fontSize: FontSize.xl, fontFamily: 'CormorantGaramond_600SemiBold', fontWeight: FontWeight.semibold, letterSpacing: 0.5 },
  seasonPhase: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  cycleDayBox: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, alignItems: 'flex-end',
  },
  cycleDayLabel: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: 'rgba(255,255,255,0.45)' },
  cycleDayValue: { fontSize: FontSize.xl, fontFamily: 'Jost_600SemiBold', fontWeight: FontWeight.bold },
  cycleDayMax: { fontSize: FontSize.xs, opacity: 0.55 },
  seasonTagline: { fontSize: FontSize.sm, fontFamily: 'Jost_500Medium', color: 'rgba(255,255,255,0.75)', marginBottom: Spacing.md },
  energyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  energyPill: {
    borderRadius: 99, paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.07)',
  },
  energyText: { fontSize: FontSize.xs, fontFamily: 'Jost_500Medium', fontWeight: FontWeight.medium },
  seasonInfoBox: {
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  seasonInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  siRowBorder: { paddingTop: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
  siLabel: { fontSize: 9, fontFamily: 'Jost_600SemiBold', color: 'rgba(255,255,255,0.35)', letterSpacing: 0.8, marginBottom: 2 },
  siValue: { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
  affirmation: { fontSize: FontSize.sm, fontFamily: 'CormorantGaramond_600SemiBold_Italic', opacity: 0.85 },

  // Fertile window — forest green tint
  fertileCard: { backgroundColor: Colors.forestLighter, borderColor: 'rgba(22,48,43,0.25)' },
  fertileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  fertileTitle: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', fontWeight: FontWeight.bold, color: Colors.forest },
  fertileDate: { fontSize: FontSize.lg, fontFamily: 'Jost_500Medium', fontWeight: FontWeight.semibold, color: Colors.forest, marginTop: 4 },

  // Section title
  sectionTitle: {
    fontSize: FontSize.lg, fontFamily: 'CormorantGaramond_600SemiBold',
    fontWeight: FontWeight.semibold, color: Colors.textPrimary, letterSpacing: 0.02,
  },

  // Quick Log
  quickRow: { flexDirection: 'row', gap: Spacing.sm },
  quickBtn: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16,
    padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  quickLabel: {
    fontSize: FontSize.xs, fontFamily: 'Jost_600SemiBold',
    fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs,
  },

  // Alert banners
  alertBanner: {
    backgroundColor: Colors.whiskeyLighter,
    borderRadius: 16, padding: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(163,133,96,0.3)',
  },
  alertEmergency: { backgroundColor: Colors.cherryLighter, borderColor: 'rgba(57,5,23,0.2)' },
  alertTitle: { fontSize: FontSize.sm, fontFamily: 'Jost_600SemiBold', fontWeight: FontWeight.semibold, color: Colors.whiskeyDark },
  alertBody: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: Colors.whiskeyDark, marginTop: 2, opacity: 0.8 },

  // Empty CTA
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyIconWrap: { marginBottom: Spacing.md },
  emptyTitle: {
    fontSize: FontSize.lg, fontFamily: 'CormorantGaramond_600SemiBold',
    fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.xs,
  },
  emptySub: {
    fontSize: FontSize.sm, fontFamily: 'Jost_400Regular',
    color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.lg, lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: Colors.cherry, borderRadius: 99,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
  },
  emptyBtnText: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', fontWeight: FontWeight.semibold, color: Colors.white },
});
