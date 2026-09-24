import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { MainTabBar } from '../../components/atossa/MainTabBar';
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
    <Tabs tabBar={(props) => <MainTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="report" options={{ title: 'For my doctor' }} />
      {/* Kept in the codebase from the earlier design but no longer part of the app's navigation. */}
      <Tabs.Screen name="analysis" options={{ href: null }} />
      <Tabs.Screen name="community" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
