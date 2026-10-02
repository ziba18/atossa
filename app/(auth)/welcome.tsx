import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, layout, space } from '../../constants/atossaUI';
import { Button, Txt } from '../../components/atossa/kit';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';

/**
 * One calm screen: Inter wordmark, a single serif hero line (the one-serif-line-per-hero rule
 * from Today), one plain sentence, then the actions anchored low. No imagery.
 */
export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.column} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Txt variant="headline" color={colors.ink2} accessibilityRole="header">Atossa</Txt>
        </View>

        <View style={styles.hero}>
          <Txt variant="hero">Your body, in your words.</Txt>
          <Txt variant="body" color={colors.ink2}>
            Put your symptoms into words, and bring a clear summary to your doctor.
          </Txt>
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
  actions: { gap: space.xs },
});
