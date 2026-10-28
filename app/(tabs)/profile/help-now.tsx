import React from 'react';
import { Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { space } from '../../../constants/atossaUI';
import { ScreenLarge, Txt } from '../../../components/atossa/kit';
import { Group, GroupRow } from '../../../components/atossa/records/GroupedRows';
import { HELP_ROUTES } from '../../../lib/helpNow';
import { usePageTitle } from '../../../lib/usePageTitle';

const ICONS = { '999': 'heart-pulse', '111': 'heart', samaritans: 'headphones', shout: 'message-circle' } as const;

/** Static, same for everyone: it never reads a note and works offline (the links still dial). */
export default function HelpNowScreen() {
  usePageTitle('Help now');
  const { from } = useLocalSearchParams<{ from?: string }>();
  return (
    <ScreenLarge title="Help now" back={{ label: from === 'Today' ? 'Today' : 'Profile' }} subtitle="If you need help right now, these are free and open to anyone.">
      <Group>
        {HELP_ROUTES.map((r) => (
          <GroupRow
            key={r.id}
            icon={ICONS[r.id as keyof typeof ICONS]}
            label={r.label}
            detail={r.detail}
            onPress={() => { Linking.openURL(r.href).catch(() => {}); }}
            accessibilityLabel={`${r.a11y}. ${r.detail}`}
          />
        ))}
      </Group>
      <Txt variant="caption" style={{ marginTop: space.md }}>Atossa can’t diagnose and can’t call anyone for you.</Txt>
    </ScreenLarge>
  );
}
