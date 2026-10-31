import React from 'react';
import { Text, useWindowDimensions, type TextProps, type TextStyle } from 'react-native';
import { colors, fonts, type as typeScale, type TypeVariant } from '../../../constants/atossaUI';

/** Old variant names still used by auth / onboarding / profile sub-screens. Don't use in new code. */
export type LegacyVariant = 'display' | 'h2' | 'h3' | 'bodyBold' | 'small' | 'smallBold' | 'tiny';
export type TxtVariant = TypeVariant | LegacyVariant;

const LEGACY: Record<LegacyVariant, TextStyle> = {
  display: typeScale.largeTitle,
  h2: typeScale.title,
  h3: typeScale.headline,
  bodyBold: typeScale.headline,
  small: typeScale.secondary,
  smallBold: { ...typeScale.secondary, fontFamily: fonts.semibold, color: colors.ink },
  tiny: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.ink2 },
};

const styleFor = (v: TxtVariant): TextStyle => (typeScale as Record<string, TextStyle>)[v] ?? LEGACY[v as LegacyVariant];

/**
 * All text. `variant` is the type scale (constants/atossaUI.ts `type`). `hero` and `quote`
 * render Fraunces — use them ONLY for Sam's own words, the Today hero prompt
 * and the summary title. Never pass fontWeight (Plus Jakarta Sans weights are separate font files;
 * the serif has one face).
 */
export function Txt({
  variant = 'body', color, style, ...props
}: TextProps & { variant?: TxtVariant; color?: string }) {
  return <Text {...props} style={[styleFor(variant), color ? { color } : null, style]} />;
}

/**
 * Typographic punctuation for DISPLAY only (the stored words never change): straight
 * apostrophes → ’ and "..." → …. In Instrument Serif Italic a straight ' renders as a tick.
 */
export function curly(text: string): string {
  return text.replace(/'/g, '’').replace(/\.\.\./g, '…');
}

/** Sam's words in the serif, wrapped in curly quotes (apostrophes curled for display). */
export function Quote({ children, numberOfLines, style }: { children: string; numberOfLines?: number; style?: TextStyle }) {
  // Under 280 pt wide (200% text) the serif is so wide that ordinary words ("lightheaded") split mid-word.
  const tight = useWindowDimensions().width < 280;
  return (
    <Txt variant="quote" numberOfLines={numberOfLines} style={tight ? ([{ fontSize: 17, lineHeight: 24 }, style] as any) : style}>
      {`“${curly(children)}”`}
    </Txt>
  );
}
