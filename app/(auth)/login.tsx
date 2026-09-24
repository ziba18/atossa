import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { UI } from '../../constants/atossaUI';
import { BackButton, BigButton, InlineError, PageTitle, Screen, TextField, Txt } from '../../components/atossa/kit';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { useAuthStore } from '../../stores/authStore';
import { ApiError } from '../../lib/api';
import { routeAfterSignIn } from '../../lib/authRouting';

const C = UI.colors;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
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
    <Screen header={false} edges={['top', 'bottom']}>
      <BackButton label="Back" />
      <View style={{ marginTop: 20 }}>
        <PageTitle title="Sign in" subtitle="Welcome back to Atossa." />
      </View>

      <View style={{ marginTop: 16, gap: 20 }}>
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
        <TextField
          label="Password"
          secret
          value={password}
          onChangeText={(v) => { setPassword(v); setPasswordError(''); }}
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleLogin}
          error={passwordError}
        />
        <Pressable onPress={() => router.push('/(auth)/forgot-password')} accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Txt variant="bodyBold" color={C.accentForeground} style={{ textDecorationLine: 'underline' }}>Forgot your password?</Txt>
        </Pressable>
        <InlineError message={error} />
        <BigButton label={loading ? 'Signing in…' : 'Sign in'} icon="check" disabled={loading} onPress={handleLogin} />
        <BigButton label="Create a new account" variant="outline" onPress={() => router.replace('/(auth)/register')} />
        <SocialAuthButtons mode="signin" />
      </View>
    </Screen>
  );
}
