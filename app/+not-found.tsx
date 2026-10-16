import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { space } from '../constants/atossaUI';
import { Button, ScreenLarge } from '../components/atossa/kit';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <ScreenLarge title="This page doesn’t exist" subtitle="Something went wrong with that link.">
      <View style={{ gap: space.xs }}>
        <Button label="Go to Today" onPress={() => router.replace('/(tabs)/today' as any)} />
        <Button label="Go back" variant="text" onPress={() => router.back()} />
      </View>
    </ScreenLarge>
  );
}
