import { create } from 'zustand';

interface UIState {
  isDarkMode: boolean;
  isEmergencyModalOpen: boolean;
  activeTab: string;
  setDarkMode: (val: boolean) => void;
  setEmergencyModal: (val: boolean) => void;
  setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isDarkMode: false,
  isEmergencyModalOpen: false,
  activeTab: 'home',
  setDarkMode: (val) => set({ isDarkMode: val }),
  setEmergencyModal: (val) => set({ isEmergencyModalOpen: val }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
