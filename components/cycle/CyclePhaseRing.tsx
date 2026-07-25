import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, AccessibilityInfo } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Icon, type IconName } from '../ui/Icon';
import { PHASE_LABEL, MOON_PHASE_LABEL, type PhaseBoundaries, type RingPhase } from '../../algorithms/cyclePhase';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Verdant palette — equal visual weight, distinct hues, color-blind-considerate.
const PHASE_COLOR: Record<RingPhase, { solid: string; deep: string }> = {
  menstrual:  { solid: '#8B3A3A', deep: '#6E1F1F' }, // oxblood
  follicular: { solid: '#4d6b4c', deep: '#3a4d39' }, // moss
  ovulatory:  { solid: '#d97706', deep: '#b45309' }, // amber
  luteal:     { solid: '#7A6A99', deep: '#5B4B73' }, // plum
};

const PHASE_ORDER: RingPhase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];
const PHASE_ICON: Record<RingPhase, IconName> = {
  menstrual: 'droplet', follicular: 'leaf', ovulatory: 'potion', luteal: 'moon',
};

function plural(n: number) {
  return n === 1 ? 'day' : 'days';
}

// Only replay the sweep-in animation once per calendar day, per app session —
// the screen remounts on every navigation, but it shouldn't look "fresh" each time.
const sweepShownDates = new Set<string>();

interface Props {
  cycleDay: number;
  cycleLength: number;
  periodLength: number;
  phaseBoundaries: PhaseBoundaries;
  isIrregular: boolean;
  todayLogged: boolean;
  hasData?: boolean;
  daysUntilNextPeriod?: number;
  accessibilityLabel?: string;
  size?: number;
  onPressCenter?: () => void;
}

