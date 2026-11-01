import React from 'react';
import { Linking, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, space } from '../../constants/atossaUI';
import { Button, Card, ScreenLarge, Txt } from '../../components/atossa/kit';
import { PreLoginHelp } from '../../components/help/PreLoginHelp';
import { usePageTitle } from '../../lib/usePageTitle';

// The one place the support address lives. Empty until the owner picks one (set EXPO_PUBLIC_SUPPORT_EMAIL
// or type it here): while it is empty the screen shows no address and no mail button.
const SUPPORT_EMAIL: string = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? '';

// Safety C154 wording A. The web build has no Apple or Google button, so it leaves that sentence out.
const BODY = (Platform.OS === 'web'
  ? 'You can’t reset your password in the app yet. '
  : 'You can’t reset your password in the app yet. If you signed up with Apple or Google, use that button on the sign-in screen. ')
  + 'Otherwise, email us from the address you signed up with and tell us what happened. Your saved notes are not deleted.';

export default function ForgotPasswordScreen() {
  usePageTitle('Forgot password');
  const router = useRouter();
  const short = useWindowDimensions().height < 640; // 320x568: the card and its address stay above the pinned button
  // The button sits in the pinned bar, so it is on screen at every phone height (320x568 included).
  const footer = SUPPORT_EMAIL ? (
    <Button
      label="Email support"
      icon="send"
      onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Atossa password help')}`).catch(() => {})}
    />
  ) : (
    <Button
      label="Back to sign in"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
    />
  );
  return (
    <ScreenLarge title="Forgot password?" back={{ label: 'Sign in' }} footer={footer}>
      <PreLoginHelp style={{ marginBottom: short ? space.xs : space.md }} />
      <Card style={{ gap: space.sm }}>
        <Txt variant={short ? 'secondary' : 'body'} color={colors.ink}>
          {BODY}
        </Txt>
        {SUPPORT_EMAIL ? <Txt variant="headline" selectable>{SUPPORT_EMAIL}</Txt> : null}
      </Card>
    </ScreenLarge>
  );
}
