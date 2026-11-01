import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth, retryStartup } from '../hooks/useAuth';
import { routeAfterSignIn } from '../lib/authRouting';
import { useStartupStore } from '../lib/startup';
import { StartupScreen } from '../components/startup/StartupScreen';

export default function Index() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const { session, profile, isInitialized } = useAuth();
  const phase = useStartupStore((s) => s.phase);
  const setPaused = useStartupStore((s) => s.setPaused);
  const [retrying, setRetrying] = useState(false);
  const onHelp = segments.includes('help-now');

  // Pre-login Help now makes no API calls: pause the start-up retries while she is there.
  useEffect(() => { setPaused(onHelp); }, [onHelp, setPaused]);

  useEffect(() => {
    // Never pull her off the Help now page when the server answers; route when she comes back.
    if (!isInitialized || onHelp) return;
    router.replace((session ? routeAfterSignIn(profile) : '/(auth)/welcome') as any);
  }, [isInitialized, session, profile, onHelp]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRetry = () => { setRetrying(true); retryStartup().finally(() => setRetrying(false)); };
  return <StartupScreen phase={isInitialized ? 'checking' : phase} onRetry={onRetry} retrying={retrying} />;
}
