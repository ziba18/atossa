import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const DARK_MODE_KEY = 'atossa.darkMode';

interface UIState {
  isDarkMode: boolean;
  isEmergencyModalOpen: boolean;
  activeTab: string;
  hydrated: boolean;
  setDarkMode: (val: boolean) => void;
  setEmergencyModal: (val: boolean) => void;
  setActiveTab: (tab: string) => void;
  hydrate: () => Promise<void>;
}

export const useUIStore = create<UIState>((set) => ({
  isDarkMode: false,
  isEmergencyModalOpen: false,
  activeTab: 'home',
  hydrated: false,
  setDarkMode: (val) => {
    set({ isDarkMode: val });
    SecureStore.setItemAsync(DARK_MODE_KEY, val ? '1' : '0').catch(() => {});
  },
  setEmergencyModal: (val) => set({ isEmergencyModalOpen: val }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  hydrate: async () => {
    try {
      const v = await SecureStore.getItemAsync(DARK_MODE_KEY);
      if (v !== null) set({ isDarkMode: v === '1' });
    } finally {
      set({ hydrated: true });
    }
  },
}));

// Kick off hydration as soon as this module is imported.
useUIStore.getState().hydrate();
