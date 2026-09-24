import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { BackButton, BigButton, InlineError, PageTitle, Screen, TextField, Txt } from '../../components/atossa/kit';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { useAuthStore } from '../../stores/authStore';
import { ApiError } from '../../lib/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const clear = (key: string) => setErrors((e) => (e[key] ? { ...e, [key]: '' } : e));

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const next: Record<string, string> = {
      name: trimmedName ? '' : 'Enter your name.',
      email: !trimmedEmail ? 'Enter your email.' : !EMAIL_RE.test(trimmedEmail) ? 'That email doesn’t look right.' : '',
      password: !password ? 'Choose a password.' : password.length < 8 ? 'Use at least 8 characters.' : '',
      confirm: password && confirm !== password ? 'The two passwords are different.' : '',
    };
    setErrors(next);
    setError('');
    if (Object.values(next).some(Boolean)) return;

    setLoading(true);
    try {
      await register(trimmedEmail.toLowerCase(), password, trimmedName);
      router.replace('/(auth)/onboarding/basics');
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError && err.status === 400) setErrors((e) => ({ ...e, email: 'There is already an account with this email. Try signing in.' }));
      else setError('We couldn’t create your account. Check your connection and try again.');
    }
  };

  return (
    <Screen header={false} edges={['top', 'bottom']}>
      <BackButton label="Back" />
      <View style={{ marginTop: 20 }}>
        <PageTitle title="Create an account" subtitle="Your information stays private to you." />
      </View>

      <View style={{ marginTop: 16, gap: 20 }}>
        <TextField label="Your name" value={name} onChangeText={(v) => { setName(v); clear('name'); }} autoCapitalize="words" autoComplete="name" textContentType="name" error={errors.name} />
        <TextField label="Email" value={email} onChangeText={(v) => { setEmail(v); clear('email'); }} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" placeholder="you@example.com" error={errors.email} />
        <TextField label="Password" hint="At least 8 characters" secret value={password} onChangeText={(v) => { setPassword(v); clear('password'); }} autoComplete="new-password" textContentType="newPassword" error={errors.password} />
        <TextField label="Type the password again" secret value={confirm} onChangeText={(v) => { setConfirm(v); clear('confirm'); }} autoComplete="new-password" textContentType="newPassword" returnKeyType="go" onSubmitEditing={handleRegister} error={errors.confirm} />
        <InlineError message={error} />
        <BigButton label={loading ? 'Creating your account…' : 'Create account'} icon="check" disabled={loading} onPress={handleRegister} />
        <Txt variant="small" style={{ textAlign: 'center' }}>By signing up, you agree to our Terms of Service and Privacy Policy.</Txt>
        <BigButton label="I already have an account" variant="outline" onPress={() => router.replace('/(auth)/login')} />
        <SocialAuthButtons mode="signup" />
      </View>
    </Screen>
  );
}
