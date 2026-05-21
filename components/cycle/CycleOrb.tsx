import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Path, G, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withTiming, withSpring, Easing, interpolate,
} from 'react-native-reanimated';
// Lazy-require expo-sensors so the app loads on dev clients without the
// native module. Tilt parallax silently disables; orb still breathes/rotates.
let DeviceMotion: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DeviceMotion = require('expo-sensors').DeviceMotion;
} catch {
  DeviceMotion = null;
}
import type { CycleLog, CyclePrediction } from '../../types/database';
import { Colors } from '../../constants/colors';
import { FontFamily, Spacing } from '../../constants/theme';
import { OrbDayNum, Accent, Ink } from '../../constants/typography';
import { daysBetween, today } from '../../algorithms/dateHelpers';

const W = Dimensions.get('window').width;
const SIZE = Math.min(W - 48, 380);
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE * 0.42;            // ring radius
const HALO_R = SIZE * 0.50;       // outer halo

// ── Phase palette — mirrors Aura's oklch tokens converted to sRGB hex ──────
type Phase = 'period' | 'follicular' | 'ovulation' | 'luteal';

const PHASE_GRADIENT: Record<Phase, [string, string, string]> = {
  period:     ['#E5848F', '#F2C5C9', '#E5848F'],  // phase-period → rose
  follicular: ['#BFE3C0', '#C5E5C9', '#BFE3C0'],  // matcha leaf
  ovulation:  ['#A8C9E8', '#C5DAE5', '#F2C5C9'],  // sky → rose
  luteal:     ['#EDDEC0', '#FAF4E8', '#F2C5C9'],  // cream → rose
};

