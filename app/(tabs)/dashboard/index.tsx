import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
} from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const BG     = '#1A0A2E';
const CARD   = '#1E0A3E';
const PINK   = '#C2607A';
const MATCHA = '#B5CDA3';
const BLUE   = '#A8C8E8';
const CREAM  = '#EAD9D9';
const MUTED  = '#7A5A6A';
const LPINK  = '#E8829A';

// ── Chart helpers ──────────────────────────────────────────────────────────────
function ptc(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function pieSlice(cx: number, cy: number, r: number, start: number, end: number) {
  const s = ptc(cx, cy, r, start);
  const e = ptc(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

function donutSlice(cx: number, cy: number, ro: number, ri: number, start: number, end: number) {
  const os = ptc(cx, cy, ro, start);
  const oe = ptc(cx, cy, ro, end);
  const ie = ptc(cx, cy, ri, end);
  const is_ = ptc(cx, cy, ri, start);
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${os.x} ${os.y}`,
    `A ${ro} ${ro} 0 ${large} 1 ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${ri} ${ri} 0 ${large} 0 ${is_.x} ${is_.y}`,
    'Z',
  ].join(' ');
}

// ── Line chart ─────────────────────────────────────────────────────────────────
const PAIN_DATA    = [5.2, 5.8, 6.1, 6.5, 6.8, 7.1, 7.3, 7.4];
const FATIGUE_DATA = [4.0, 4.2, 4.5, 4.6, 4.8, 5.0, 5.1, 5.2];

const L = 42, R = 305, T = 14, B = 132; // chart bounds in SVG coords
const CW = R - L, CH = B - T;
const Y_MIN = 3.5, Y_MAX = 8.0;
const N = 8;

const toX = (i: number) => L + (i / (N - 1)) * CW;
const toY = (v: number) => B - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * CH;

function linePath(data: number[]) {
  return data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
}

const Y_TICKS = [4, 5, 6, 7, 8];
const X_LABELS = ['W1','W2','W3','W4','W5','W6','W7','W8'];

function LineChart() {
  return (
    <Svg width="100%" height={160} viewBox="0 0 320 155" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {Y_TICKS.map(v => (
        <Line
          key={v}
          x1={L} y1={toY(v)} x2={R} y2={toY(v)}
          stroke={MUTED + '55'} strokeWidth={0.8}
        />
      ))}
      {/* Y labels */}
      {Y_TICKS.map(v => (
        <SvgText key={v} x={L - 6} y={toY(v) + 4} fontSize={9} fill={MUTED} textAnchor="end">
          {v}
        </SvgText>
      ))}
      {/* X labels */}
      {X_LABELS.map((lbl, i) => (
        <SvgText key={i} x={toX(i)} y={B + 14} fontSize={9} fill={MUTED} textAnchor="middle">
          {lbl}
        </SvgText>
      ))}
      {/* Fatigue line (dashed) */}
      <Path
        d={linePath(FATIGUE_DATA)}
        stroke={MATCHA}
        strokeWidth={2}
        fill="none"
        strokeDasharray="4,3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pain line (solid) */}
      <Path
        d={linePath(PAIN_DATA)}
        stroke={PINK}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End-point labels */}
      <SvgText x={toX(7) + 4} y={toY(PAIN_DATA[7]) + 4} fontSize={9} fill={PINK} fontWeight="bold">
        {PAIN_DATA[7]}
      </SvgText>
      <SvgText x={toX(7) + 4} y={toY(FATIGUE_DATA[7]) + 4} fontSize={9} fill={MATCHA}>
        {FATIGUE_DATA[7]}
      </SvgText>
      {/* Legend */}
      <G x={L} y={2}>
        <Circle cx={4} cy={5} r={4} fill={PINK} />
        <SvgText x={11} y={9} fontSize={9} fill={CREAM}>Pain</SvgText>
        <Circle cx={48} cy={5} r={4} fill={MATCHA} />
        <SvgText x={55} y={9} fontSize={9} fill={CREAM}>Fatigue</SvgText>
      </G>
    </Svg>
  );
}

// ── Pie chart ──────────────────────────────────────────────────────────────────
const PIE_SLICES = [
  { label: 'Pain',    pct: 40, color: PINK  },
  { label: 'Fatigue', pct: 25, color: LPINK },
  { label: 'Bloating',pct: 20, color: MATCHA},
  { label: 'Mood',    pct: 15, color: BLUE  },
];

function PieChart() {
  let angle = 0;
  const cx = 65, cy = 65, r = 54;
  return (
    <View>
      <Svg width={130} height={130}>
        {PIE_SLICES.map((s) => {
          const start = angle;
          const end = angle + (s.pct / 100) * 360;
          angle = end;
          return <Path key={s.label} d={pieSlice(cx, cy, r, start, end)} fill={s.color} />;
        })}
        <Circle cx={cx} cy={cy} r={28} fill={CARD} />
        <SvgText x={cx} y={cy - 4} textAnchor="middle" fontSize={8} fill={MUTED}>Top:</SvgText>
        <SvgText x={cx} y={cy + 8} textAnchor="middle" fontSize={10} fill={PINK} fontWeight="bold">Pain</SvgText>
      </Svg>
      <View style={styles.legend}>
        {PIE_SLICES.map(s => (
          <View key={s.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>{s.label} {s.pct}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Cycle donut ────────────────────────────────────────────────────────────────
const CYCLE_SLICES = [
  { label: 'Luteal',      pct: 43, color: PINK  },
  { label: 'Follicular',  pct: 29, color: BLUE  },
  { label: 'Ovulation',   pct: 14, color: MATCHA},
  { label: 'Menstrual',   pct: 14, color: LPINK },
];

const PHASE_PILLS = ['Luteal · high PMS', 'Low energy', 'HRV dip'];

function CycleDonut() {
  let angle = 0;
  const cx = 65, cy = 65;
  return (
    <View>
      <Svg width={130} height={130}>
        {CYCLE_SLICES.map((s) => {
          const start = angle;
          const end = angle + (s.pct / 100) * 360;
          angle = end;
          return <Path key={s.label} d={donutSlice(cx, cy, 54, 30, start, end)} fill={s.color} />;
        })}
        <Circle cx={cx} cy={cy} r={28} fill={CARD} />
        <SvgText x={cx} y={cy - 5} textAnchor="middle" fontSize={8} fill={MUTED}>Day 21</SvgText>
        <SvgText x={cx} y={cy + 7} textAnchor="middle" fontSize={9} fill={PINK} fontWeight="bold">Luteal</SvgText>
      </Svg>
      <View style={styles.pills}>
        {PHASE_PILLS.map(p => (
          <View key={p} style={styles.pill}>
            <Text style={styles.pillText}>{p}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Wearable stats ─────────────────────────────────────────────────────────────
const WEARABLES = [
  { label: 'HRV',   value: '38ms',  arrow: '↓', red: true  },
  { label: 'Sleep', value: '5.2h',  arrow: '↓', red: true  },
  { label: 'Temp',  value: '+0.4°', arrow: '↑', red: false },
  { label: 'RHR',   value: '78bpm', arrow: '↑', red: true  },
];

// ── Main screen ────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Health Dashboard</Text>
          <Text style={styles.sub}>8 weeks tracked · Atossa</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>REPORT READY</Text>
        </View>
      </View>

      {/* Section 1 — Line chart */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Symptom Trends · 8 Weeks</Text>
        <LineChart />
      </View>

      {/* Section 2 — Pie + Donut */}
      <View style={styles.row}>
        <View style={[styles.chartCard, { flex: 1 }]}>
          <Text style={styles.sectionTitle}>Symptom Split</Text>
          <PieChart />
        </View>
        <View style={[styles.chartCard, { flex: 1 }]}>
          <Text style={styles.sectionTitle}>Cycle Ring</Text>
          <CycleDonut />
        </View>
      </View>

      {/* Section 3 — Wearable strip */}
      <Text style={styles.sectionTitle}>Wearable Signals</Text>
      <View style={styles.wearRow}>
        {WEARABLES.map(w => (
          <View key={w.label} style={styles.wearCard}>
            <Text style={styles.wearLabel}>{w.label}</Text>
            <Text style={styles.wearValue}>{w.value}</Text>
            <Text style={[styles.wearArrow, { color: w.red ? '#E85A6A' : MATCHA }]}>
              {w.arrow}
            </Text>
          </View>
        ))}
      </View>

      {/* Section 4 — Insight card */}
      <View style={styles.insightCard}>
        <Text style={styles.insightText}>
          Pain pattern + irregular cycles consistent with PCOS flare. Sleep and HRV flagged this week. GP report ready →
        </Text>
      </View>

      {/* CTA */}
      <Pressable style={styles.ctaBtn} onPress={() => router.push('/(tabs)/report' as any)}>
        <Text style={styles.ctaText}>📤 Share with my GP</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 16, paddingTop: 4 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 8,
  },
  title: { color: CREAM, fontSize: 20, fontWeight: '700' },
  sub:   { color: MUTED, fontSize: 12, marginTop: 2 },
  badge: {
    backgroundColor: MATCHA + '22',
    borderWidth: 1, borderColor: MATCHA,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  badgeText: { color: MATCHA, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  sectionTitle: { color: CREAM, fontSize: 13, fontWeight: '600', marginBottom: 8 },

  chartCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: MUTED + '33',
  },

  row: { flexDirection: 'row', gap: 10, marginBottom: 12 },

  legend:    { marginTop: 6, gap: 3 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText:{ color: MUTED, fontSize: 9 },

  pills:    { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  pill:     {
    backgroundColor: PINK + '22',
    borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  pillText: { color: LPINK, fontSize: 8, fontWeight: '600' },

  wearRow:  { flexDirection: 'row', gap: 8, marginBottom: 14 },
  wearCard: {
    flex: 1, backgroundColor: CARD,
    borderRadius: 12, padding: 10,
    alignItems: 'center',
    borderWidth: 1, borderColor: MUTED + '33',
  },
  wearLabel: { color: MUTED, fontSize: 9, fontWeight: '600' },
  wearValue: { color: CREAM, fontSize: 14, fontWeight: '700', marginVertical: 2 },
  wearArrow: { fontSize: 16, fontWeight: '700' },

  insightCard: {
    backgroundColor: '#0A1A0A',
    borderWidth: 1, borderColor: '#4A7A3A',
    borderRadius: 14, padding: 16, marginBottom: 14,
  },
  insightText: { color: MATCHA, fontSize: 14, lineHeight: 22 },

  ctaBtn: {
    backgroundColor: PINK,
    borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 8,
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
