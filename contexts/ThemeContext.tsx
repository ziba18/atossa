import React, { createContext, useContext, useMemo } from 'react';
import { Colors } from '../constants/colors';
import { useUIStore } from '../stores/uiStore';

// `Colors` uses `as const`, which gives every value a literal type. Widening
// each slot to `string` lets the dark theme reuse the same shape with
// different colour values without TS rejecting each override.
export type AppColors = { [K in keyof typeof Colors]: string };

const DarkColors: AppColors = {
  ...Colors,
  background: Colors.backgroundDark,
  surface: Colors.surfaceDark,
  surfaceElevated: Colors.surfaceElevatedDark,
  textPrimary: Colors.textPrimaryDark,
  textSecondary: Colors.textSecondaryDark,
  textMuted: Colors.textMutedDark,
  border: Colors.borderDark,
  borderStrong: Colors.borderDark,
  overlay: 'rgba(10,8,20,0.7)',
  overlayLight: 'rgba(78,158,90,0.08)',
  cream: Colors.backgroundDark,
  creamDark: Colors.surfaceDark,
  bordeauxMid: Colors.backgroundDark,
  bordeauxLight: Colors.surfaceElevatedDark,
  forestDark: Colors.surfaceDark,
  // Translucent surfaces have to be re-tinted for the dark background.
  glassBg: 'rgba(255,255,255,0.06)',
  glassBgSoft: 'rgba(255,255,255,0.05)',
  glassBgSubtle: 'rgba(255,255,255,0.04)',
  glassBgFaint: 'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(240,238,248,0.08)',
};

const ThemeContext = createContext<AppColors>(Colors);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDark = useUIStore((s) => s.isDarkMode);
  const colors = useMemo(() => (isDark ? DarkColors : Colors), [isDark]);
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export function useColors(): AppColors {
  return useContext(ThemeContext);
}
