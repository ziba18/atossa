import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, layout, space } from '../../constants/atossaUI';
import { Button, Card, Quote, Txt } from '../../components/atossa/kit';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { track } from '../../lib/analytics';

/**
 * One calm screen: Inter wordmark, a single serif hero line (the one-serif-line-per-hero rule
 * from Today), one plain sentence, then the actions anchored low. No imagery.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  useEffect(() => track('Welcome Viewed'), []);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.column} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Txt variant="headline" color={colors.ink2} accessibilityRole="header">Atossa</Txt>
        </View>

        <View style={styles.hero}>
          <Txt variant="hero">Your body, in your words.</Txt>
          <Txt variant="body" color={colors.ink2}>
            Say it the way you'd tell a friend. Atossa tidies it into a clear summary for your doctor.
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
  screen: { flex: 1, backgroundColor: colors.canvas },
  column: {
    flexGrow: 1, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center',
    paddingHorizontal: layout.gutter, paddingBottom: space.xl,
  },
  top: { minHeight: 44, justifyContent: 'center', paddingTop: space.sm },
  hero: { flexGrow: 1, justifyContent: 'center', gap: space.sm, paddingVertical: space.huge },
  example: { gap: space.xs, marginTop: space.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  tag: { backgroundColor: colors.plumTint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontWeight: '600' },
  actions: { gap: space.xs },
});
