import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { LoadingScreen } from '../components/atossa/kit';
import { routeAfterSignIn } from '../lib/authRouting';

export default function Index() {
  const router = useRouter();
  const { session, profile, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    router.replace((session ? routeAfterSignIn(profile) : '/(auth)/welcome') as any);
  }, [isInitialized, session, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  return <LoadingScreen message="Opening Atossa…" />;
}
