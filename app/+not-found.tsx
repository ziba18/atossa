import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { space } from '../constants/atossaUI';
import { Button, ScreenLarge } from '../components/atossa/kit';
import { HelpNowStrip } from '../components/atossa/HelpNowStrip';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <HelpNowStrip>
    <ScreenLarge title="This page doesn’t exist" subtitle="That link may be out of date.">
      <View style={{ gap: space.xs }}>
        <Button label="Go to Today" onPress={() => router.replace('/(tabs)/today' as any)} />
        <Button label="Go back" variant="text" onPress={() => router.back()} />
      </View>
    </ScreenLarge>
    </HelpNowStrip>
  );
}
