import React from 'react';
import { View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { UI } from '../../constants/atossaUI';
import { BigButton, Card, Screen, Txt } from '../../components/atossa/kit';
import { Icon, type IconName } from '../../components/ui/Icon';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';

const C = UI.colors;

const POINTS: { icon: IconName; text: string }[] = [
  { icon: 'message-circle', text: 'Tell Atossa how you feel, in your own words' },
  { icon: 'calendar', text: 'Keep appointments, medicines and your history in one place' },
  { icon: 'file-text', text: 'Share a clear summary with your doctor' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen header={false} edges={['top', 'bottom']}>
      <View style={{ alignItems: 'center', marginTop: 12 }}>
        <Image source={require('../../assets/icon.png')} style={{ width: 112, height: 112, borderRadius: 56 }} accessibilityIgnoresInvertColors />
        <Txt variant="display" style={{ fontSize: 52, lineHeight: 60, marginTop: 12 }}>Atossa</Txt>
        <Txt variant="body" color={C.mutedForeground} style={{ textAlign: 'center', marginTop: 4 }}>
          Put your symptoms into words, and bring a clear summary to your doctor.
        </Txt>
      </View>

      <Card tone="green" style={{ marginTop: 28, gap: 16 }}>
        {POINTS.map((p) => (
          <View key={p.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Icon name={p.icon} size={26} color={C.secondaryForeground} />
            <Txt variant="body" style={{ flex: 1 }}>{p.text}</Txt>
          </View>
        ))}
      </Card>

      <View style={{ marginTop: 28, gap: 12 }}>
        <BigButton label="Sign up with email" icon="user" onPress={() => router.push('/(auth)/register')} />
        <BigButton label="I already have an account" variant="outline" onPress={() => router.push('/(auth)/login')} />
        <SocialAuthButtons mode="signup" />
      </View>
    </Screen>
  );
}
