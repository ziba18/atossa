import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { space } from '../../../constants/atossaUI';
import { Button, InlineError, TextField } from '../../../components/atossa/kit';
import { OnboardingScreen } from '../../../components/auth/OnboardingScreen';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { track } from '../../../lib/analytics';

export default function OnboardingNameScreen() {
  const router = useRouter();
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError('');
    try {
      await api.patch('/me', { display_name: trimmed });
      await fetchProfile();
      track('Onboarding Step Completed', { step: 'name' });
      router.replace('/(auth)/onboarding/basics');
    } catch {
      setError('We couldn’t save your name. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingScreen step={1} title="What should we call you?" helper="You can change this any time.">
      <TextField
        label="Your name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoCorrect={false}
        autoFocus
        maxLength={40}
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />
      <View style={{ marginTop: space.xxl, gap: space.sm }}>
        <InlineError message={error} />
        <Button label={loading ? 'Saving…' : 'Continue'} loading={loading} disabled={!name.trim()} onPress={handleSave} />
      </View>
    </OnboardingScreen>
  );
}
