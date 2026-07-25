import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Defs, RadialGradient, LinearGradient as SvgLinearGradient,
  Stop, Circle, Path, G, Line,
} from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withTiming, Easing, interpolate,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  size?: number;
  /** [outer, mid, inner] rose-family gradient stops */
  gradient: [string, string, string];
  /** deep accent used for the progress arc + glow */
  accent: string;
  /** 0..1 — fills the progress arc from the top */
  progress?: number;
  topLabel: string;
  value: string;
  subLabel: string;
  ticks?: number;
}

/**
 * A glossy, floating 3D "cycle tracker" sphere rendered with react-native-svg.
 * - rotating outer halo glow
 * - static tick ring (cycle days) + progress arc
 * - breathing specular sphere with soft drop shadow
 */
export function CycleTrackerOrb({
  size = 260,
  gradient,
  accent,
  progress = 0,
  topLabel,
  value,
  subLabel,
  ticks = 28,
}: Props) {
  const CX = size / 2;
  const CY = size / 2;
  const R = size * 0.40;
  const HALO = size * 0.62;
  const [c1, c2, c3] = gradient;

  const breathe = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    spin.value = withRepeat(
      withTiming(1, { duration: 38000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));
  const sphereStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.03]) }],
  }));

  const arcR = R;
  const circ = 2 * Math.PI * arcR;
  const clamped = Math.max(0, Math.min(1, progress));
  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: circ * (1 - clamped),
  }));

  const tickEls = Array.from({ length: ticks }, (_, i) => {
    const ang = (i / ticks) * 2 * Math.PI - Math.PI / 2;
    const r1 = R + size * 0.05;
    const r2 = R + size * 0.082;
    const major = i % 7 === 0;
    return {
      key: i,
      x1: CX + Math.cos(ang) * r1,
      y1: CY + Math.sin(ang) * r1,
      x2: CX + Math.cos(ang) * (major ? r2 + size * 0.012 : r2),
      y2: CY + Math.sin(ang) * (major ? r2 + size * 0.012 : r2),
      major,
    };
  });

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* ── Rotating halo glow ── */}
      <Animated.View
        style={[styles.absFill, haloStyle]}
        pointerEvents="none"
      >
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={c1} stopOpacity={0.0} />
              <Stop offset="62%" stopColor={c2} stopOpacity={0.32} />
              <Stop offset="82%" stopColor={c1} stopOpacity={0.5} />
              <Stop offset="100%" stopColor={c3} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={CX} cy={CY} r={HALO} fill="url(#halo)" />
        </Svg>
      </Animated.View>

      {/* ── Tick ring + progress arc (static) ── */}
      <Svg width={size} height={size} style={styles.absFill}>
        <Defs>
          <SvgLinearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={c1} />
            <Stop offset="100%" stopColor={accent} />
          </SvgLinearGradient>
        </Defs>

        {tickEls.map((t) => (
          <Line
            key={t.key}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.major ? accent : c1}
            strokeOpacity={t.major ? 0.9 : 0.5}
            strokeWidth={t.major ? 2.4 : 1.4}
            strokeLinecap="round"
          />
        ))}

        {/* track */}
        <Circle
          cx={CX}
          cy={CY}
          r={arcR}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.55}
          strokeWidth={size * 0.03}
        />
        {/* progress */}
        <G rotation={-90} origin={`${CX}, ${CY}`}>
          <AnimatedCircle
            cx={CX}
            cy={CY}
            r={arcR}
            fill="none"
            stroke="url(#arc)"
            strokeWidth={size * 0.032}
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            animatedProps={arcProps}
          />
        </G>
      </Svg>

      {/* ── Glossy breathing sphere ── */}
      <Animated.View style={[styles.sphereWrap, { width: size * 0.74, height: size * 0.74, borderRadius: size * 0.37 }, sphereStyle]} pointerEvents="none">
        <Svg width={size * 0.74} height={size * 0.74}>
          <Defs>
            <RadialGradient id="body" cx="38%" cy="32%" r="75%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.98} />
              <Stop offset="34%" stopColor={c2} stopOpacity={0.95} />
              <Stop offset="78%" stopColor={c1} stopOpacity={1} />
              <Stop offset="100%" stopColor={c3} stopOpacity={1} />
            </RadialGradient>
            <RadialGradient id="specular" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="rim" cx="50%" cy="50%" r="50%">
              <Stop offset="78%" stopColor={accent} stopOpacity={0} />
              <Stop offset="100%" stopColor={accent} stopOpacity={0.35} />
            </RadialGradient>
          </Defs>
          {(() => {
            const s = size * 0.74;
            const r = s / 2;
            return (
              <>
                <Circle cx={r} cy={r} r={r} fill="url(#body)" />
                <Circle cx={r} cy={r} r={r} fill="url(#rim)" />
                {/* top-left highlight */}
                <Circle cx={s * 0.34} cy={s * 0.26} r={s * 0.18} fill="url(#specular)" />
                {/* small sharp glint */}
                <Circle cx={s * 0.30} cy={s * 0.22} r={s * 0.05} fill="#FFFFFF" opacity={0.9} />
              </>
            );
          })()}
        </Svg>
      </Animated.View>

      {/* ── Center text ── */}
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.top, { color: accent }]} numberOfLines={1}>
          {topLabel}
        </Text>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        <Text style={[styles.sub, { color: accent }]} numberOfLines={1}>
          {subLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  absFill: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  sphereWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#7A2E45',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 26,
    elevation: 14,
  },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  top: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginBottom: 2,
    textShadowColor: 'rgba(255,255,255,0.7)',
    textShadowRadius: 4,
  },
  value: {
    fontSize: 46,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(122,46,69,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  sub: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    textShadowColor: 'rgba(255,255,255,0.7)',
    textShadowRadius: 4,
  },
});
