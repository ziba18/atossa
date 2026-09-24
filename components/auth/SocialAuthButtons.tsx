import React, { useState } from 'react';
import { View, Pressable, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { UI } from '../../constants/atossaUI';
import { InlineError, Txt } from '../atossa/kit';
import { GoogleGLogo } from './GoogleGLogo';
import { signInWithApple, signInWithGoogle } from '../../lib/socialAuth';
import { routeAfterSignIn } from '../../lib/authRouting';
import { useAuthStore } from '../../stores/authStore';

const C = UI.colors;

/** Apple (iOS only) and Google sign-in, with an optional "or" divider above them. */
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

  return (
    <View style={{ gap: 12 }}>
      {divider ? (
        <View style={styles.dividerRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.line} />
          <Txt variant="small">or</Txt>
          <View style={styles.line} />
        </View>
      ) : null}

      {Platform.OS === 'ios' ? (
        busy === 'apple' ? (
          <View style={styles.loading}><ActivityIndicator color={C.foreground} /></View>
        ) : (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              mode === 'signup'
                ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={UI.radius}
            style={styles.apple}
            onPress={() => run('apple')}
          />
        )
      ) : null}

      {busy === 'google' ? (
        <View style={styles.loading}><ActivityIndicator color={C.foreground} /></View>
      ) : (
        <Pressable
          onPress={() => run('google')}
          disabled={busy !== null}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          style={({ pressed }) => [styles.google, pressed && { opacity: 0.85 }]}
        >
          <GoogleGLogo size={22} />
          <Txt variant="bodyBold">Continue with Google</Txt>
        </Pressable>
      )}

      <InlineError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  apple: { height: UI.minTap, width: '100%' },
  loading: { height: UI.minTap, alignItems: 'center', justifyContent: 'center' },
  google: {
    minHeight: UI.minTap, borderRadius: UI.radius, borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
});
