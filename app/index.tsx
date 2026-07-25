import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { isHumanName } from '../lib/humanName';

export default function Index() {
  const router = useRouter();
  const { session, profile, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    if (!session) {
      router.replace('/(auth)/welcome');
    } else if (profile && !profile.onboarding_complete) {
      if (!isHumanName(profile.display_name)) {
        router.replace('/(auth)/onboarding/name' as any);
      } else {
        router.replace('/(auth)/onboarding/step1-basics');
      }
    } else {
      router.replace('/(tabs)/chat' as any);
    }
  }, [isInitialized, session, profile]);

  return <LoadingSpinner fullScreen message="Loading Atossa..." />;
}
