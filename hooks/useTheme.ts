import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { lightTheme, darkTheme } from '../constants/theme';

export function useTheme() {
  const isDarkFromStore = useUIStore((s) => s.isDarkMode);
  const profile = useAuthStore((s) => s.profile);
  const isDark = profile?.dark_mode ?? isDarkFromStore;
  return isDark ? darkTheme : lightTheme;
}
