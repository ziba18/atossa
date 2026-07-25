import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { ApiError } from '../../lib/api';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { Icon } from '../../components/ui/Icon';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../constants/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const theme = useColors();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    let hasError = false;
    if (!trimmedEmail) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!EMAIL_RE.test(trimmedEmail)) {
      setEmailError('Enter a valid email address');
      hasError = true;
    } else {
      setEmailError('');
    }
    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    } else {
      setPasswordError('');
    }
    if (hasError) return;

    setLoading(true);
    try {
      await login(trimmedEmail.toLowerCase(), password);
      const { profile } = useAuthStore.getState();
      if (profile?.onboarding_complete) {
        router.replace('/(tabs)/chat' as any);
      } else {
        router.replace('/(auth)/onboarding/step1-basics');
      }
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError && err.status === 401) {
        setPasswordError('Incorrect email or password');
      } else {
        Alert.alert('Login Failed', err instanceof Error ? err.message : 'Something went wrong');
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
            onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
            error={emailError}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={(v) => { setPassword(v); if (passwordError) setPasswordError(''); }}
            secureTextEntry={!showPassword}
            placeholder="Your password"
            error={passwordError}
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
    subtitle: { fontSize: FontSize.md, fontFamily: 'Fraunces_400Regular', color: c.textMuted, marginBottom: Spacing.xl },
    forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing.lg, marginTop: -Spacing.sm },
    forgotText: { fontSize: FontSize.sm, fontFamily: 'Fraunces_400Regular', color: Colors.cherry },
    loginBtn: { marginBottom: Spacing.xl },
    registerRow: { flexDirection: 'row', justifyContent: 'center' },
    registerText: { fontSize: FontSize.md, fontFamily: 'Fraunces_400Regular', color: c.textMuted },
    registerLink: { fontSize: FontSize.md, fontFamily: 'Fraunces_500Medium', color: Colors.cherry },
  });
}
