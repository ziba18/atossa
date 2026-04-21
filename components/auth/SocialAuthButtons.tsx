import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../../lib/supabase';
import { signInWithGoogle, signInWithApple } from '../../lib/socialAuth';
import { Colors } from '../../constants/colors';
import { FontSize, Spacing, Radius } from '../../constants/theme';

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </Svg>
  );
}

export function SocialAuthButtons() {
  const router = useRouter();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);

  const handlePostAuth = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.onboarding_complete) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/(auth)/onboarding/step1-basics');
    }
  };

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    const { user, error } = await signInWithGoogle();
    setLoadingGoogle(false);
    if (error) {
      Alert.alert('Google Sign In Failed', error.message);
      return;
    }
    if (user) await handlePostAuth(user.id);
  };

  const handleApple = async () => {
    setLoadingApple(true);
    const { user, error } = await signInWithApple();
    setLoadingApple(false);
    if (error) {
      Alert.alert('Apple Sign In Failed', error.message);
      return;
    }
    if (user) await handlePostAuth(user.id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity
        style={[styles.socialBtn, loadingGoogle && styles.disabled]}
        onPress={handleGoogle}
        disabled={loadingGoogle}
        activeOpacity={0.8}
      >
        {loadingGoogle ? (
          <ActivityIndicator size="small" color={Colors.textPrimary} />
        ) : (
          <GoogleLogo size={20} />
        )}
        <Text style={styles.socialBtnText}>Continue with Google</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={Radius.md}
          style={styles.appleBtn}
          onPress={handleApple}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: FontSize.sm,
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginBottom: Spacing.md,
  },
  disabled: {
    opacity: 0.6,
  },
  socialBtnText: {
    fontSize: FontSize.md,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.textPrimary,
  },
  appleBtn: {
    height: 50,
    width: '100%',
  },
});
