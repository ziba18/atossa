import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fonts, layout, space } from '../../constants/atossaUI';
import { Button, Card, Quote, Txt } from '../../components/atossa/kit';
import { PreLoginHelp } from '../../components/help/PreLoginHelp';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { track } from '../../lib/analytics';
import { usePageTitle } from '../../lib/usePageTitle';
import { isVoiceCaptureSupported } from '../../lib/transcription';

const stepsFor = (voice: boolean) => [
  { word: 'Say it', line: voice ? 'Speak or type' : 'Type it in your own words' },
  { word: 'See it', line: 'Notes line up by date' },
  { word: 'Show it', line: 'A summary for your doctor' },
];

/**
 * One calm screen: wordmark, a single serif hero line (the one-serif-line-per-hero rule
 * from Today), one plain sentence, then the actions anchored low. No imagery.
 */
export default function WelcomeScreen() {
  usePageTitle('Welcome');
  const router = useRouter();
  // Short phones (iPhone SE class): keep the buttons on the first screen, drop the step strip.
  const win = useWindowDimensions();
  const short = win.height < 800; // was 740: the pre-login Help now block needs the room on 740-800 pt phones
  // Mini-size phones (about 780 pt): keep the example, drop the three steps so the buttons stay on the first screen.
  const noSteps = win.height < 900; // was 820; the pre-login Help now block (A214) takes ~70 pt, so 844 pt phones drop the strip to keep both buttons on the first screen
  const narrow = win.width < 300; // 200% text on a small phone: three columns would break words
  const voice = isVoiceCaptureSupported();
  useEffect(() => track('Welcome Viewed'), []);

  return (
    <SafeAreaView role="main" edges={['top', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.column} showsVerticalScrollIndicator={false}>
        <View style={styles.band}>
          <Txt variant="headline" color={colors.plum} accessibilityRole="header" accessibilityLabel="Atossa" style={styles.wordmark}>Atossa</Txt>
        </View>

        <PreLoginHelp />

        <View style={styles.hero}>
          <Txt variant="hero" style={short || win.width < 380 ? undefined : styles.heroLine}>
            Note how you feel.{'\n'}
            <Txt variant="hero" color={colors.plum} style={short || win.width < 380 ? undefined : styles.heroLine}>Bring a summary.</Txt>
          </Txt>
          <Txt variant="body" color={colors.ink2}>
            {voice ? 'Talk or type' : 'Type'} about your symptoms in your own words. Atossa turns them into a short summary for your doctor.
          </Txt>
          {/* Short phones: no quote, only the three chips, so the gap above the buttons is not empty; under 600 pt tall the buttons need the room. */}
          {short && win.height < 600 ? null : (
          <Card style={short ? styles.exampleShort : styles.example}>
            {short ? null : <Txt variant="caption" color={colors.ink2}>What you say</Txt>}
            {short ? null : <Quote>Sharp low belly pain since Tuesday, about a 7 at worst, missed work.</Quote>}
            <Txt variant="caption" color={colors.ink2}>{short ? 'Your words become notes like these' : 'What your doctor sees'}</Txt>
            <View style={styles.tags}>
              {['Lower belly', '7/10 at worst', 'Since Tuesday'].map((t) => (
                <View key={t} style={styles.tag}>
                  <Txt variant="caption" color={colors.plum} style={styles.tagText}>{t}</Txt>
                </View>
              ))}
            </View>
          </Card>
          )}
        </View>

        {short || noSteps || narrow ? null : <View style={styles.steps} accessibilityLabel="How it works. One, say it. Two, see it. Three, show it.">
          {stepsFor(voice).map((st, i) => (
            <View key={st.word} style={styles.step}>
              <View style={styles.stepNum}><Txt variant="caption" color={colors.ink} style={styles.tagText}>{i + 1}</Txt></View>
              <Txt variant="headline">{st.word}</Txt>
              <Txt variant="caption" color={colors.ink2}>{st.line}</Txt>
            </View>
          ))}
        </View>}

        <Txt variant="caption" color={colors.ink2} style={{ marginBottom: short ? space.sm : space.xxs }}>
          Free to use. Nothing to buy inside the app. You need an account.
        </Txt>
        <Txt variant="caption" color={colors.ink2} style={{ marginBottom: space.sm }}>
          Atossa doesn’t diagnose or give medical advice.
        </Txt>

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
  screen: { flex: 1, backgroundColor: colors.canvas },
  column: {
    flexGrow: 1, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center',
    paddingHorizontal: layout.gutter, paddingBottom: space.xl,
  },
  // Full-bleed band: the column's gutter is cancelled so the wash runs to the screen edges.
  band: { marginHorizontal: -layout.gutter, paddingHorizontal: layout.gutter, paddingTop: space.md, paddingBottom: space.sm, gap: space.xs },
  wordmark: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, fontWeight: '400' },
  heroLine: { fontSize: 34, lineHeight: 40 },
  steps: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  step: { flex: 1, alignItems: 'flex-start', gap: 4 },
  stepNum: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.ink2, alignItems: 'center', justifyContent: 'center' },
  // Top-weighted: the promise sits in the upper third, the spare room falls between the card and the
  // anchored actions (not above the headline).
  hero: { flexGrow: 1, justifyContent: 'flex-start', gap: space.sm, paddingTop: space.sm, paddingBottom: space.lg },
  example: { gap: space.xs, marginTop: space.sm },
  exampleShort: { gap: space.xs, marginTop: space.sm, paddingVertical: space.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  tag: { backgroundColor: colors.plumTint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontWeight: '600' },
  actions: { gap: space.xs },
});
