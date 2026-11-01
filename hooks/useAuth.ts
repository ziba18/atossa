import { useEffect, useRef } from 'react';
import { markSessionExpired } from '../lib/sessionLoss';
import { api, ApiError, clearTokens, getStoredAccessToken, setSessionExpiredHandler } from '../lib/api';
import { useAuthStore, type AuthUser } from '../stores/authStore';
import { runStartupLoop, STARTUP_WAKING_AFTER_MS, useStartupStore, withTimeout } from '../lib/startup';
import { syncDailyLogReminder } from '../lib/notifications';
import type { Profile } from '../types/database';
import { IS_PREVIEW, PREVIEW_USER_ID } from '../lib/preview/flag';
import { PREVIEW_EMAIL, PREVIEW_PROFILE } from '../lib/preview/seed';

let authInitStarted = false;

async function checkSession(token: string) {
  const { setSession, setUser, setProfile } = useAuthStore.getState();
  const startup = useStartupStore.getState();
  startup.setPhase('checking');
  // Wall-clock timer, so a single hanging try cannot delay the waking line past ~3 s.
  const wakingTimer = setTimeout(() => {
    if (useStartupStore.getState().phase === 'checking') useStartupStore.getState().setPhase('waking');
  }, STARTUP_WAKING_AFTER_MS);
  const result = await runStartupLoop(async () => {
    try {
      const [user, profile] = await withTimeout(Promise.all([
        api.get<AuthUser>('/auth/me'),
        api.get<Profile>('/me'),
      ]));
      setUser(user);
      setProfile(profile);
      return 'ok';
    } catch (e) {
      // A JSON parse error on an HTML 200 page is not an ApiError, so it falls through to 'retry' (still waking).
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return 'rejected';
      return 'retry';
    }
  }, {
    isPaused: () => useStartupStore.getState().paused,
    onWaking: () => useStartupStore.getState().setPhase('waking'),
  });
  clearTimeout(wakingTimer);
  if (result === 'ok') { setSession({ access_token: token }); return; }
  if (result === 'rejected') { await clearTokens(); setSession(null); return; }
  // Tokens and unsent notes are kept; the opening screen shows 'can't reach' with Try again.
  useStartupStore.getState().setPhase('unreachable');
}

let retrying = false;
/** 'Try again' on the can't-reach screen: same check again, without typing anything. */
export async function retryStartup() {
  if (retrying) return;
  retrying = true;
  try {
    const token = await getStoredAccessToken();
    if (!token) { useAuthStore.getState().setSession(null); return; }
    await checkSession(token);
  } finally { retrying = false; }
}

function startAuthInit() {
  if (authInitStarted) return;
  authInitStarted = true;

  setSessionExpiredHandler(() => {
    markSessionExpired(); // keeps the notes still waiting to send; a manual sign-out clears them
    useAuthStore.getState().signOut({ keepLocal: true });
  });

  // Design preview: signed in as "Sam" immediately, no tokens, no network.
  if (IS_PREVIEW) {
    const { setSession, setUser, setProfile } = useAuthStore.getState();
    setUser({ id: PREVIEW_USER_ID, email: PREVIEW_EMAIL, has_password: true });
    setProfile(PREVIEW_PROFILE);
    setSession({ access_token: 'design-preview' });
    return;
  }

  (async () => {
    const { setSession } = useAuthStore.getState();
    const token = await getStoredAccessToken();

    if (!token) {
      setSession(null);
      return;
    }

    // A sleeping free-tier server takes about a minute to spin up and answers with an HTML loading page meanwhile
    // (render.com/docs/free). Keep trying for at least 75 s with the 'waking' line, then 'can't reach' with Try again.
    // HTML, 5xx, timeouts and network errors = still waking. Only a rejected session (401/403) deletes the tokens.
    await checkSession(token);
  })();
}

// Kick off auth as soon as this module is imported, before React mounts.
startAuthInit();

export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const signOut = useAuthStore((s) => s.signOut);
  const syncedDailyReminder = useRef(false);

  useEffect(() => {
    if (IS_PREVIEW || !profile || !profile.onboarding_complete || syncedDailyReminder.current) return;
    syncedDailyReminder.current = true;
    syncDailyLogReminder(profile.daily_log_reminder_enabled, profile.daily_log_reminder_time).catch(() => {});
  }, [profile]);

  return { session, user, profile, isLoading, isInitialized, signOut };
}
