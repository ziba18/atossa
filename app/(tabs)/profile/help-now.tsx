import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { space } from '../../../constants/atossaUI';
import { ScreenLarge, Txt } from '../../../components/atossa/kit';
import { HelpRoutesList } from '../../../components/help/HelpRoutesList';
import { usePageTitle } from '../../../lib/usePageTitle';

/** Static, same for everyone: it never reads a note and works offline (the links still dial). */
export default function HelpNowScreen() {
  usePageTitle('Help now');
  const { from } = useLocalSearchParams<{ from?: string }>();
  return (
    <ScreenLarge title="Help now" back={{ label: from === 'Today' ? 'Today' : 'Profile' }} subtitle="If you need help right now, these are free and open to anyone.">
      <HelpRoutesList />
      <Txt variant="caption" style={{ marginTop: space.md }}>Atossa can’t diagnose and can’t call anyone for you.</Txt>
    </ScreenLarge>
  );
}
