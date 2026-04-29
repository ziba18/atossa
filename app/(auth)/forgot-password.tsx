import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { Icon } from '../../components/ui/Icon';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { FontSize, Spacing } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) { Alert.alert('Enter your email.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setSent(true);
  };

  const theme = useColors();
  const styles = createStyles(theme);

  return (
    <SafeScreen>
      <Header title="Reset Password" showBack />
      <View style={styles.container}>
        {sent ? (
          <View style={styles.sentContainer}>
            <View style={styles.sentIconWrap}>
              <Icon name="send" size={64} color={Colors.cherry} />
            </View>
            <Text style={styles.sentTitle}>Check your inbox</Text>
            <Text style={styles.sentBody}>
              We sent a password reset link to {email}. Check your email and follow the instructions.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Enter the email address associated with your account and we'll send you a reset link.
            </Text>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
            />
            <Button label="Send Reset Link" onPress={handleReset} loading={loading} size="lg" fullWidth />
          </>
        )}
      </View>
    </SafeScreen>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, paddingTop: Spacing.xl },
    subtitle: { fontSize: FontSize.md, fontFamily: 'Jost_400Regular', color: c.textMuted, marginBottom: Spacing.xl, lineHeight: 22 },
    sentContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    sentIconWrap: { marginBottom: Spacing.lg },
    sentTitle: { fontSize: 24, fontFamily: 'CormorantGaramond_600SemiBold', color: c.textPrimary, marginBottom: Spacing.sm },
    sentBody: { fontSize: FontSize.md, fontFamily: 'Jost_400Regular', color: c.textMuted, textAlign: 'center', lineHeight: 22 },
  });
}
