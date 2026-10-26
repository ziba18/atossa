import { resetOnboardingSteps } from '../../components/auth/OnboardingScreen';
import React, { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, layout, space } from '../../constants/atossaUI';
import { Button, Card, Quote, Txt } from '../../components/atossa/kit';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { track } from '../../lib/analytics';

const STEPS = [
  // Browsers have no voice capture here, so the web pilot only promises typing.
  Platform.OS === 'web' ? 'Tell Atossa how you feel, in your own words.' : 'Tell Atossa how you feel, by voice or text.',
  'Atossa asks only for what is missing.',
  'Show your doctor a clear summary.',
];

/**
 * One calm screen: Inter wordmark, a single serif hero line (the one-serif-line-per-hero rule
 * from Today), one plain sentence, then the actions anchored low. No imagery.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  useEffect(() => { resetOnboardingSteps(); track('Welcome Viewed'); }, []);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.column} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Txt variant="caption" color={colors.plum} accessibilityRole="header" accessibilityLabel="Atossa" style={styles.wordmark}>ATOSSA</Txt>
        </View>

        <View style={styles.hero}>
          <Txt variant="hero">Your body, in your words.</Txt>
          <Txt variant="body" color={colors.ink2}>
            Say it the way you’d tell a friend. Atossa tidies it into a clear summary for your doctor.
          </Txt>
          <Card style={styles.example}>
            <Txt variant="caption" color={colors.ink2}>What you say</Txt>
            <Quote>Sharp low belly pain since Tuesday, worse in the evening, missed work.</Quote>
            <Txt variant="caption" color={colors.ink2}>What your doctor sees</Txt>
            <View style={styles.tags}>
              {['Lower belly', '7/10 at worst', '3 days'].map((t) => (
                <View key={t} style={styles.tag}>
                  <Txt variant="caption" color={colors.plum} style={styles.tagText}>{t}</Txt>
                </View>
              ))}
            </View>
          </Card>
          <View style={styles.steps}>
            {STEPS.map((t, i) => (
              <View key={t} style={styles.step}>
                <View style={styles.stepNum}>
                  <Txt variant="caption" color={colors.plum} style={styles.tagText}>{i + 1}</Txt>
                </View>
                <Txt variant="secondary" style={styles.stepText}>{t}</Txt>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Button label="Create an account" onPress={() => router.push('/(auth)/register')} />
          <Button label="I already have an account" variant="text" onPress={() => router.push('/(auth)/login')} />
          <SocialAuthButtons mode="signup" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Quiet brand mark: spaced capitals in plum, so it never competes with the serif hero line.
  wordmark: { fontSize: 15, letterSpacing: 3, fontWeight: '600' },
  screen: { flex: 1, backgroundColor: colors.canvas },
  column: {
    flexGrow: 1, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center',
    paddingHorizontal: layout.gutter, paddingBottom: space.xl,
  },
  top: { minHeight: 44, justifyContent: 'center', paddingTop: space.sm },
  // Top-weighted: the promise sits in the upper third, the spare room falls between the card and the
  // anchored actions (not above the headline).
  hero: { flexGrow: 1, justifyContent: 'flex-start', gap: space.sm, paddingTop: space.xxl, paddingBottom: space.xl },
  example: { gap: space.xs, marginTop: space.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  tag: { backgroundColor: colors.plumTint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontWeight: '600' },
  steps: { gap: space.sm, marginTop: space.lg },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.plumTint,
    alignItems: 'center', justifyContent: 'center',
  },
  stepText: { flex: 1 },
  actions: { gap: space.xs },
});
