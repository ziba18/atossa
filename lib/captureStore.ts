import { create } from 'zustand';

// One capture sheet for the whole app, mounted in app/(tabs)/_layout.tsx (owned by the Today /
// capture work). Any screen opens it with openCapture(): Today hero + starter chips, Timeline "+",
// the DaySheet's "Add a note for this day" (with `date`), and "Add more" links.

export interface CaptureOptions {
  /** Date key the note is about (YYYY-MM-DD). Defaults to todayKey(). */
  date?: string;
  /** Hidden starter-chip tag ('Pain today' | 'Something new' | 'Just a quick note'); never shown as Sam's words. */
  tag?: string;
  /** 'speak' (default) or 'type'. */
  mode?: 'speak' | 'type';
  /** Start recording immediately (Today mic). Ignored where voice is unavailable. */
  startRecording?: boolean;
  /** Sam's words to start from (Today chat → "Save as a note"). She can still edit them. */
  words?: string;
}

interface CaptureState {
  open: boolean;
  options: CaptureOptions;
  openCapture: (options?: CaptureOptions) => void;
  closeCapture: () => void;
}

export const useCaptureStore = create<CaptureState>((set) => ({
  open: false,
  options: {},
  openCapture: (options = {}) => set({ open: true, options }),
  closeCapture: () => set({ open: false, options: {} }),
}));

export const openCapture = (options?: CaptureOptions) => useCaptureStore.getState().openCapture(options);
export const closeCapture = () => useCaptureStore.getState().closeCapture();
