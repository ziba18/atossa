import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { space } from '../../../constants/atossaUI';
import { Button, FieldLabel, InlineError, ScreenLarge, TextField, showToast } from '../../../components/atossa/kit';
import { haptics } from '../../../lib/haptics';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { daysInMonth, parseKey, toKey, todayKey } from '../../../lib/records/dates';
import { usePageTitle } from '../../../lib/usePageTitle';

/** Day / month / year boxes → 'YYYY-MM-DD', '' when all empty, null when invalid. */
function birthDateKey(day: string, month: string, year: string): string | null {
  if (!day && !month && !year) return '';
  const d = Number(day), m = Number(month), y = Number(year);
  const thisYear = parseKey(todayKey()).y;
  if (!Number.isInteger(y) || y < 1900 || y > thisYear) return null;
  if (!Number.isInteger(m) || m < 1 || m > 12) return null;
  if (!Number.isInteger(d) || d < 1 || d > daysInMonth(y, m - 1)) return null;
  const key = toKey(y, m - 1, d);
  return key > todayKey() ? null : key;
}

function inRange(text: string, min: number, max: number): number | null {
  const n = Number(text);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

export default function EditProfileScreen() {
  // Under ~240 pt (200% text on a small phone) three date boxes side by side are too narrow to read: stack them.
  const narrow = useWindowDimensions().width < 240;
  usePageTitle('My details');
  const { profile, fetchProfile } = useAuthStore();
  const dob = profile?.date_of_birth ? parseKey(profile.date_of_birth) : null;

  const [name, setName] = useState(profile?.display_name ?? '');
  const [day, setDay] = useState(dob ? String(dob.d) : '');
  const [month, setMonth] = useState(dob ? String(dob.m0 + 1) : '');
  const [year, setYear] = useState(dob ? String(dob.y) : '');
  const [cycle, setCycle] = useState(String(profile?.average_cycle_length ?? 28));
  const [period, setPeriod] = useState(String(profile?.average_period_length ?? 5));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const touch = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setError(''); };
  const digits = (setter: (v: string) => void) => touch((v: string) => setter(v.replace(/\D/g, '')));

  const save = async () => {
    const birth = birthDateKey(day, month, year);
    const cycleDays = inRange(cycle, 14, 60);
    const periodDays = inRange(period, 1, 15);
    if (!name.trim()) return setError('Enter your name.');
    if (birth === null) return setError('Check the date of birth — or leave all three boxes empty.');
    if (cycleDays === null) return setError('Time between periods should be between 14 and 60 days.');
    if (periodDays === null) return setError('Period length should be between 1 and 15 days.');

    setSaving(true);
    setError('');
    try {
      await api.patch('/me', {
        display_name: name.trim(),
        date_of_birth: birth || null,
        average_cycle_length: cycleDays,
        average_period_length: periodDays,
      });
      await fetchProfile();
      haptics.success();
      showToast('Your details are saved.');
    } catch {
      setError('Your details couldn’t be saved. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLarge title="My details" back={{ label: 'Profile' }}>
      <View style={{ gap: space.xl }}>
        <TextField label="Your name" value={name} onChangeText={touch(setName)} autoCapitalize="words" />

        <View>
          <FieldLabel label="Date of birth" optional />
          <View style={{ flexDirection: narrow ? 'column' : 'row', gap: space.xs }}>
            <TextField label="Day" subLabel value={day} onChangeText={digits(setDay)} keyboardType="number-pad" maxLength={2} style={narrow ? undefined : { flex: 1 }} />
            <TextField label="Month" subLabel value={month} onChangeText={digits(setMonth)} keyboardType="number-pad" maxLength={2} style={narrow ? undefined : { flex: 1 }} />
            <TextField label="Year" subLabel value={year} onChangeText={digits(setYear)} keyboardType="number-pad" maxLength={4} style={narrow ? undefined : { flex: 1.4 }} />
          </View>
        </View>

        <TextField label="Usual days between periods" hint="From the start of one period to the start of the next" value={cycle} onChangeText={digits(setCycle)} keyboardType="number-pad" maxLength={2} />
        <TextField label="Usual period length in days" hint="How many days your period usually lasts" value={period} onChangeText={digits(setPeriod)} keyboardType="number-pad" maxLength={2} />

        <InlineError message={error} />
        <Button label="Save my details" icon="check" loading={saving} onPress={save} />
      </View>
    </ScreenLarge>
  );
}