export function CyclePhaseRing({
  cycleDay,
  cycleLength,
  periodLength,
  phaseBoundaries,
  isIrregular,
  todayLogged,
  hasData = true,
  daysUntilNextPeriod,
  accessibilityLabel,
  size = 240,
  onPressCenter,
}: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduceMotion).catch(() => {});
  }, []);

  const clampedDay = Math.max(1, Math.min(cycleLength, cycleDay));

  // ── Geometry ──────────────────────────────────────────────────────────────
  const CX = size / 2;
  const CY = size / 2;
  const R = size * 0.38;
  const THICK = size * 0.11;
  const GAP = 2.2; // between the 4 phase arcs only

  const polar = (r: number, deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  };
  const arcPath = (r: number, s: number, e: number) => {
    const span = e - s;
    if (span <= 0) return '';
    const A = polar(r, s);
    const B = polar(r, span >= 360 ? s + 359.99 : e);
    return `M ${A.x} ${A.y} A ${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${B.x} ${B.y}`;
  };
  const degForDay = (day: number) => ((day - 1) / cycleLength) * 360;

  // ── Mount sweep-in (once per day per session, skipped under Reduce Motion) ─
  const todayKey = `${cycleLength}-${clampedDay}-${Math.floor(Date.now() / 86400000)}`;
  const alreadyShownToday = sweepShownDates.has(todayKey);
  const sweep = useRef(new Animated.Value(reduceMotion || alreadyShownToday ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion || alreadyShownToday) {
      sweep.setValue(1);
      return;
    }
    Animated.timing(sweep, { toValue: 1, duration: 550, useNativeDriver: false }).start();
    sweepShownDates.add(todayKey);
  }, [todayKey, reduceMotion]);

  // ── Subtle today-marker pulse (slow, low-amplitude, never urgent) ─────────
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const s = Animated.loop(Animated.sequence([
      Animated.timing(pulseScale, { toValue: 1.35, duration: 2000, useNativeDriver: true }),
      Animated.timing(pulseScale, { toValue: 1, duration: 2000, useNativeDriver: true }),
    ]));
    const o = Animated.loop(Animated.sequence([
      Animated.timing(pulseOpacity, { toValue: 0.05, duration: 2000, useNativeDriver: true }),
      Animated.timing(pulseOpacity, { toValue: 0.35, duration: 2000, useNativeDriver: true }),
    ]));
    s.start(); o.start();
    return () => { s.stop(); o.stop(); };
  }, [reduceMotion]);

  // ── Save flash: briefly highlight today's segment when a log lands ───────
  const flash = useRef(new Animated.Value(0)).current;
  const prevLogged = useRef(todayLogged);
  useEffect(() => {
    if (!prevLogged.current && todayLogged) {
      flash.setValue(1);
      Animated.timing(flash, { toValue: 0, duration: reduceMotion ? 1 : 900, useNativeDriver: false }).start();
    }
    prevLogged.current = todayLogged;
  }, [todayLogged]);

  const phase = PHASE_ORDER.find((p) => clampedDay >= phaseBoundaries[p].start && clampedDay <= phaseBoundaries[p].end) ?? 'follicular';
  const markerDeg = degForDay(clampedDay) + (360 / cycleLength) / 2;
  const markerPos = polar(R, markerDeg);

  const countdownLabel = (() => {
    const left = daysUntilNextPeriod ?? Math.max(0, cycleLength - clampedDay + 1);
    if (phase === 'ovulatory') return isIrregular ? 'Estimated fertile window' : 'Fertile window';
    if (left === 0) return 'Period expected today';
    const prefix = isIrregular ? 'Estimated ' : '';
    return `${prefix}${left} ${plural(left)} until next period`;
  })();

  if (!hasData) {
    return (
      <Pressable
        onPress={onPressCenter}
        style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
        accessibilityRole="button"
        accessibilityLabel="No cycle data yet. Tap to log your first period."
      >
        <Svg width={size} height={size}>
          <Circle cx={CX} cy={CY} r={R} stroke="rgba(26,21,18,0.10)" strokeWidth={THICK} fill="none" />
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.placeholderTitle}>Track your cycle</Text>
          <Text style={styles.countdown}>Log your first period to see your cycle</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        accessible
        accessibilityLabel={accessibilityLabel ?? `Day ${clampedDay} of ${cycleLength}, ${PHASE_LABEL[phase]} phase`}
      >
        {PHASE_ORDER.map((p) => {
          const b = phaseBoundaries[p];
          const halfGap = GAP / 2;
          const segStart = degForDay(b.start) + halfGap;
          const segEndFull = degForDay(b.end + 1) - halfGap;
          const confirmedEndDay = Math.min(b.end, clampedDay);
          const hasConfirmed = clampedDay >= b.start;
          const confirmedEndDeg = hasConfirmed ? degForDay(confirmedEndDay + 1) - (confirmedEndDay >= b.end ? halfGap : 0) : segStart;
          const hasPredicted = b.end > clampedDay;
          const predictedStartDeg = hasPredicted ? Math.max(confirmedEndDeg, degForDay(Math.max(b.start, clampedDay + 1))) : segStart;

          return (
            <React.Fragment key={p}>
              {hasConfirmed && (
                <AnimatedPath
                  d={arcPath(R, segStart, confirmedEndDeg)}
                  stroke={PHASE_COLOR[p].solid}
                  strokeWidth={THICK}
                  strokeLinecap="butt"
                  fill="none"
                  strokeOpacity={sweep}
                />
              )}
              {hasPredicted && (
                <AnimatedPath
                  d={arcPath(R, predictedStartDeg, segEndFull)}
                  stroke={PHASE_COLOR[p].solid}
                  strokeWidth={THICK}
                  strokeDasharray={`${THICK * 0.45} ${THICK * 0.4}`}
                  strokeLinecap="butt"
                  fill="none"
                  strokeOpacity={Animated.multiply(sweep, 0.4)}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Today marker — highest-contrast element on the ring */}
        <AnimatedCircle cx={markerPos.x} cy={markerPos.y} r={12} fill="#FFFFFF" opacity={sweep} />
        <AnimatedCircle cx={markerPos.x} cy={markerPos.y} r={11} fill="none" stroke={PHASE_COLOR[phase].deep} strokeWidth={2.5} opacity={sweep} />
        <AnimatedCircle cx={markerPos.x} cy={markerPos.y} r={5.5} fill={PHASE_COLOR[phase].deep} opacity={sweep} />

        {/* Save-confirmation flash on today's segment */}
        <AnimatedCircle cx={markerPos.x} cy={markerPos.y} r={20} fill="none" stroke={PHASE_COLOR[phase].solid} strokeWidth={3} opacity={flash} />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.pulse,
          {
            left: markerPos.x - 16,
            top: markerPos.y - 16,
            borderColor: PHASE_COLOR[phase].deep,
            opacity: pulseOpacity,
            transform: [{ scale: pulseScale }],
          },
        ]}
      />

      <Pressable
        onPress={onPressCenter}
        style={styles.center}
        accessibilityRole="button"
        accessibilityLabel={(accessibilityLabel ?? `Day ${clampedDay} of ${cycleLength}, ${PHASE_LABEL[phase]} phase`) + '. Double tap to log today.'}
        hitSlop={8}
      >
        <Icon name={PHASE_ICON[phase] ?? 'droplet'} size={18} color={PHASE_COLOR[phase].deep} />
        <Text style={styles.dayNum}>{`Day ${clampedDay}`}</Text>
        <Text style={[styles.phaseLabel, { color: PHASE_COLOR[phase].deep }]}>{PHASE_LABEL[phase]} Phase</Text>
        <Text style={styles.moonPhase}>{MOON_PHASE_LABEL[phase]}</Text>
        <Text style={styles.countdown}>{countdownLabel}</Text>
        {!todayLogged && <Text style={styles.logHint}>Tap to log today</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pulse: { position: 'absolute', width: 32, height: 32, borderRadius: 16, borderWidth: 1.5 },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 24,
    minWidth: 44, minHeight: 44,
  },
  dayNum: { color: '#1c1e1c', fontSize: 19, fontWeight: '800', marginTop: 2 },
  phaseLabel: { fontSize: 13, fontWeight: '700' },
  moonPhase: { color: '#7a6e60', fontSize: 10.5, fontFamily: 'Fraunces_400Regular_Italic', marginTop: 1 },
  placeholderTitle: { color: '#1c1e1c', fontSize: 16, fontWeight: '800' },
  countdown: { color: '#7a6e60', fontSize: 11.5, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  logHint: { color: '#3a4d39', fontSize: 10.5, fontWeight: '700', marginTop: 6 },
});
