import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

let authInitStarted = false;

async function clearLocalSession() {
  // Stale/invalid refresh token: clear locally without hitting the server,
  // which would just fail again with the same dead token.
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {}
}

function startAuthInit() {
  if (authInitStarted) return;
  authInitStarted = true;

  (async () => {
    const { setSession, fetchProfile } = useAuthStore.getState();
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        if (error) await clearLocalSession();
        setSession(null);
        return;
      }
      setSession(session);
      if (session.user) fetchProfile();
    } catch {
      await clearLocalSession();
      setSession(null);
    }
  })();

  supabase.auth.onAuthStateChange((event, session) => {
    const prev = useAuthStore.getState().user;
    const { setSession, fetchProfile } = useAuthStore.getState();
    setSession(session);
    if (event === 'SIGNED_OUT') return;
    if (session?.user && session.user.id !== prev?.id) fetchProfile();
  });
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
  const syncedDarkMode = useRef(false);

  useEffect(() => {
    if (!profile || syncedDarkMode.current) return;
    syncedDarkMode.current = true;
    if (typeof profile.dark_mode === 'boolean') {
      const { isDarkMode, setDarkMode } = useUIStore.getState();
      if (profile.dark_mode !== isDarkMode) setDarkMode(profile.dark_mode);
    }
  }, [profile]);

  return { session, user, profile, isLoading, isInitialized, signOut };
}
