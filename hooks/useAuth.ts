import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const { session, user, profile, isLoading, isInitialized, setSession, fetchProfile, signOut } =
    useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Stale/invalid token (e.g. from a previous project) — clear it
        supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(session);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !profile) {
      fetchProfile();
    }
  }, [user]);

  return { session, user, profile, isLoading, isInitialized, signOut };
}