const PHASE_LABEL: Record<Phase, string> = {
  period:     'Menstrual',
  follicular: 'Follicular',
  ovulation:  'Ovulation',
  luteal:     'Luteal',
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Convert an angle in degrees to (x, y) on a circle of radius r centered at (CX, CY).
function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function arcPath(r: number, start: number, end: number): string {
  const A = polar(r, start);
  const B = polar(r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${A.x} ${A.y} A ${r} ${r} 0 ${large} 1 ${B.x} ${B.y}`;
}

interface Props {
  cycleLogs:  CycleLog[];
  prediction: CyclePrediction | null;
}

export function CycleOrb({ cycleLogs, prediction }: Props) {
  // ── Derive phase / day / progress ─────────────────────────────────────────
  const data = useMemo(() => {
    const todayStr = today();
    const cycleLength = prediction?.predicted_cycle_length ?? 28;
    const sorted = [...cycleLogs].sort((a, b) => b.period_start.localeCompare(a.period_start));
    const last = sorted[0];

    let cycleDay = 1;
    if (last?.period_start) {
      cycleDay = Math.max(1, Math.min(cycleLength, daysBetween(last.period_start, todayStr) + 1));
    }

    const periodLen = last?.period_length ?? 5;
    const ovDay = Math.max(periodLen + 4, cycleLength - 14);

    let phase: Phase = 'follicular';
    if (cycleDay <= periodLen) phase = 'period';
    else if (Math.abs(cycleDay - ovDay) <= 1) phase = 'ovulation';
    else if (cycleDay < ovDay) phase = 'follicular';
    else phase = 'luteal';

    const progress = Math.min(1, cycleDay / cycleLength);
    return { phase, cycleDay, cycleLength, progress };
  }, [cycleLogs, prediction]);

  // ── DeviceMotion → subtle parallax tilt ───────────────────────────────────
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    if (!DeviceMotion) return; // native module not linked → skip tilt parallax
    let sub: { remove: () => void } | undefined;
    (async () => {
      try {
        const granted = await DeviceMotion.isAvailableAsync();
        if (!granted) return;
        DeviceMotion.setUpdateInterval(60);
        sub = DeviceMotion.addListener((m: any) => {
          if (!m.rotation) return;
          // Cap tilt so it never feels like the orb is sliding off-screen.
          tiltX.value = withSpring(Math.max(-10, Math.min(10, m.rotation.beta * 12)), {
            stiffness: 80, damping: 14,
          });
          tiltY.value = withSpring(Math.max(-10, Math.min(10, m.rotation.gamma * 12)), {
            stiffness: 80, damping: 14,
          });
        });
      } catch {
        // DeviceMotion failed to start — silently fall back to static orb.
      }
    })();
    return () => sub?.remove();
  }, []);

  // ── Continuous animations: halo spin, ring spin, breathing scale ──────────
  const haloSpin = useSharedValue(0);
  const ringSpin = useSharedValue(0);
  const breathe  = useSharedValue(0);

  useEffect(() => {
    haloSpin.value = withRepeat(withTiming(1, { duration: 40000, easing: Easing.linear }), -1, false);
    ringSpin.value = withRepeat(withTiming(1, { duration: 24000, easing: Easing.linear }), -1, false);
    breathe.value  = withRepeat(withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateX: `${-tiltY.value}deg` },
      { rotateY: `${tiltX.value}deg` },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${haloSpin.value * 360}deg` }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringSpin.value * 360}deg` }],
  }));
  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.025]) }],
  }));

  // Progress arc: dash offset based on `progress`.
  const circumference = 2 * Math.PI * (R - 6);
  const progressArcProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - data.progress),
  }));

  const [c1, c2, c3] = PHASE_GRADIENT[data.phase];

  return (
    <Animated.View style={[styles.wrapper, { width: SIZE, height: SIZE }, orbStyle]}>
      {/* ── Outer halo (rotates slowly, big blur via opacity gradient) ── */}
      <Animated.View style={[styles.halo, haloStyle]} pointerEvents="none">
        <Svg width={HALO_R * 2.4} height={HALO_R * 2.4}>
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"  stopColor={c1} stopOpacity={0.55} />
              <Stop offset="55%" stopColor={c2} stopOpacity={0.30} />
              <Stop offset="100%" stopColor={c3} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={HALO_R * 1.2} cy={HALO_R * 1.2} r={HALO_R * 1.15} fill="url(#halo)" />
        </Svg>
      </Animated.View>

      {/* ── Rotating gradient ring (4-segment conic approximation) ── */}
      <Animated.View style={[StyleSheet.absoluteFillObject, ringStyle]} pointerEvents="none">
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            {/* Two linear gradients arranged to mimic conic look. */}
            <SvgLinearGradient id="seg1" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={c1} />
              <Stop offset="100%" stopColor={c2} />
            </SvgLinearGradient>
            <SvgLinearGradient id="seg2" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={c2} />
              <Stop offset="100%" stopColor={c3} />
            </SvgLinearGradient>
            <SvgLinearGradient id="seg3" x1="1" y1="0" x2="0" y2="0">
              <Stop offset="0%" stopColor={c3} />
              <Stop offset="100%" stopColor={c1} />
            </SvgLinearGradient>
            <SvgLinearGradient id="seg4" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0%" stopColor={c1} />
              <Stop offset="100%" stopColor={c2} />
            </SvgLinearGradient>
          </Defs>
          <G>
            <Path d={arcPath(R, 0, 90)}   stroke="url(#seg1)" strokeWidth={R * 0.20} fill="none" strokeLinecap="butt" />
            <Path d={arcPath(R, 90, 180)} stroke="url(#seg2)" strokeWidth={R * 0.20} fill="none" strokeLinecap="butt" />
            <Path d={arcPath(R, 180, 270)} stroke="url(#seg3)" strokeWidth={R * 0.20} fill="none" strokeLinecap="butt" />
            <Path d={arcPath(R, 270, 360)} stroke="url(#seg4)" strokeWidth={R * 0.20} fill="none" strokeLinecap="butt" />
          </G>
        </Svg>
      </Animated.View>

      {/* ── Progress arc (static rotation, fills from 12 o'clock) ── */}
      <Svg width={SIZE} height={SIZE} style={[StyleSheet.absoluteFillObject, { transform: [{ rotate: '-90deg' }] }]}>
        <Circle cx={CX} cy={CY} r={R - 6} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
        <AnimatedCircle
          cx={CX} cy={CY} r={R - 6}
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          animatedProps={progressArcProps}
        />
      </Svg>

      {/* ── Inner glossy sphere (breathes) ── */}
      <Animated.View style={[styles.innerWrap, innerStyle]} pointerEvents="none">
        <Svg width={SIZE * 0.78} height={SIZE * 0.78}>
          <Defs>
            <RadialGradient id="sphere" cx="38%" cy="30%" r="70%">
              <Stop offset="0%"  stopColor="#FFFFFF" stopOpacity={0.95} />
              <Stop offset="55%" stopColor="#FFFFFF" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.15} />
            </RadialGradient>
            <RadialGradient id="specular" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"  stopColor="#FFFFFF" stopOpacity={0.95} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="bottomGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"  stopColor={c2} stopOpacity={0.7} />
              <Stop offset="100%" stopColor={c2} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={SIZE * 0.39} cy={SIZE * 0.39} r={SIZE * 0.39} fill="url(#sphere)" />
          {/* Top-left specular highlight */}
          <Circle cx={SIZE * 0.24} cy={SIZE * 0.18} r={SIZE * 0.14} fill="url(#specular)" />
          {/* Bottom-right warm glow (subtle tint from current phase) */}
          <Circle cx={SIZE * 0.55} cy={SIZE * 0.58} r={SIZE * 0.18} fill="url(#bottomGlow)" />
        </Svg>
      </Animated.View>

      {/* ── Center text content ── */}
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.day}>DAY</Text>
        <Text style={styles.dayNum}>{data.cycleDay}</Text>
        <Text style={styles.phase}>{PHASE_LABEL[data.phase]}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  halo: {
    position: 'absolute',
    top: -SIZE * 0.20, left: -SIZE * 0.20,
    width: SIZE * 1.4, height: SIZE * 1.4,
    alignItems: 'center', justifyContent: 'center',
  },
  innerWrap: {
    position: 'absolute',
    top: SIZE * 0.11, left: SIZE * 0.11,
    width: SIZE * 0.78, height: SIZE * 0.78,
    borderRadius: SIZE * 0.39,
    backgroundColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
    // Soft shadow under the orb to make it feel like it's floating.
    shadowColor: '#3F2F4A',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    fontSize: 10,
    fontFamily: 'Fraunces_300Light',
    color: Ink.muted,
    letterSpacing: 2.8,
    marginBottom: -2,
  },
  dayNum: { ...OrbDayNum },
  phase: {
    marginTop: 4,
    fontSize: 20,
    fontFamily: 'Fraunces_400Regular_Italic',
    color: Accent.cycle.deep,
    letterSpacing: -0.2,
  },
});
