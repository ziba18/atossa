import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, PanResponder,
} from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import type { CycleLog, CyclePrediction } from '../../types/database';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { Spacing } from '../../constants/theme';
import { daysBetween, today } from '../../algorithms/dateHelpers';

// ── Layout ────────────────────────────────────────────────────────────────────
const W     = Dimensions.get('window').width;
const SIZE  = Math.min(W - 40, 310);
const CX    = SIZE / 2;
const CY    = SIZE / 2;
const R     = SIZE * 0.40;
const THICK = SIZE * 0.092;
const GAP   = 3.2;

// ── Phase colors — warm rose palette ─────────────────────────────────────────
const C = {
  period:     { solid: '#B0455A', faded: 'rgba(176,69,90,0.26)' },
  follicular: { solid: '#B5C8B5', faded: 'rgba(181,200,181,0.30)' },
  fertile:    { solid: '#8FA88E', faded: 'rgba(143,168,142,0.26)' },
  ovulation:  { solid: '#D4A65C', faded: 'rgba(212,166,92,0.30)' },
  luteal:     { solid: '#A89AB5', faded: 'rgba(168,154,181,0.28)' },
} as const;

type Phase = keyof typeof C;

const PHASE_LABEL: Record<Phase, string> = {
  period: 'Menstrual', follicular: 'Follicular',
  fertile: 'Fertile', ovulation: 'Ovulation', luteal: 'Luteal',
};
const PHASE_TEXT_COLOR_LIGHT: Record<Phase, string> = {
  period: C.period.solid,
  follicular: '#6B8B6A',           // deepened so it reads as text
  fertile: C.fertile.solid,
  ovulation: '#8B6A2A',            // deep honey for legibility
  luteal: '#7C6E89',               // deep mauve
};

// ── Geometry ─────────────────────────────────────────────────────────────────
function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function arcPath(r: number, s: number, e: number): string {
  const span = e - s;
  if (span <= 0) return '';
  const A = polar(r, s), B = polar(r, span >= 360 ? s + 359.99 : e);
  return `M ${A.x} ${A.y} A ${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${B.x} ${B.y}`;
}

function classifyDay(day: number, menEnd: number, ovDay: number): Phase {
  if (day <= menEnd) return 'period';
  if (day === ovDay) return 'ovulation';
  if (day >= ovDay - 4 && day <= ovDay + 1) return 'fertile';
  if (day > ovDay + 1) return 'luteal';
  return 'follicular';
}

// ── Drag helpers (work on raw numbers, not state) ─────────────────────────────
function touchToDay(x: number, y: number, total: number): number {
  const dx = x - CX, dy = y - CY;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (angle < 0) angle += 360;
  if (angle >= 360) angle -= 360;
  return Math.min(Math.max(1, Math.floor((angle / 360) * total) + 1), total);
}

function isOnRing(x: number, y: number): boolean {
  const d = Math.sqrt((x - CX) ** 2 + (y - CY) ** 2);
  return d >= R - THICK / 2 - 14 && d <= R + THICK / 2 + 14;
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  cycleLogs:  CycleLog[];
  prediction: CyclePrediction | null;
  // Parent passes a setter so the wheel can disable the surrounding
  // ScrollView while the user is dragging — otherwise the page scrolls
  // when they try to spin the ring.
  onDragChange?: (isDragging: boolean) => void;
}

