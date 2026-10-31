import React from 'react';
import { space } from '../../constants/atossaUI';
import { ScreenLarge, Txt } from '../../components/atossa/kit';
import { HelpRoutesList } from '../../components/help/HelpRoutesList';
import { usePageTitle } from '../../lib/usePageTitle';

/** Public, no account, no API call: the same fixed routes as the signed-in Help now screen. */
export default function PublicHelpNowScreen() {
  usePageTitle('Help now');
  return (
    <ScreenLarge title="Help now" back={{ label: 'Back' }} subtitle="If you need help right now, these are free and open to anyone.">
      <HelpRoutesList />
      <Txt variant="caption" style={{ marginTop: space.md }}>Atossa can’t diagnose and can’t call anyone for you.</Txt>
    </ScreenLarge>
  );
}
