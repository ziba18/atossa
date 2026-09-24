import React, { useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Polyline, Circle } from 'react-native-svg';
import { UI } from '../../constants/atossaUI';
import { Txt } from './kit';

const C = UI.colors;
const HEIGHT = 170;
const PAD = 12;

/** Pain scores (0–10) in the order given, evenly spaced. Text summary is rendered by the caller. */
export function PainChart({ scores, accessibilityLabel }: { scores: number[]; accessibilityLabel: string }) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const innerW = Math.max(0, width - PAD * 2);
  const innerH = HEIGHT - PAD * 2;
  const x = (i: number) => (scores.length === 1 ? PAD + innerW / 2 : PAD + (i * innerW) / (scores.length - 1));
  const y = (score: number) => PAD + innerH - (score / 10) * innerH;
  const points = scores.map((s, i) => `${x(i)},${y(s)}`).join(' ');

  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={styles.axis}>
        {[10, 5, 0].map((n) => <Txt key={n} variant="tiny">{n}</Txt>)}
      </View>
      <View style={{ flex: 1, height: HEIGHT }} onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        {width > 0 && (
          <Svg width={width} height={HEIGHT}>
            {[0, 5, 10].map((n) => (
              <Line key={n} x1={PAD} x2={PAD + innerW} y1={y(n)} y2={y(n)} stroke={C.border} strokeWidth={1} />
            ))}
            {scores.length > 1 && (
              <Polyline points={points} fill="none" stroke={C.primaryStrong} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            )}
            {scores.map((s, i) => (
              <Circle key={i} cx={x(i)} cy={y(s)} r={6} fill={C.card} stroke={C.primaryStrong} strokeWidth={3.5} />
            ))}
          </Svg>
        )}
      </View>
    </View>
  );
}

export function WeeklyBars({ weeks }: { weeks: { label: string; count: number }[] }) {
  return (
    <View style={{ gap: 16 }}>
      {weeks.map((w) => (
        <View key={w.label}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt variant="bodyBold">{w.label}</Txt>
            <Txt variant="body">{w.count} {w.count === 1 ? 'day' : 'days'}</Txt>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.min(100, (w.count / 7) * 100)}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  axis: { width: 26, height: HEIGHT, justifyContent: 'space-between', paddingVertical: PAD - 8 },
  track: { marginTop: 8, height: 24, borderRadius: 4, backgroundColor: C.muted, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: C.secondaryForeground },
});
