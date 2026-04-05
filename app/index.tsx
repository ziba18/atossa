import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export default function Index() {
  const router = useRouter();
  const { session, profile, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    if (!session) {
      router.replace('/(auth)/welcome');
    } else if (profile && !profile.onboarding_complete) {
      router.replace('/(auth)/onboarding/step1-basics');
    } else {
      router.replace('/(tabs)/home');
    }
  }, [isInitialized, session, profile]);

  return <LoadingSpinner fullScreen message="Loading Atossa..." />;
}
