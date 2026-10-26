// Decorative "where your notes will land" card for the empty Timeline: a faded, dashed outline of
// an entry (date line, two text lines, score pill). Pure SVG, hidden from screen readers, no words
// about the body, so nothing in it can be read as a symptom or a finding.
import React from 'react';
import Svg, { Circle, Rect } from 'react-native-svg';
import { colors } from '../../../constants/atossaUI';

export function GhostEntry({ width = 260 }: { width?: number }) {
  const h = (width * 112) / 260;
  return (
    <Svg
      width={width} height={h} viewBox="0 0 260 112"
      accessibilityElementsHidden
    >
      <Rect x={1} y={1} width={258} height={110} rx={18} fill={colors.surface} stroke={colors.hairline} strokeWidth={1.5} strokeDasharray="6 5" />
      <Circle cx={28} cy={26} r={7} fill={colors.sunken} />
      <Rect x={44} y={21} width={84} height={10} rx={5} fill={colors.sunken} />
      <Rect x={20} y={46} width={200} height={10} rx={5} fill={colors.hairline} />
      <Rect x={20} y={64} width={150} height={10} rx={5} fill={colors.hairline} />
      <Rect x={20} y={84} width={78} height={18} rx={9} fill={colors.plumTint} />
    </Svg>
  );
}
