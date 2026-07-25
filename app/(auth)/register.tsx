import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { ApiError } from '../../lib/api';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/layout/Header';
import { Icon } from '../../components/ui/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../constants/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useColors();
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    let hasError = false;

    if (!trimmedName) { setNameError('Name is required'); hasError = true; } else { setNameError(''); }
    if (!trimmedEmail) {
      setEmailError('Email is required'); hasError = true;
    } else if (!EMAIL_RE.test(trimmedEmail)) {
      setEmailError('Enter a valid email address'); hasError = true;
    } else { setEmailError(''); }
    if (!password) {
      setPasswordError('Password is required'); hasError = true;
    } else if (password.length < 8) {
      setPasswordError('Must be at least 8 characters'); hasError = true;
    } else { setPasswordError(''); }
    if (!hasError && password !== confirmPassword) {
      setConfirmError('Passwords do not match'); hasError = true;
    } else { setConfirmError(''); }

    if (hasError) return;

    setLoading(true);
    try {
      await register(trimmedEmail.toLowerCase(), password, trimmedName);
      router.replace('/(auth)/onboarding/step1-basics');
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError && err.status === 400) {
        setEmailError('An account with this email already exists');
      } else {
        Alert.alert('Sign Up Failed', err instanceof Error ? err.message : 'Something went wrong');
      }
    }
  };

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Header title="Create Account" showBack />
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.subtitle}>Join Atossa and take control of your health</Text>

          <Input label="Full Name" value={name} onChangeText={(v) => { setName(v); if (nameError) setNameError(''); }} placeholder="Your name" autoCapitalize="words" error={nameError} />
          <Input label="Email" value={email} onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(''); }} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" error={emailError} />
          <Input
            label="Password"
            value={password}
            onChangeText={(v) => { setPassword(v); if (passwordError) setPasswordError(''); }}
            secureTextEntry={!showPassword}
            placeholder="Min. 8 characters"
            error={passwordError}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color={theme.textMuted} />
              </TouchableOpacity>
            }
          />
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); if (confirmError) setConfirmError(''); }}
            secureTextEntry={!showConfirmPassword}
            placeholder="Repeat password"
            error={confirmError}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color={theme.textMuted} />
              </TouchableOpacity>
            }
          />

          <Button label="Create Account" onPress={handleRegister} loading={loading} size="lg" fullWidth style={styles.btn} />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.terms}>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </Text>

          <SocialAuthButtons mode="signup" />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { padding: Spacing.xl, paddingTop: Spacing.lg },
    subtitle: { fontSize: FontSize.md, fontFamily: 'Fraunces_400Regular', color: c.textMuted, marginBottom: Spacing.xl },
    btn: { marginTop: Spacing.md, marginBottom: Spacing.xl },
    loginRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: Spacing.lg },
    loginText: { fontSize: FontSize.md, fontFamily: 'Fraunces_400Regular', color: c.textMuted },
    loginLink: { fontSize: FontSize.md, fontFamily: 'Fraunces_500Medium', color: Colors.cherry },
    terms: { fontSize: FontSize.xs, fontFamily: 'Fraunces_400Regular', color: c.textMuted, textAlign: 'center', lineHeight: 18 },
  });
}
