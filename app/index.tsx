import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Treat null/empty as missing. Treat strings that contain dots/underscores
// or look like a UUID/hex blob as machine-generated, so users who got a
// junk name from Apple Sign-In are routed through the name prompt.
function isHumanName(n: string | null | undefined): boolean {
  if (!n) return false;
  const v = n.trim();
  if (v.length < 1 || v.length > 60) return false;
  if (/[._]/.test(v)) return false;
  if (/^[0-9a-f-]{16,}$/i.test(v.replace(/\s/g, ''))) return false;
  return true;
}

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
      router.replace('/(tabs)/home');
    }
  }, [isInitialized, session, profile]);

  return <LoadingSpinner fullScreen message="Loading Atossa..." />;
}
