import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, layout, space } from '../../../constants/atossaUI';
import { Button, Card, InlineError, SwitchRow, Txt } from '../../../components/atossa/kit';
import { openLegal } from '../../../components/auth/LegalLinks';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { CONSENT_VERSION, routeAfterSignIn } from '../../../lib/authRouting';

// Explicit consent for health information (UK GDPR art. 9(2)(a)). Wording: agents/safety/consent-copy-draft.md,
// owner/lawyer review pending. Change the text => raise CONSENT_VERSION so people are asked again.
export default function OnboardingConsentScreen() {
  const router = useRouter();
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!agreed || loading) return;
    setLoading(true);
    setError('');
    try {
      await api.patch('/me', { consent_version: CONSENT_VERSION });
      await fetchProfile();
      router.replace(routeAfterSignIn(useAuthStore.getState().profile) as any);
    } catch {
      setError('We couldn’t save your choice. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.column} showsVerticalScrollIndicator={false}>
      <Txt variant="largeTitle" accessibilityRole="header" style={styles.title}>Before you start</Txt>
      <Card>
        <Txt variant="body">Atossa saves what you tell it so you can show your doctor a clear summary.</Txt>
        <Txt variant="body" style={{ marginTop: space.md }}>What you save is health information. It is stored on our server and linked to your account.</Txt>
        <Txt variant="body" style={{ marginTop: space.md }}>Only you can see it. We don’t sell it or use it for adverts.</Txt>
        <Txt variant="body" style={{ marginTop: space.md }}>You can delete single notes, or your whole account, any time in the app.</Txt>
      </Card>
      <View style={{ marginTop: space.xl }}>
        <SwitchRow label="I agree to Atossa saving my health information as described." value={agreed} onChange={setAgreed} />
      </View>
      <Txt variant="secondary" color={colors.plum} onPress={() => openLegal('privacy')} accessibilityRole="link" style={{ marginTop: space.md }}>
        Read the privacy policy
      </Txt>
      <View style={{ marginTop: space.xxl, gap: space.sm }}>
        <InlineError message={error} />
        <Button label={loading ? 'Saving…' : 'Continue'} loading={loading} disabled={!agreed} onPress={handleContinue} />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Same column as the onboarding screens, without their step strip (this is not a numbered step).
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  column: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', paddingHorizontal: layout.gutter, paddingBottom: space.xxxl },
  title: { paddingTop: 44 + space.sm, marginBottom: space.xxl },
});