export function CycleRing({ cycleLogs, prediction, onDragChange }: Props) {
  const theme = useColors();
  const styles = useStyles();
  const [dragDay, setDragDay]     = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Pulse animation
  const pulseScale   = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const s = Animated.loop(Animated.sequence([
      Animated.timing(pulseScale,   { toValue: 1.8, duration: 1100, useNativeDriver: true }),
      Animated.timing(pulseScale,   { toValue: 1,   duration: 1100, useNativeDriver: true }),
    ]));
    const o = Animated.loop(Animated.sequence([
      Animated.timing(pulseOpacity, { toValue: 0.05, duration: 1100, useNativeDriver: true }),
      Animated.timing(pulseOpacity, { toValue: 0.7,  duration: 1100, useNativeDriver: true }),
    ]));
    s.start(); o.start();
    return () => { s.stop(); o.stop(); };
  }, []);

  // ── Static cycle structure (only recomputes when logs change) ─────────────
  const cycle = useMemo(() => {
    const todayStr  = today();
    const totalDays = prediction?.predicted_cycle_length ?? 28;

    const sorted = [...cycleLogs].sort((a, b) =>
      b.period_start.localeCompare(a.period_start),
    );
    const last = sorted[0];

    let cycleDay = 1;
    if (last?.period_start) {
      cycleDay = Math.min(
        Math.max(1, daysBetween(last.period_start, todayStr) + 1),
        totalDays,
      );
    }

    const menEnd = last?.period_end
      ? Math.max(1, daysBetween(last.period_start, last.period_end) + 1)
      : 5;
    const ovDay  = Math.max(menEnd + 4, totalDays - 14);

    const daysUntilNext = prediction?.next_period_start
      ? Math.max(0, daysBetween(todayStr, prediction.next_period_start))
      : Math.max(0, totalDays - cycleDay);

    const degPerDay = 360 / totalDays;
    const halfGap   = GAP / 2;

    // Geometry per day (no colors — those depend on displayDay)
    const segs = Array.from({ length: totalDays }, (_, i) => {
      const day      = i + 1;
      const startDeg = (i / totalDays) * 360;
      return {
        day,
        segStart: startDeg + halfGap,
        segEnd:   startDeg + degPerDay - halfGap,
        midDeg:   startDeg + degPerDay / 2,
        dayPhase: classifyDay(day, menEnd, ovDay),
      };
    });

    // Real "today" dot position
    const todayMidDeg = ((cycleDay - 1) / totalDays) * 360 + degPerDay / 2;

    return {
      totalDays, cycleDay, menEnd, ovDay, daysUntilNext,
      segs, todayMidDeg, degPerDay,
    };
  }, [cycleLogs, prediction]);

  // Keep a ref so PanResponder can read totalDays without stale closure
  const totalDaysRef = useRef(cycle.totalDays);
  useEffect(() => { totalDaysRef.current = cycle.totalDays; }, [cycle.totalDays]);

  // Keep an onDragChange ref so the PanResponder (created once) always sees
  // the latest callback without stale closures.
  const onDragChangeRef = useRef(onDragChange);
  useEffect(() => { onDragChangeRef.current = onDragChange; }, [onDragChange]);

  // ── PanResponder ──────────────────────────────────────────────────────────
  // Claim the gesture as early as possible (capture-phase) when the touch is
  // on the ring donut, so the parent ScrollView doesn't scroll when the user
  // starts spinning the wheel.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        return isOnRing(locationX, locationY);
      },
      onStartShouldSetPanResponderCapture: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        return isOnRing(locationX, locationY);
      },
      onMoveShouldSetPanResponder: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        return isOnRing(locationX, locationY);
      },
      onMoveShouldSetPanResponderCapture: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        return isOnRing(locationX, locationY);
      },

      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const d = touchToDay(locationX, locationY, totalDaysRef.current);
        setDragDay(d);
        setIsDragging(true);
        onDragChangeRef.current?.(true);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const d = touchToDay(locationX, locationY, totalDaysRef.current);
        setDragDay(d);
      },
      onPanResponderRelease:   () => {
        setIsDragging(false);
        setDragDay(null);
        onDragChangeRef.current?.(false);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        setDragDay(null);
        onDragChangeRef.current?.(false);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  // ── Dynamic display (recomputes when dragDay changes) ─────────────────────
  const displayDay = dragDay ?? cycle.cycleDay;

  const display = useMemo(() => {
    const { totalDays, cycleDay, menEnd, ovDay, daysUntilNext, segs, degPerDay } = cycle;

    // Color every segment relative to displayDay
    const coloredSegs = segs.map(s => ({
      ...s,
      color:    s.day <= displayDay ? C[s.dayPhase].solid : C[s.dayPhase].faded,
      isActive: s.day === displayDay,
    }));

    // Drag handle dot position
    const dragMidDeg  = ((displayDay - 1) / totalDays) * 360 + degPerDay / 2;
    const dragDotPos  = polar(R, dragMidDeg);

    // Real today dot (shown dimmed while dragging)
    const todayDotPos = polar(R, cycle.todayMidDeg);

    // Phase at displayDay
    const phase        = classifyDay(displayDay, menEnd, ovDay);
    const phaseColor   = PHASE_TEXT_COLOR_LIGHT[phase];
    const phaseLabel   = PHASE_LABEL[phase];
    const activeColor  = C[phase].solid;

    // Days relative to real today (for the "± X days" label when exploring)
    const delta = displayDay - cycleDay;

    // Days until next period from displayDay perspective
    const displayDaysLeft = Math.max(0, daysUntilNext - delta);

    return {
      coloredSegs, dragDotPos, todayDotPos,
      phase, phaseColor, phaseLabel, activeColor,
      delta, displayDaysLeft,
    };
  }, [cycle, displayDay]);

  const {
    coloredSegs, dragDotPos, todayDotPos,
    phaseColor, phaseLabel, activeColor, delta, displayDaysLeft,
  } = display;

  const deltaLabel = delta === 0 ? null
    : delta > 0 ? `+${delta}d from today` : `${delta}d from today`;

  return (
    <View style={styles.wrapper}>
      {/* Drag hint label */}
      <Text style={styles.hint}>
        {isDragging ? (deltaLabel ?? 'Today') : 'Hold & drag ring to explore'}
      </Text>

      <View
        style={{ width: SIZE, height: SIZE }}
        {...panResponder.panHandlers}
      >
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>

          {/* ── Background track ── */}
          <Circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="rgba(42,31,38,0.08)"
            strokeWidth={THICK + 4}
          />

          {/* ── Day segments ── */}
          {coloredSegs.map(seg => {
            if (!seg.isActive) {
              return (
                <Path
                  key={seg.day}
                  d={arcPath(R, seg.segStart, seg.segEnd)}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={THICK}
                  strokeLinecap="butt"
                />
              );
            }
            // Active (dragged/today) segment: white outline + slightly thicker
            return (
              <G key={seg.day}>
                <Path
                  d={arcPath(R, seg.segStart - 0.6, seg.segEnd + 0.6)}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={THICK + 6}
                  strokeLinecap="round"
                />
                <Path
                  d={arcPath(R, seg.segStart, seg.segEnd)}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={THICK + 1.5}
                  strokeLinecap="butt"
                />
              </G>
            );
          })}

          {/* ── Inner lip ── */}
          <Circle
            cx={CX} cy={CY} r={R - THICK / 2 - 1}
            fill="none"
            stroke="rgba(42,31,38,0.05)"
            strokeWidth={3}
          />

          {/* ── Centre fill ── */}
          <Circle cx={CX} cy={CY} r={R - THICK / 2 - 3} fill={theme.background} />

          {/* ── Real today anchor (shown while dragging, grey & small) ── */}
          {isDragging && (
            <>
              <Circle cx={todayDotPos.x} cy={todayDotPos.y} r={7}
                fill="#FFFFFF" />
              <Circle cx={todayDotPos.x} cy={todayDotPos.y} r={6.5}
                fill="none" stroke="rgba(42,31,38,0.40)" strokeWidth={1.5} />
              <Circle cx={todayDotPos.x} cy={todayDotPos.y} r={3}
                fill="rgba(42,31,38,0.35)" />
            </>
          )}

          {/* ── Drag / today marker dot ── */}
          <Circle cx={dragDotPos.x} cy={dragDotPos.y} r={12}
            fill="#FFFFFF" />
          <Circle cx={dragDotPos.x} cy={dragDotPos.y} r={11.5}
            fill="none" stroke={activeColor} strokeWidth={2} />
          <Circle cx={dragDotPos.x} cy={dragDotPos.y} r={6}
            fill={activeColor} />
          <Circle cx={dragDotPos.x} cy={dragDotPos.y} r={2.4}
            fill="#FFFFFF" />

        </Svg>

        {/* ── Animated pulse ring (follows drag handle) ── */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulse,
            {
              left:        dragDotPos.x - 15,
              top:         dragDotPos.y - 15,
              borderColor: activeColor,
              opacity:     isDragging ? 0.6 : pulseOpacity,
              transform:   [{ scale: isDragging ? 1.2 : pulseScale }],
            },
          ]}
        />

        {/* ── Center content ── */}
        <View style={styles.center} pointerEvents="none">
          <Text style={[styles.topLabel, isDragging && { color: activeColor }]}>
            {isDragging ? 'EXPLORING' : 'TODAY'}
          </Text>

          <Text style={[styles.dayNum, { color: theme.textPrimary }]}>
            {displayDay}
          </Text>

          <Text style={styles.dayOf}>
            of {cycle.totalDays}
          </Text>

          {/* Phase badge */}
          <View style={[
            styles.phaseBadge,
            { backgroundColor: phaseColor + '1A', borderColor: phaseColor + '55' },
          ]}>
            <View style={[styles.phaseDot, { backgroundColor: phaseColor }]} />
            <Text style={[styles.phaseName, { color: phaseColor }]}>
              {phaseLabel}
            </Text>
          </View>

          <Text style={styles.nextPeriod}>
            {displayDaysLeft === 0
              ? 'Period expected'
              : `${displayDaysLeft}d to next period`}
          </Text>
        </View>
      </View>

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDragging && { color: activeColor }]}>
            {displayDay}
          </Text>
          <Text style={styles.statLabel}>CYCLE DAY</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{cycle.totalDays}</Text>
          <Text style={styles.statLabel}>CYCLE LENGTH</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: C.period.solid }]}>
            {displayDaysLeft}
          </Text>
          <Text style={styles.statLabel}>DAYS LEFT</Text>
        </View>
      </View>
    </View>
  );
}

