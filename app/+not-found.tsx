import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { BigButton, PageTitle, Screen } from '../components/atossa/kit';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen header={false} edges={['top', 'bottom']}>
      <PageTitle title="This page doesn’t exist" subtitle="Something went wrong with that link." />
      <View style={{ marginTop: 24, gap: 12 }}>
        <BigButton label="Go to Chat" icon="message-circle" onPress={() => router.replace('/(tabs)/chat' as any)} />
        <BigButton label="Go back" icon="arrow-left" variant="outline" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
