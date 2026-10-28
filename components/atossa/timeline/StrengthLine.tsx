// "Strongest number, by week": the highest 0–10 she gave in each week as one line over the weeks,
// with the peak week labelled. Only her numbers, no direction word, no arrow, no comparison; the
// card's spoken label lists every point so the chart adds nothing a screen reader cannot get.
import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { colors, fonts, space } from '../../../constants/atossaUI';
import { formatShortDate } from '../../../lib/records/format';
import type { WeekBucket } from '../../../lib/records/patterns';
import { Card, Txt } from '../kit';

const H = 96;
const TOP = 14;
const BOTTOM = 8;
const LEFT = 18;

/** Spoken equivalent: every week that has a number. */
export function strengthLineLabel(weeks: WeekBucket[]): string {
  const pts = weeks.filter((w) => w.peak != null);
  if (!pts.length) return 'No numbers given in these weeks.';
  return `Strongest number each week, out of 10. ${pts.map((w) => `Week of ${formatShortDate(w.from, 'always')}, ${w.peak}`).join('; ')}.`;
}

export function StrengthLine({ weeks }: { weeks: WeekBucket[] }) {
  const [w, setW] = useState(0);
  const pts = weeks.map((x, i) => ({ i, peak: x.peak, from: x.from }));
  const given = pts.filter((p): p is { i: number; peak: number; from: string } => p.peak != null);
  if (given.length < 2) return null;
  const hi = given.reduce((a, b) => (b.peak > a.peak ? b : a));
  const x = (i: number) => LEFT + (weeks.length === 1 ? 0 : (i / (weeks.length - 1)) * Math.max(0, w - LEFT - 8));
  const y = (v: number) => TOP + (1 - v / 10) * (H - TOP - BOTTOM);
  return (
    <Card>
      <View accessible accessibilityLabel={strengthLineLabel(weeks)}>
      <Txt variant="groupLabel">Strongest number, by week</Txt>
      <View aria-hidden style={{ marginTop: space.sm }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w > 0 ? (
          <Svg width={w} height={H}>
            {[0, 5, 10].map((g) => (
              <React.Fragment key={g}>
                <Line x1={LEFT} x2={w} y1={y(g)} y2={y(g)} stroke={colors.hairline} strokeWidth={1} />
                <SvgText x={0} y={y(g) + 3} fontSize={10} fontFamily={fonts.regular} fill={colors.ink3}>{String(g)}</SvgText>
              </React.Fragment>
            ))}
            <Polyline
              points={given.map((p) => `${x(p.i)},${y(p.peak)}`).join(' ')}
              fill="none" stroke={colors.plum} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
            />
            {given.map((p) => (
              <Circle key={p.from} cx={x(p.i)} cy={y(p.peak)} r={p === hi ? 5 : 3} fill={p === hi ? colors.ink : colors.plum} />
            ))}
            <SvgText
              x={Math.min(Math.max(x(hi.i), LEFT + 34), w - 34)} y={Math.max(10, y(hi.peak) - 9)} fontSize={11}
              fontFamily={fonts.semibold} fill={colors.ink} textAnchor="middle"
            >
              {`${hi.peak}/10`}
            </SvgText>
          </Svg>
        ) : <View style={{ height: H }} />}
      </View>
      <Txt variant="caption" style={{ marginTop: space.xs }}>{`Highest number you gave in each week. Peak: ${hi.peak}/10, week of ${formatShortDate(hi.from, 'always')}.`}</Txt>
      </View>
    </Card>
  );
}
