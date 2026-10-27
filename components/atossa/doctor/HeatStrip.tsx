// Day-by-day strip for the doctor document (on screen; the PDF draws the same thing in
// lib/records/summary.ts stripSvg). Each day with a note is one severity-ramp cell with Sam's
// highest number inside (a dot when she gave no number). Blank = nothing logged. Bleeding is a
// continuous solid clay underline per run of days; spotting a thin dashed clay underline — told
// apart by shape, never a tint (a tint prints the same grey as a low-strength cell in B/W).
//   'page'  — 31 days per row, mirrors the A4 page.
//   'weeks' — the readable sizes (full-size preview, Show on screen): one row per week across the
//             full width, and runs of weeks with nothing logged collapse into one line
//             ("No entries 3–16 Aug"). A bleeding/spotting day with no note gets a faint empty
//             cell outline, so its underline clearly belongs to that row.
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { fonts } from '../../../constants/atossaUI';
import { formatRange, formatShortDate } from '../../../lib/records/format';
import {
  DOC_COLORS, PAGE_TYPE, SPOT_DASH, SPOT_STROKE, bleedRuns, docSeverity, stripRows, type HeatDay, type HeatStripModel,
} from '../../../lib/records/summary';
import { Txt } from '../kit';

const C = DOC_COLORS;

interface Geometry {
  labelW: number;
  /** Column pitch (cell + space between cells). */
  col: number;
  cell: number;
  band: number; digit: number; label: number; radius: number; dot: number;
  /** Scale for the spotting stroke / dash (1 on the page). */
  stroke: number;
  /** Draw a faint empty cell on bleeding/spotting days with no note. */
  ghost: boolean;
}

function Row({ row, g, width }: { row: HeatDay[]; g: Geometry; width: number }) {
  const rowH = g.cell + g.band + 4;
  const inset = (g.col - g.cell) / 2;
  const cx = (i: number) => g.labelW + i * g.col + inset;
  const runW = (a: number, b: number) => cx(b) + g.cell - cx(a);
  const lineY = g.cell + 2;
  return (
    <Svg width={width} height={rowH}>
      <SvgText x={0} y={g.cell / 2 + g.label * 0.35} fontSize={g.label} fontFamily={fonts.regular} fill={C.ink2}>
        {formatShortDate(row[0].date, 'never')}
      </SvgText>
      <Rect x={cx(0)} y={g.cell + 0.75} width={runW(0, row.length - 1)} height={0.5} fill={C.borderStrong} />
      {row.map((d, i) => {
        const x = cx(i);
        if (!d.logged) {
          return g.ghost && (d.bleeding || d.spotting) ? (
            <Rect key={d.date} x={x + 0.5} y={0.5} width={g.cell - 1} height={g.cell - 1} rx={g.radius} fill="none" stroke={C.hairline} strokeWidth={1} />
          ) : null;
        }
        if (d.value != null) {
          const s = docSeverity(d.value);
          return (
            <React.Fragment key={d.date}>
              <Rect x={x} y={0} width={g.cell} height={g.cell} rx={g.radius} fill={s.bg} stroke={C.borderStrong} strokeWidth={0.4} />
              <SvgText
                x={x + g.cell / 2} y={g.cell / 2 + g.digit * 0.36} fontSize={g.digit}
                fontFamily={fonts.medium} fill={s.fg} textAnchor="middle"
              >
                {String(d.value)}
              </SvgText>
            </React.Fragment>
          );
        }
        return (
          <React.Fragment key={d.date}>
            <Rect x={x + 0.5} y={0.5} width={g.cell - 1} height={g.cell - 1} rx={g.radius} fill={C.white} stroke={C.borderStrong} strokeWidth={0.8} />
            <Circle cx={x + g.cell / 2} cy={g.cell / 2} r={g.dot} fill={C.ink} />
          </React.Fragment>
        );
      })}
      {bleedRuns(row).map(([a, b]) => (
        <Rect key={`b${a}`} x={cx(a)} y={lineY} width={runW(a, b)} height={g.band} fill={C.clay} />
      ))}
      {bleedRuns(row, 'spotting').map(([a, b]) => (
        <Line
          key={`s${a}`} x1={cx(a)} x2={cx(a) + runW(a, b)} y1={lineY + g.band / 2} y2={lineY + g.band / 2}
          stroke={C.clay} strokeWidth={SPOT_STROKE * g.stroke} strokeDasharray={SPOT_DASH.map((n) => n * g.stroke)}
        />
      ))}
    </Svg>
  );
}

/** Weeks → rows, with runs of empty weeks collapsed to one line. */
function weekBlocks(days: HeatDay[]): ({ kind: 'row'; row: HeatDay[] } | { kind: 'gap'; from: string; to: string })[] {
  const out: ({ kind: 'row'; row: HeatDay[] } | { kind: 'gap'; from: string; to: string })[] = [];
  for (const row of stripRows(days, 7)) {
    const empty = !row.some((d) => d.logged || d.bleeding || d.spotting);
    const last = out[out.length - 1];
    if (empty && last?.kind === 'gap') last.to = row[row.length - 1].date;
    else if (empty) out.push({ kind: 'gap', from: row[0].date, to: row[row.length - 1].date });
    else out.push({ kind: 'row', row });
  }
  return out;
}

export function HeatStrip({
  strip, width, mode = 'page', textSize = 15,
}: { strip: HeatStripModel; width: number; mode?: 'page' | 'weeks'; /** Meta text size in 'weeks' mode. */ textSize?: number }) {
  const count = (k: 'logged' | 'bleeding' | 'spotting') => strip.days.filter((d) => d[k]).length;
  const spot = count('spotting');
  const label = `Day-by-day strip, ${strip.label}. ${count('logged')} days with a note, ${count('bleeding')} days with bleeding logged` +
    (spot ? `, ${spot} days with spotting logged.` : '.');

  if (mode === 'page') {
    const labelW = 36;
    const col = (width - labelW) / 31;
    const g: Geometry = {
      labelW, col, cell: col - 2, band: 3, digit: PAGE_TYPE.stripDigit,
      label: PAGE_TYPE.stripLabel, radius: 2, dot: 1.6, stroke: 1, ghost: false,
    };
    return (
      <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ gap: 6 }}>
        {stripRows(strip.days, 31).map((row) => <Row key={row[0].date} row={row} g={g} width={width} />)}
      </View>
    );
  }

  // Columns stretch across the full width; cells stay square (capped) and centred in their column.
  const labelW = Math.round(textSize * 4.2);
  const col = (width - labelW) / 7;
  const cell = Math.min(textSize * 2.6, col - 4);
  const g: Geometry = {
    labelW, col, cell, band: Math.max(3, Math.round(textSize / 4)), digit: Math.round(cell * 0.45),
    label: textSize, radius: 4, dot: 3, stroke: Math.max(1, textSize / 10), ghost: true,
  };
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ gap: Math.round(textSize * 0.8) }}>
      {weekBlocks(strip.days).map((b) =>
        b.kind === 'row' ? (
          <Row key={b.row[0].date} row={b.row} g={g} width={width} />
        ) : (
          <Txt key={b.from} style={{ fontFamily: fonts.regular, fontSize: textSize, lineHeight: textSize * 1.35, color: C.ink2 }}>
            {`No entries ${formatRange(b.from, b.to)}`}
          </Txt>
        ),
      )}
    </View>
  );
}
