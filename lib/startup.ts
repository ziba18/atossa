import { create } from 'zustand';

/**
 * Opening the app while the server is asleep (PRD pm/prd/start-up-waking.md, B131).
 * Render's free tier takes about a minute to spin up (render.com/docs/free, read 31 Oct 2026) and serves an
 * HTML loading page meanwhile. While her tokens exist and the start-up check has no answer, the app shows
 * 'checking' -> 'waking' (after ~3 s) -> 'unreachable' (after >= 75 s), never Welcome. Only 401/403 signs out.
 */
export type StartupPhase = 'checking' | 'waking' | 'unreachable';

export const STARTUP_WAKING_AFTER_MS = 3000;
export const STARTUP_BUDGET_MS = 75000;
/** Waits between tries: short first, then capped at 10 s (PRD req. 3). */
export const STARTUP_BACKOFF_MS = [0, 2000, 4000, 6000, 8000, 10000];
/** One try may hang while the server spins up; give up on it after this and try again. */
export const STARTUP_TRY_TIMEOUT_MS = 12000;

export function backoffFor(attempt: number): number {
  return STARTUP_BACKOFF_MS[Math.min(attempt, STARTUP_BACKOFF_MS.length - 1)];
}

interface StartupState {
  phase: StartupPhase;
  /** True while she is on the pre-login Help now page: no API calls there (Help now makes zero network calls). */
  paused: boolean;
  setPhase: (phase: StartupPhase) => void;
  setPaused: (paused: boolean) => void;
}

export const useStartupStore = create<StartupState>((set) => ({
  phase: 'checking',
  paused: false,
  setPhase: (phase) => set({ phase }),
  setPaused: (paused) => set({ paused }),
}));

export type TryResult = 'ok' | 'rejected' | 'retry';

/**
 * Runs `attempt` until it returns 'ok' or 'rejected', or the budget runs out. Paused time does not count.
 * Pure timing logic, so it is testable without React or a network.
 */
export async function runStartupLoop(
  attempt: () => Promise<TryResult>,
  opts: {
    budgetMs?: number;
    now?: () => number;
    sleep?: (ms: number) => Promise<void>;
    isPaused?: () => boolean;
    onWaking?: () => void;
    wakingAfterMs?: number;
  } = {},
): Promise<'ok' | 'rejected' | 'unreachable'> {
  const budget = opts.budgetMs ?? STARTUP_BUDGET_MS;
  const now = opts.now ?? Date.now;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const isPaused = opts.isPaused ?? (() => false);
  const wakingAfter = opts.wakingAfterMs ?? STARTUP_WAKING_AFTER_MS;
  let elapsed = 0;
  let wakingShown = false;
  let last = now();
  const tick = () => { const t = now(); if (!isPaused()) elapsed += t - last; last = t;
    if (!wakingShown && elapsed >= wakingAfter) { wakingShown = true; opts.onWaking?.(); } };
  for (let i = 0; ; i++) {
    let wait = backoffFor(i);
    // Split the wait so the waking line appears on time (about 3 s), not at the next try.
    if (!wakingShown && wait && elapsed + wait > wakingAfter && elapsed < wakingAfter) {
      const first = Math.max(0, wakingAfter - elapsed);
      await sleep(first); tick(); wait -= first;
    }
    if (wait) await sleep(wait);
    tick();
    while (isPaused()) { await sleep(500); tick(); }
    if (i > 0 && elapsed >= budget) return 'unreachable';
    const r = await attempt();
    tick();
    if (r !== 'retry') return r;
    if (elapsed >= budget) return 'unreachable';
  }
}

/** Rejects after `ms` so one hanging request cannot hold the start-up screen forever. */
export function withTimeout<T>(p: Promise<T>, ms: number = STARTUP_TRY_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('start-up try timed out')), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}
