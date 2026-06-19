import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Button } from '../../components/ui/Button';
import { Icon, type IconName } from '../../components/ui/Icon';
import { useColors } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithApple, signInWithGoogle } from '../../lib/socialAuth';
import { supabase } from '../../lib/supabase';

// Google's official "G" logo as an inline SVG. Allowed under Google's brand
// guidelines when used as the icon on a sign-in button.
function GoogleGLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <Path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <Path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <Path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </Svg>
  );
}

// Treat null/empty as missing. Treat strings that contain dots/underscores
// or look like a UUID/hex blob as machine-generated (Supabase fallback,
// Apple's `sub`, etc.) so we know to prompt the user for a real name.
function isHumanName(n: string | null | undefined): boolean {
  if (!n) return false;
  const v = n.trim();
  if (v.length < 1 || v.length > 60) return false;
  if (/[._]/.test(v)) return false;
  if (/^[0-9a-f-]{16,}$/i.test(v.replace(/\s/g, ''))) return false;
  return true;
}

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useColors();
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Shared post-sign-in routing for any social provider. Read the profile,
  // then send the user to home / name prompt / onboarding as appropriate.
  const routeAfterSocial = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete, display_name')
      .eq('id', userId)
      .maybeSingle();
    if (profile?.onboarding_complete) {
      router.replace('/(tabs)/chat' as any);
      return;
    }
    if (!isHumanName(profile?.display_name)) {
      router.replace('/(auth)/onboarding/name' as any);
    } else {
      router.replace('/(auth)/onboarding/step1-basics');
    }
  };

  const handleApple = async () => {
    setAppleLoading(true);
    const { user, error } = await signInWithApple();
    setAppleLoading(false);
    if (error) {
      Alert.alert('Apple Sign In Failed', error.message);
      return;
    }
    if (!user) return;
    await routeAfterSocial(user.id);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { user, error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) {
      Alert.alert('Google Sign In Failed', error.message);
      return;
    }
    if (!user) return;
    await routeAfterSocial(user.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.cherry, Colors.cherryDark, '#6B2D40']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.hero}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
            />
            <Text style={styles.appName}>Atossa</Text>
            <Text style={styles.tagline}>
              Your personal health companion.{'\n'}Track, predict, and understand your body.
            </Text>
          </View>

          <View style={styles.features}>
            {([
              { icon: 'calendar', text: 'Track your cycle & symptoms' },
              { icon: 'sparkles', text: 'Predict your next period & fertile window' },
              { icon: 'heart', text: 'Log pain, mood, and medications daily' },
              { icon: 'bell', text: 'Emergency alerts for loved ones' },
            ] as { icon: IconName; text: string }[]).map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <Icon name={f.icon} size={24} color={Colors.white} />
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.buttons}>
            {Platform.OS === 'ios' && (
              appleLoading ? (
                <View style={styles.socialLoading}>
                  <ActivityIndicator color={Colors.white} />
                </View>
              ) : (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={Radius.md}
                  style={styles.appleBtn}
                  onPress={handleApple}
                />
              )
            )}
            {googleLoading ? (
              <View style={styles.socialLoading}>
                <ActivityIndicator color={Colors.white} />
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleGoogle}
                activeOpacity={0.85}
                style={styles.googleBtn}
              >
                <GoogleGLogo size={20} />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>
            )}
            <Button
              label="Sign up with email"
              onPress={() => router.push('/(auth)/register')}
              size="lg"
              fullWidth
              variant="ghost"
              style={styles.secondaryBtn}
            />
            <Button
              label="I already have an account"
              onPress={() => router.push('/(auth)/login')}
              variant="ghost"
              size="lg"
              fullWidth
              style={styles.tertiaryBtn}
              textStyle={{ color: 'rgba(255,255,255,0.85)' }}
            />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cherry },
  gradient: { flex: 1 },
  content: { flex: 1, padding: Spacing.xl, justifyContent: 'space-between' },
  hero: { alignItems: 'center', paddingTop: Spacing.xl },
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  appName: {
    fontSize: 52,
    fontFamily: 'Fraunces_400Regular_Italic',
    color: Colors.white,
    letterSpacing: 3,
  },
  tagline: {
    fontSize: FontSize.lg,
    fontFamily: 'Fraunces_400Regular',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 26,
  },
  features: { gap: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureText: { fontSize: FontSize.md, fontFamily: 'Fraunces_400Regular', color: Colors.white, flex: 1 },
  buttons: { gap: Spacing.sm },
  appleBtn: { height: 52, width: '100%' },
  socialLoading: { height: 52, alignItems: 'center', justifyContent: 'center' },
  googleBtn: {
    height: 52,
    width: '100%',
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  googleBtnText: {
    fontSize: FontSize.md,
    fontFamily: 'Fraunces_500Medium',
    color: '#1F1F1F',
  },
  secondaryBtn: { backgroundColor: 'rgba(255,255,255,0.15)' },
  tertiaryBtn: { backgroundColor: 'transparent' },
});
