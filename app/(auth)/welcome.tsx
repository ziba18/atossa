import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, layout, space } from '../../constants/atossaUI';
import { Button, Card, Quote, Txt, useReduceMotion } from '../../components/atossa/kit';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { track } from '../../lib/analytics';
import { usePageTitle } from '../../lib/usePageTitle';

const WAVE = [0.3, 0.6, 0.9, 0.5, 1, 0.7, 0.4, 0.8, 0.55, 0.9, 0.35, 0.6, 0.25];
const STEPS = [
  { word: 'Say it', line: 'Speak or type' },
  { word: 'See it', line: 'Notes line up by date' },
  { word: 'Show it', line: 'A summary for your doctor' },
];

/**
 * One calm screen: Inter wordmark, a single serif hero line (the one-serif-line-per-hero rule
 * from Today), one plain sentence, then the actions anchored low. One illustration: the waveform resting on a line of text.
 */
export default function WelcomeScreen() {
  usePageTitle('Welcome');
  const router = useRouter();
  // Short phones (iPhone SE class): keep the buttons on the first screen, drop the step strip.
  const win = useWindowDimensions();
  const short = win.height < 700;
  const narrow = win.width < 300; // 200% text on a small phone: three columns would break words
  useEffect(() => track('Welcome Viewed'), []);
  // One 400 ms rise of the waveform on first paint; nothing moves under Reduce Motion.
  const reduceMotion = useReduceMotion();
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) { rise.setValue(1); return; }
    Animated.timing(rise, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [reduceMotion, rise]);

  return (
    <SafeAreaView role="main" edges={['top', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.column} showsVerticalScrollIndicator={false}>
        <View style={[styles.band, short && { paddingTop: space.xs, paddingBottom: space.xs }]}>
          <LinearGradient
            colors={[colors.plumTint, colors.canvas]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
          />
          <Txt variant="headline" color={colors.plum} accessibilityRole="header" accessibilityLabel="Atossa" style={styles.wordmark}>Atossa</Txt>
          {/* Illustration B: the brand waveform grown large, resting on a line of text (a voice becoming a note). */}
          {short ? null : <View aria-hidden style={styles.art}>
            <Animated.View style={[styles.wave, { opacity: rise, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
              {WAVE.map((h, i) => (
                <View key={i} style={{ width: 4, height: Math.round(8 + h * 40), borderRadius: 2, backgroundColor: i % 3 === 0 ? colors.plum : `${colors.plum}80` }} />
              ))}
            </Animated.View>
            <View style={styles.textLine} />
            <View style={styles.textLine2} />
          </View>}
        </View>

        <View style={[styles.hero, short && styles.heroShort]}>
          <Txt variant="hero" style={short || win.width < 380 ? undefined : styles.heroLine}>Your body, in your words.</Txt>
          <Txt variant="body" color={colors.ink2}>
            Say it the way you’d tell a friend. Atossa tidies it into a clear summary for your doctor.
          </Txt>
          <Card style={styles.example}>
            <Txt variant="caption" color={colors.ink2}>What you say</Txt>
            <Quote>Sharp low belly pain since Tuesday, about a 7 at worst, missed work.</Quote>
            <Txt variant="caption" color={colors.ink2}>What your doctor sees</Txt>
            <View style={styles.tags}>
              {['Lower belly', '7/10 at worst', '3 days'].map((t) => (
                <View key={t} style={styles.tag}>
                  <Txt variant="caption" color={colors.plum} style={styles.tagText}>{t}</Txt>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {short || narrow ? null : <View style={styles.steps} accessibilityLabel="How it works. One, say it. Two, see it. Three, show it.">
          {STEPS.map((st, i) => (
            <View key={st.word} style={styles.step}>
              <View style={styles.stepNum}><Txt variant="caption" color={colors.plum} style={styles.tagText}>{i + 1}</Txt></View>
              <Txt variant="headline">{st.word}</Txt>
              <Txt variant="caption" color={colors.ink2} style={{ textAlign: 'center' }}>{st.line}</Txt>
            </View>
          ))}
        </View>}

        {short ? null : <Txt variant="caption" color={colors.ink2} style={{ textAlign: 'center', marginBottom: space.sm }}>
          Atossa never diagnoses. It keeps your notes in your words.
        </Txt>}

        <View style={[styles.actions, short && { marginTop: 0 }]}>
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
  heroLine: { fontSize: 36, lineHeight: 42 },
  art: { alignItems: 'center', gap: space.xs, paddingVertical: space.xs },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 48 },
  // Two ruled lines under the waveform (a voice becoming written text); thin so they never read as a progress bar.
  textLine: { width: 148, height: 3, borderRadius: 2, backgroundColor: colors.plum, marginTop: 2 },
  textLine2: { width: 92, height: 3, borderRadius: 2, backgroundColor: `${colors.plum}66`, marginTop: 6, alignSelf: 'center' },
  steps: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  step: { flex: 1, alignItems: 'center', gap: 4 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.plumTint, alignItems: 'center', justifyContent: 'center' },
  // Top-weighted: the promise sits in the upper third, the spare room falls between the card and the
  // anchored actions (not above the headline).
  hero: { flexGrow: 1, justifyContent: 'flex-start', gap: space.sm, paddingTop: space.sm, paddingBottom: space.lg },
  heroShort: { paddingTop: 0, paddingBottom: space.sm, gap: space.xs },
  example: { gap: space.xs, marginTop: space.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  tag: { backgroundColor: colors.plumTint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontWeight: '600' },
  actions: { gap: space.xs },
});
