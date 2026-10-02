import React, { useState } from 'react';
import { View, Pressable, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { isRunningInExpoGo } from 'expo';
import { useRouter } from 'expo-router';
import { colors, heights, radii, space } from '../../constants/atossaUI';
import { InlineError, Txt } from '../atossa/kit';
import { GoogleGLogo } from './GoogleGLogo';
import { signInWithApple, signInWithGoogle } from '../../lib/socialAuth';
import { routeAfterSignIn } from '../../lib/authRouting';
import { useAuthStore } from '../../stores/authStore';

// Expo Go has no native view for Apple's button, and Apple sign-in can't work
// there anyway (the token is issued for Expo Go's bundle id, not Atossa's).
// Google's native module isn't in Expo Go either, so there both are swapped for a note.
const IN_EXPO_GO = isRunningInExpoGo();
const SHOW_APPLE = Platform.OS === 'ios' && !IN_EXPO_GO;

/**
 * Apple (iOS only) and Google sign-in, with an optional "or" divider above them.
 * Apple uses its own native button (black, per Apple's HIG); Google is a white outline pill with
 * the full-colour "G" (per Google's branding rules). Both 48 tall, pill-shaped like the kit buttons.
 */
export function SocialAuthButtons({ mode = 'signin', divider = true }: { mode?: 'signin' | 'signup'; divider?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState('');

  const run = async (provider: 'apple' | 'google') => {
    setBusy(provider);
    setError('');
    const { user, error: err } = provider === 'apple' ? await signInWithApple() : await signInWithGoogle();
    setBusy(null);
    if (err) {
      setError(`${provider === 'apple' ? 'Apple' : 'Google'} sign-in didn't work: ${err.message}`);
      return;
    }
    if (user) router.replace(routeAfterSignIn(useAuthStore.getState().profile) as any);
  };

  if (IN_EXPO_GO) {
    return (
      <Txt variant="caption" style={{ textAlign: 'center', marginTop: space.xs }}>
        Apple and Google sign-in only work in the installed app. Use email while testing in Expo Go.
      </Txt>
    );
  }

  return (
    <View style={{ gap: space.sm }}>
      {divider ? (
        <View style={styles.dividerRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.line} />
          <Txt variant="caption">or</Txt>
          <View style={styles.line} />
        </View>
      ) : null}

      {SHOW_APPLE ? (
        busy === 'apple' ? (
          <View style={styles.loading}><ActivityIndicator color={colors.ink} /></View>
        ) : (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              mode === 'signup'
                ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={heights.secondary / 2}
            style={styles.apple}
            onPress={() => run('apple')}
          />
        )
      ) : null}

      {busy === 'google' ? (
        <View style={styles.loading}><ActivityIndicator color={colors.ink} /></View>
      ) : (
        <Pressable
          onPress={() => run('google')}
          disabled={busy !== null}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          style={({ pressed }) => [styles.google, pressed && { backgroundColor: colors.sunken }]}
        >
          <GoogleGLogo size={20} />
          <Txt variant="headline">Continue with Google</Txt>
        </Pressable>
      )}

      <InlineError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginVertical: space.xxs },
  line: { flex: 1, height: 1, backgroundColor: colors.hairline },
  apple: { height: heights.secondary, width: '100%' },
  loading: { height: heights.secondary, alignItems: 'center', justifyContent: 'center' },
  google: {
    minHeight: heights.secondary, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: space.sm, paddingHorizontal: space.lg,
  },
});
