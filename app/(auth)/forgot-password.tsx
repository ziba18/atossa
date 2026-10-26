import React from 'react';
import { Linking } from 'react-native';
import { space } from '../../constants/atossaUI';
import { Button, Card, ScreenLarge, Txt } from '../../components/atossa/kit';

const SUPPORT_EMAIL = 'zamaniziba18@gmail.com';

export default function ForgotPasswordScreen() {
  return (
    <ScreenLarge title="Forgot your password?" back={{ label: 'Sign in' }}>
      <Card style={{ gap: space.sm }}>
        <Txt variant="body">
          Resetting a password isn’t available in the app yet. If you signed up with Apple or Google, use that button on the sign-in screen. Otherwise, email us from the address you signed up with and we can delete the account so you can start again. For your privacy we can’t give anyone access to saved notes by email.
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
