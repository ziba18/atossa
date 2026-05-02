import React, { createContext, useContext, useMemo } from 'react';
import { Colors } from '../constants/colors';
import { useUIStore } from '../stores/uiStore';

export type AppColors = typeof Colors;

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
