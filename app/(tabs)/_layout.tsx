import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { MainTabBar } from '../../components/atossa/MainTabBar';
import { CaptureSheet } from '../../components/atossa/capture/CaptureSheet';
import { LoadingScreen } from '../../components/atossa/kit';
import { colors } from '../../constants/atossaUI';
import { useAuthStore } from '../../stores/authStore';
import { useRecordsStore } from '../../stores/recordsStore';

export default function TabsLayout() {
  const userId = useAuthStore((s) => s.user?.id);
  const loadedFor = useRecordsStore((s) => s.loadedFor);
  const hasSession = useAuthStore((s) => !!s.session);
  const authReady = useAuthStore((s) => s.isInitialized);

  // Keep the user's records in step with whoever is signed in.
  useEffect(() => {
    const store = useRecordsStore.getState();
    if (!userId) {
      store.reset();
      return;
    }
    if (loadedFor && loadedFor !== userId) store.reset();
    if (loadedFor !== userId) store.load(userId);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Web only: someone who types /today or /profile into the address bar while signed out goes to Welcome
  // instead of an empty app. (On a phone the tabs are only reached after sign-in.)
  if (Platform.OS === 'web') {
    if (!authReady) return <LoadingScreen message="Opening Atossa…" />;
    if (!hasSession) return <Redirect href={'/(auth)/welcome' as any} />;
  }

  return (
    <>
    <Tabs tabBar={(props) => <MainTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.canvas } }}>
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen name="timeline" options={{ title: 'Timeline' }} />
      <Tabs.Screen name="doctor" options={{ title: 'For my doctor' }} />
      {/* Reached from the avatar (HeaderAvatar) top-right on every tab; MainTabBar only draws VISIBLE_TABS. No href:null, which sent web back to Today. */}
      <Tabs.Screen name="profile" />
    </Tabs>
    <CaptureSheet />
    </>
  );
}
