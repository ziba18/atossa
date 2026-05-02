import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

let authInitStarted = false;

function startAuthInit() {
  if (authInitStarted) return;
  authInitStarted = true;

  supabase.auth.getSession().then(({ data: { session }, error }) => {
    const { setSession, fetchProfile } = useAuthStore.getState();
    if (error) {
      supabase.auth.signOut();
      setSession(null);
    } else {
      setSession(session);
      if (session?.user) fetchProfile();
    }
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    const prev = useAuthStore.getState().user;
    const { setSession, fetchProfile } = useAuthStore.getState();
    setSession(session);
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
