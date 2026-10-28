import React from 'react';
import { Linking, Platform } from 'react-native';
import { space } from '../../constants/atossaUI';
import { Button, Card, ScreenLarge, Txt } from '../../components/atossa/kit';

const SUPPORT_EMAIL = 'zamaniziba18@gmail.com';

// The web build has no Apple or Google button, so it does not send people to one.
const BODY = (Platform.OS === 'web'
  ? 'Resetting a password isn’t available in the app yet. Email us from the address you signed up with and we can delete the account so you can start again. '
  : 'Resetting a password isn’t available in the app yet. If you signed up with Apple or Google, use that button on the sign-in screen. Otherwise, email us from the address you signed up with and we can delete the account so you can start again. ')
  + 'For your privacy we can’t give anyone access to saved notes by email.';

export default function ForgotPasswordScreen() {
  return (
    <ScreenLarge title="Forgot password?" back={{ label: 'Sign in' }}>
      <Card style={{ gap: space.sm }}>
        <Txt variant="body">
          {BODY}
        </Txt>
        <Txt variant="headline" selectable>{SUPPORT_EMAIL}</Txt>
      </Card>
      <Button
        label="Email support"
        icon="send"
        style={{ marginTop: space.xxl }}
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Atossa password help')}`).catch(() => {})}
      />
    </ScreenLarge>
  );
}
