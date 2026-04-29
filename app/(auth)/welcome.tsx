import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Icon, type IconName } from '../../components/ui/Icon';
import { useColors } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useColors();

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
            <Button
              label="Get Started"
              onPress={() => router.push('/(auth)/register')}
              size="lg"
              fullWidth
              style={styles.primaryBtn}
              textStyle={{ color: Colors.cherry }}
            />
            <Button
              label="I already have an account"
              onPress={() => router.push('/(auth)/login')}
              variant="ghost"
              size="lg"
              fullWidth
              style={styles.secondaryBtn}
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
  primaryBtn: { backgroundColor: Colors.white },
  secondaryBtn: { backgroundColor: 'rgba(255,255,255,0.15)' },
});
