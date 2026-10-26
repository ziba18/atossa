import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { MainTabBar } from '../../components/atossa/MainTabBar';
import { CaptureSheet } from '../../components/atossa/capture/CaptureSheet';
import { colors } from '../../constants/atossaUI';
import { useAuthStore } from '../../stores/authStore';
import { useRecordsStore } from '../../stores/recordsStore';

export default function TabsLayout() {
  const userId = useAuthStore((s) => s.user?.id);
  const loadedFor = useRecordsStore((s) => s.loadedFor);

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