function useStyles() {
  const theme = useColors();
  return StyleSheet.create({
    wrapper: { alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
    hint: { fontSize: 10, fontFamily: 'Jost_400Regular', color: theme.textMuted, letterSpacing: 0.3, marginBottom: Spacing.sm },
    pulse: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 1.5 },
    center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 2 },
    topLabel: { fontSize: 9, fontFamily: 'Jost_600SemiBold', color: theme.textMuted, letterSpacing: 2.5, marginBottom: 2 },
    dayNum: { fontSize: 64, fontFamily: 'Jost_600SemiBold', lineHeight: 66, letterSpacing: -2 },
    dayOf: { fontSize: 11, fontFamily: 'Jost_400Regular', color: theme.textMuted, marginTop: -4, marginBottom: 6 },
    phaseBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    phaseDot: { width: 7, height: 7, borderRadius: 4 },
    phaseName: { fontSize: 11, fontFamily: 'Jost_600SemiBold', letterSpacing: 0.5 },
    nextPeriod: { fontSize: 10, fontFamily: 'Jost_400Regular', color: theme.textMuted, marginTop: 4 },
    statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(42,31,38,0.10)', width: '100%' },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statValue: { fontSize: 28, fontFamily: 'Jost_600SemiBold', color: theme.textPrimary, lineHeight: 30 },
    statLabel: { fontSize: 8.5, fontFamily: 'Jost_600SemiBold', color: theme.textMuted, letterSpacing: 1.2 },
    statDivider: { width: 1, height: 36, backgroundColor: 'rgba(42,31,38,0.10)' },
  });
}
