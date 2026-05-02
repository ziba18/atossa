import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Icon, type IconName } from '../../components/ui/Icon';
import { useColors } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithApple } from '../../lib/socialAuth';
import { supabase } from '../../lib/supabase';

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useColors();
  const [appleLoading, setAppleLoading] = useState(false);

  const handleApple = async () => {
    setAppleLoading(true);
    const { user, error } = await signInWithApple();
    setAppleLoading(false);
    if (error) {
      Alert.alert('Apple Sign In Failed', error.message);
      return;
    }
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.onboarding_complete) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/(auth)/onboarding/step1-basics');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.cherry, Colors.cherryDark, '#6B0020']}
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
              { icon: 'sparkles', text: 'Predict irregular periods with AI' },
              { icon: 'stethoscope', text: 'Detect PCOS & health risks' },
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
                <View style={styles.appleLoading}>
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
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.white,
    letterSpacing: 3,
  },
  tagline: {
    fontSize: FontSize.lg,
    fontFamily: 'Jost_400Regular',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 26,
  },
  features: { gap: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureText: { fontSize: FontSize.md, fontFamily: 'Jost_400Regular', color: Colors.white, flex: 1 },
  buttons: { gap: Spacing.sm },
  appleBtn: { height: 52, width: '100%' },
  appleLoading: { height: 52, alignItems: 'center', justifyContent: 'center' },
  secondaryBtn: { backgroundColor: 'rgba(255,255,255,0.15)' },
  tertiaryBtn: { backgroundColor: 'transparent' },
});
