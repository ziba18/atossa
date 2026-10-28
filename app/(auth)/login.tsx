import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { space } from '../../constants/atossaUI';
import { Button, InlineError, ScreenLarge, TextField } from '../../components/atossa/kit';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { useAuthStore } from '../../stores/authStore';
import { ApiError } from '../../lib/api';
import { routeAfterSignIn } from '../../lib/authRouting';
import { usePageTitle } from '../../lib/usePageTitle';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  usePageTitle('Sign in');
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmed = email.trim();
    const eErr = !trimmed ? 'Enter your email.' : !EMAIL_RE.test(trimmed) ? 'That email doesn’t look right.' : '';
    const pErr = password ? '' : 'Enter your password.';
    setEmailError(eErr);
    setPasswordError(pErr);
    setError('');
    if (eErr || pErr) return;

    setLoading(true);
    try {
      await login(trimmed.toLowerCase(), password);
      router.replace(routeAfterSignIn(useAuthStore.getState().profile) as any);
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError && err.status === 401) setPasswordError('The email or password is not right.');
      else setError('We couldn’t sign you in. Check your connection and try again.');
    }
  };

  return (
    <ScreenLarge title="Sign in" subtitle="Welcome back." back={{ label: 'Back' }}>
      <View style={{ gap: space.xl }}>
        <TextField
          label="Email"
          value={email}
          onChangeText={(v) => { setEmail(v); setEmailError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          placeholder="you@example.com"
          error={emailError}
        />
        <View>
          <TextField
            label="Password"
            secret
            value={password}
            onChangeText={(v) => { setPassword(v); setPasswordError(''); }}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            error={passwordError}
          />
          <Button label="Forgot your password?" variant="text" small align="start" onPress={() => router.push('/(auth)/forgot-password')} style={{ marginTop: space.xxs }} />
        </View>
      </View>

      <View style={{ marginTop: space.xxl, gap: space.xs }}>
        <InlineError message={error} style={{ marginBottom: space.xs }} />
        <Button label={loading ? 'Signing in…' : 'Sign in'} loading={loading} onPress={handleLogin} />
        <Button label="Create a new account" variant="text" onPress={() => router.replace('/(auth)/register')} />
      </View>

      <View style={{ marginTop: space.md }}>
        <SocialAuthButtons mode="signin" />
      </View>
    </ScreenLarge>
  );
}
