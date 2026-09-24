import React from 'react';
import { View, Linking } from 'react-native';
import { BackButton, BigButton, Card, PageTitle, Screen, Txt } from '../../components/atossa/kit';

const SUPPORT_EMAIL = 'zamaniziba18@gmail.com';

export default function ForgotPasswordScreen() {
  return (
    <Screen header={false} edges={['top', 'bottom']}>
      <BackButton label="Back" />
      <View style={{ marginTop: 20 }}>
        <PageTitle title="Forgot your password?" />
      </View>
      <Card tone="blue" style={{ marginTop: 16, gap: 12 }}>
        <Txt variant="body">
          Resetting a password by email isn’t available in the app yet. Email us from the address you signed up with and we’ll help you get back in.
        </Txt>
        <Txt variant="bodyBold">{SUPPORT_EMAIL}</Txt>
      </Card>
      <BigButton
        label="Email support"
        icon="send"
        style={{ marginTop: 20 }}
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Atossa password help')}`).catch(() => {})}
      />
    </Screen>
  );
}
