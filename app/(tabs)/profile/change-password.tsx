// PM-B155: Profile > Change password (email/password accounts only; Profile hides the row for Apple/Google-only accounts).
// Same password rule as Register (at least 8 characters); the server checks the rest and its reason is shown as is.
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { space } from '../../../constants/atossaUI';
import { Button, InlineError, ScreenLarge, TextField, showToast } from '../../../components/atossa/kit';
import { Group, GroupRow } from '../../../components/atossa/records/GroupedRows';
import { ApiError, changePassword } from '../../../lib/api';
import { haptics } from '../../../lib/haptics';
import { IS_PREVIEW } from '../../../lib/preview/flag';
import { usePageTitle } from '../../../lib/usePageTitle';

export function plainError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 0) return 'No connection. Please try again.';
    if (e.status === 429) return 'Too many tries. Please wait a few minutes and try again.';
    if (e.status === 400 && e.message) return e.message.endsWith('.') ? e.message : `${e.message}.`;
  }
  return 'Something went wrong. Please try again.';
}

export default function ChangePasswordScreen() {
  usePageTitle('Change password');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string }>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    const e = {
      current: current ? '' : 'Type your current password.',
      next: !next ? 'Choose a new password.' : next.length < 8 ? 'Use at least 8 characters.' : '',
    };
    setErrors(e);
    setError('');
    if (e.current || e.next) return;
    if (IS_PREVIEW) { showToast('Preview only: nothing was changed.'); router.back(); return; }
    setSaving(true);
    try {
      await changePassword(current, next);
      haptics.success();
      showToast('Password changed');
      router.back();
    } catch (err) {
      setError(plainError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenLarge title="Change password" back={{ label: 'Profile' }} footer={<><InlineError message={error} /><Button label="Save new password" icon="check" loading={saving} onPress={save} /></>}>
      <View style={{ gap: space.md }}>
        <Group>
          <GroupRow icon="heart-pulse" label="Help now" onPress={() => router.push('/(tabs)/profile/help-now' as any)} />
        </Group>
        <TextField label="Current password" secret value={current} onChangeText={(v) => { setCurrent(v); setErrors((x) => ({ ...x, current: '' })); }} autoComplete="current-password" textContentType="password" error={errors.current} />
        <TextField label="New password" hint="At least 8 characters" secret value={next} onChangeText={(v) => { setNext(v); setErrors((x) => ({ ...x, next: '' })); }} autoComplete="new-password" textContentType="newPassword" returnKeyType="go" onSubmitEditing={save} error={errors.next} />
      </View>
    </ScreenLarge>
  );
}
