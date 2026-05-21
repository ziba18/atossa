import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { SafeScreen } from '../../../components/layout/SafeScreen';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { Colors } from '../../../constants/colors';
import { FontSize, Spacing } from '../../../constants/theme';

export default function OnboardingNameScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    const trimmed = name.trim();
    if (trimmed.length < 1) return;
    setLoading(true);
    await supabase.from('profiles').upsert(
      { id: user.id, display_name: trimmed },
      { onConflict: 'id' },
    );
    await fetchProfile();
    setLoading(false);
    router.replace('/(auth)/onboarding/step1-basics');
  };

  const theme = useColors();
  const styles = createStyles(theme);

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Text style={styles.title}>Welcome to Atossa</Text>
        <Text style={styles.subtitle}>
          What should we call you? You can change this anytime in your profile.
        </Text>

        <Text style={styles.label}>Your name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="First name"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={handleSave}
          style={styles.input}
        />

        <Button
          label="Continue"
          onPress={handleSave}
          loading={loading}
          disabled={name.trim().length < 1}
          size="lg"
          fullWidth
          style={styles.btn}
        />
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    title: { fontSize: 32, fontFamily: 'CormorantGaramond_500Medium_Italic', color: c.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
    subtitle: { fontSize: FontSize.md, fontFamily: 'CormorantGaramond_400Regular', color: c.textMuted, marginBottom: Spacing.xl, lineHeight: 22 },
    label: { fontSize: FontSize.sm, fontFamily: 'CormorantGaramond_600SemiBold', color: c.textPrimary, marginBottom: Spacing.xs },
    input: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: Spacing.md,
      paddingVertical: 14,
      fontSize: FontSize.lg,
      fontFamily: 'CormorantGaramond_500Medium',
      color: c.textPrimary,
    },
    btn: { marginTop: Spacing.xl },
  });
}
