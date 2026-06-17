import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { signInWithApple } from '../../lib/socialAuth';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { FontSize, Spacing, Radius } from '../../constants/theme';

type Mode = 'signin' | 'signup';

interface Props {
  mode?: Mode;
  /** Override the divider label shown above the Apple button. */
  dividerLabel?: string;
}

export function SocialAuthButtons({ mode = 'signin', dividerLabel }: Props) {
  const router = useRouter();
  const theme = useColors();
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(false);

  if (Platform.OS !== 'ios') return null;

  const buttonType =
    mode === 'signup'
      ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
      : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN;

  const handlePostAuth = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.onboarding_complete) {
      router.replace('/(tabs)/chat' as any);
    } else {
      router.replace('/(auth)/onboarding/step1-basics');
    }
  };

  const handleApple = async () => {
    setLoading(true);
    const { user, error } = await signInWithApple();
    setLoading(false);
    if (error) {
      Alert.alert('Apple Sign In Failed', error.message);
      return;
    }
    if (user) await handlePostAuth(user.id);
  };

  const label = dividerLabel ?? (mode === 'signup' ? 'or sign up with' : 'or continue with');

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>{label}</Text>
        <View style={styles.line} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={theme.textPrimary} />
        </View>
      ) : (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={buttonType}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={Radius.md}
          style={styles.appleBtn}
          onPress={handleApple}
        />
      )}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { marginTop: Spacing.sm },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
    line: { flex: 1, height: 1, backgroundColor: c.border },
    dividerText: {
      marginHorizontal: Spacing.md,
      fontSize: FontSize.sm,
      fontFamily: 'Fraunces_400Regular',
      color: c.textMuted,
    },
    appleBtn: { height: 50, width: '100%' },
    loadingBox: { height: 50, alignItems: 'center', justifyContent: 'center' },
  });
}
