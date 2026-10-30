import { useEffect, useRef } from 'react';
import { markSessionExpired } from '../lib/sessionLoss';
import { api, ApiError, clearTokens, getStoredAccessToken, setSessionExpiredHandler } from '../lib/api';
import { useAuthStore, type AuthUser } from '../stores/authStore';
import { syncDailyLogReminder } from '../lib/notifications';
import type { Profile } from '../types/database';
import { IS_PREVIEW, PREVIEW_USER_ID } from '../lib/preview/flag';
import { PREVIEW_EMAIL, PREVIEW_PROFILE } from '../lib/preview/seed';

let authInitStarted = false;

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
    setUser({ id: PREVIEW_USER_ID, email: PREVIEW_EMAIL });
    setProfile(PREVIEW_PROFILE);
    setSession({ access_token: 'design-preview' });
    return;
  }

  (async () => {
    const { setSession, setUser, setProfile } = useAuthStore.getState();
    const token = await getStoredAccessToken();

    if (!token) {
      setSession(null);
      return;
    }

    // A sleeping free-tier server or a weak signal fails the first try: wait on the opening screen and try again
    // before giving up. Only a rejected session (401/403) ends it and deletes the tokens.
    const waits = [0, 4000, 10000];
    for (let i = 0; i < waits.length; i++) {
      if (waits[i]) await new Promise((r) => setTimeout(r, waits[i]));
      try {
        const [user, profile] = await Promise.all([
          api.get<AuthUser>('/auth/me'),
          api.get<Profile>('/me'),
        ]);
        setUser(user);
        setProfile(profile);
        setSession({ access_token: token });
        return;
      } catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          await clearTokens();
          break;
        }
      }
    }
    setSession(null);
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
