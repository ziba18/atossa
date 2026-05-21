import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { Icon } from '../../components/ui/Icon';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
      return;
    }

    if (data.user) {
      // Check if onboarding is complete and navigate accordingly
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile?.onboarding_complete) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/onboarding/step1-basics');
      }
    }
  };

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeScreen>
        <Header title="Welcome Back" showBack />
        <View style={styles.container}>
          <Text style={styles.subtitle}>Sign in to your Atossa account</Text>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="Your password"
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color={theme.textMuted} />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button label="Sign In" onPress={handleLogin} loading={loading} size="lg" fullWidth style={styles.loginBtn} />

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
              <Text style={styles.registerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>

          <SocialAuthButtons mode="signin" />
        </View>
      </SafeScreen>
    </KeyboardAvoidingView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, paddingTop: Spacing.xl },
    subtitle: { fontSize: FontSize.md, fontFamily: 'CormorantGaramond_400Regular', color: c.textMuted, marginBottom: Spacing.xl },
    forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing.lg, marginTop: -Spacing.sm },
    forgotText: { fontSize: FontSize.sm, fontFamily: 'CormorantGaramond_500Medium', color: Colors.cherry },
    loginBtn: { marginBottom: Spacing.xl },
    registerRow: { flexDirection: 'row', justifyContent: 'center' },
    registerText: { fontSize: FontSize.md, fontFamily: 'CormorantGaramond_400Regular', color: c.textMuted },
    registerLink: { fontSize: FontSize.md, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.cherry },
  });
}
