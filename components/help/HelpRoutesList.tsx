import React from 'react';
import { Linking } from 'react-native';
import { Group, GroupRow } from '../atossa/records/GroupedRows';
import { HELP_ROUTES } from '../../lib/helpNow';

const ICONS = { '999': 'heart-pulse', '111': 'heart', samaritans: 'headphones', shout: 'message-circle' } as const;

/** The four fixed routes, one source for the signed-in Help now and the pre-login page. Reads no notes, calls no API. */
export function HelpRoutesList() {
  return (
    <Group>
      {HELP_ROUTES.map((r) => (
        <GroupRow
          key={r.id}
          icon={ICONS[r.id as keyof typeof ICONS]}
          label={r.label}
          detail={r.detail}
          onPress={() => { Linking.openURL(r.href).catch(() => {}); }}
          accessibilityLabel={`${r.label} ${r.detail}. ${r.a11y}`}
        />
      ))}
    </Group>
  );
}
