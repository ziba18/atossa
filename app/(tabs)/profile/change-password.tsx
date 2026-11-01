import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { space } from '../../../constants/atossaUI';
import { Button, InlineError, ScreenLarge, TextField, Txt, showToast } from '../../../components/atossa/kit';
import { ApiError } from '../../../lib/api';
import { IS_PREVIEW } from '../../../lib/preview/flag';
import { usePageTitle } from '../../../lib/usePageTitle';
import { useAuthStore } from '../../../stores/authStore';

/** Profile > Account > Change password. Needs the current password; other devices are signed out. */
export default function ChangePasswordScreen() {
  usePageTitle('Change password');
  const router = useRouter();
  const changePassword = useAuthStore((s) => s.changePassword);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const clear = (k: string) => setErrors((e) => (e[k] ? { ...e, [k]: '' } : e));

  const save = async () => {
    const found = {
      current: current ? '' : 'Enter your current password.',
      next: !next ? 'Choose a new password.' : next.length < 8 ? 'Use at least 8 characters.' : next === current ? 'Choose a different password.' : '',
    };
    setErrors(found);
    setError('');
    if (Object.values(found).some(Boolean) || busy) return;
    if (IS_PREVIEW) { showToast('Preview only: nothing was changed.'); router.back(); return; }
    setBusy(true);
    try {
      await changePassword(current, next);
      showToast('Password changed. Other devices will ask you to sign in again.');
      router.back();
    } catch (e) {
      setBusy(false);
      if (e instanceof ApiError && e.status === 400) setErrors((x) => ({ ...x, current: e.message === 'Current password is incorrect' ? 'That isn’t your current password.' : '', next: e.message === 'Current password is incorrect' ? '' : e.message }));
      else setError('That didn’t change. Check your connection and try again.');
    }
  };

  return (
    <ScreenLarge title="Password" back={{ label: 'Profile' }} footer={<><InlineError message={error} /><Button label={busy ? 'Saving…' : 'Change password'} loading={busy} onPress={save} /></>}>
      <View style={{ gap: space.md }}>
        <TextField label="Current password" secret value={current} onChangeText={(v) => { setCurrent(v); clear('current'); }} autoComplete="current-password" textContentType="password" error={errors.current} />
        <TextField label="New password" secret value={next} onChangeText={(v) => { setNext(v); clear('next'); }} autoComplete="new-password" textContentType="newPassword" returnKeyType="go" onSubmitEditing={save} error={errors.next} />
      </View>
      <Txt variant="secondary" style={{ marginTop: space.md }}>Your saved notes stay as they are. Use 8 or more characters. Any other phone or browser signed in to Atossa will ask you to sign in again.</Txt>
      <Txt variant="secondary" style={{ marginTop: space.sm }}>If you signed up with Apple or Google, there is no password to change.</Txt>
    </ScreenLarge>
  );
}
