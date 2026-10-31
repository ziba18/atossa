// 91 days as a compact calendar grid for the Doctor first card: one column per week (Monday first), one row per
// weekday, one small square per day. A day with a note is filled on the severity ramp; bleeding is a clay line under
// the square (shape, not tint). The squares carry no digits (too small): the numbers sit above in the card, and the
// grid is described once to a screen reader. Same data as the PDF strip (HeatStripModel).
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { DOC_COLORS, docSeverity, type HeatStripModel } from '../../../lib/records/summary';

const dow = (key: string) => (new Date(`${key}T12:00:00`).getDay() + 6) % 7; // Monday = 0

export function WeekGrid({ strip, width }: { strip: HeatStripModel; width: number }) {
  const days = strip.days.filter((d) => !d.beforeStart);
  if (!days.length || width < 120) return null;
  const lead = dow(days[0].date);
  const cols = Math.ceil((lead + days.length) / 7);
  const gap = 3;
  const cell = Math.max(8, Math.min(18, Math.floor((width - gap * (cols - 1)) / cols)));
  const pitch = cell + gap;
  const w = cols * pitch - gap;
  const h = 7 * pitch - gap;
  const logged = days.filter((d) => d.logged).length;
  const bleed = days.filter((d) => d.bleeding).length;
  const label = `Day-by-day grid, ${strip.label}: one square per day, weeks across. ${logged} days with a note${bleed ? `, ${bleed} days with bleeding logged` : ''}.`;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label}>
      <Svg width={w} height={h}>
        {days.map((d, i) => {
          const n = lead + i;
          const x = Math.floor(n / 7) * pitch;
          const y = (n % 7) * pitch;
          if (!d.logged) {
            return (
              <React.Fragment key={d.date}>
                <Rect x={x + 0.5} y={y + 0.5} width={cell - 1} height={cell - 1} rx={3} fill="none" stroke={DOC_COLORS.hairline} strokeWidth={1} />
                {d.bleeding ? <Rect x={x} y={y + cell - 2} width={cell} height={2} fill={DOC_COLORS.clay} /> : null}
              </React.Fragment>
            );
          }
          const s = d.value != null ? docSeverity(d.value) : null;
          return (
            <React.Fragment key={d.date}>
              <Rect x={x} y={y} width={cell} height={cell} rx={3} fill={s ? s.bg : DOC_COLORS.white} stroke={DOC_COLORS.borderStrong} strokeWidth={0.6} />
              {s ? null : <Circle cx={x + cell / 2} cy={y + cell / 2} r={2} fill={DOC_COLORS.ink2} />}
              {d.bleeding ? <Rect x={x} y={y + cell - 2} width={cell} height={2} fill={DOC_COLORS.clay} /> : null}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
