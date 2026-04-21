import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/layout/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: name.trim() } },
    });

    if (error) {
      setLoading(false);
      Alert.alert('Sign Up Failed', error.message);
      return;
    }

    // Ensure profile row has the display name the user typed
    if (data.user) {
      await supabase
        .from('profiles')
        .upsert({ id: data.user.id, display_name: name.trim() }, { onConflict: 'id' });
    }

    setLoading(false);

    // Navigate to onboarding
    router.replace('/(auth)/onboarding/step1-basics');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <Header title="Create Account" showBack />
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.subtitle}>Join Atossa and take control of your health</Text>

          <Input label="Full Name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Min. 8 characters" />
          <Input label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Repeat password" />

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

          <SocialAuthButtons />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.xl, paddingTop: Spacing.lg },
  subtitle: { fontSize: FontSize.md, fontFamily: 'Jost_400Regular', color: Colors.textMuted, marginBottom: Spacing.xl },
  btn: { marginTop: Spacing.md, marginBottom: Spacing.xl },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: Spacing.lg },
  loginText: { fontSize: FontSize.md, fontFamily: 'Jost_400Regular', color: Colors.textMuted },
  loginLink: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', color: Colors.cherry },
  terms: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
