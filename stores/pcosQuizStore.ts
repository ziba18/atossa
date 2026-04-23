import { create } from 'zustand';

export interface PCOSQuizResult {
  scorePct: number;    // 0-100
  tierKey: string;     // 'low' | 'some' | 'moderate' | 'high'
  tierLabel: string;   // human-readable label
  tierColor: string;   // hex color
  takenAt: string;     // ISO date string
}

interface PCOSQuizState {
  result: PCOSQuizResult | null;
  setResult: (result: PCOSQuizResult) => void;
  clearResult: () => void;
}

export const usePCOSQuizStore = create<PCOSQuizState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  clearResult: () => set({ result: null }),
}));
