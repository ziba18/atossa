// Today's appointment card. With an appointment today or later: "Specialist clinic · Thu 24 Sep
// · 9 notes ready" + "Preview summary". Without: an invitation to add one, which opens a small
// sheet over Today (who/where + a date that may be in the future). Nothing pre-selected.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button, Card, DayChooser, FieldLabel, InlineError, Sheet, TextField, Txt, showToast,
} from '../kit';
import { colors, space } from '../../../constants/atossaUI';
import { Icon } from '../../ui/Icon';
import { haptics } from '../../../lib/haptics';
import { todayKey } from '../../../lib/records/dates';
import { formatDay, noteCount, notesLabel } from '../../../lib/records/format';
import { useRecordsStore } from '../../../stores/recordsStore';
import type { AppointmentData, Rec } from '../../../types/records';

/** Far-future limit for appointment dates (DayChooser blocks the future by default). */
const FAR_FUTURE = '2099-12-31';

/** The soonest appointment on or after today (exact dates only; "Around …" ones are history). */
export function nextAppointment(appts: Rec<AppointmentData>[]): Rec<AppointmentData> | undefined {
  const today = todayKey();
  return appts
    .filter((a) => a.data.date && a.data.date >= today && (a.data.datePrecision ?? 'exact') === 'exact')
    .sort((a, b) => a.data.date.localeCompare(b.data.date))[0];
}

export function AppointmentCard() {
  const router = useRouter();
  const appts = useRecordsStore((s) => s.records.appointment);
  const count = useRecordsStore((s) => noteCount(s.records.symptom));
  const [adding, setAdding] = useState(false);
  const next = nextAppointment(appts);

  let card: React.ReactNode;
  if (next) {
    const who = next.data.who.trim() || 'Appointment';
    const isToday = next.data.date === todayKey();
    // Title = who; meta = date + count on its own line, so long names don't bury the count.
    card = (
      <Card style={{ flexDirection: 'row', gap: space.md }}>
        {/* Same calendar badge as For my doctor's appointment card. */}
        <View aria-hidden style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.plumTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="calendar" size={22} color={colors.ink} />
        </View>
        <View style={{ flex: 1, gap: space.xxs }}>
          {/* On the day it reads "Appointment today", as For my doctor's header does (N22). */}
          <Txt variant="caption">{isToday ? 'Appointment today' : 'Next appointment'}</Txt>
          <Txt variant="headline">{who}</Txt>
          <Txt variant="secondary">
            {`${isToday ? 'Today' : formatDay(next.data.date)} · ${count > 0 ? `${notesLabel(count)} ready` : 'No notes yet'}`}
          </Txt>
          <Button
            label="Preview summary"
            variant="text"
            align="start"
            onPress={() => router.push('/(tabs)/doctor' as any)}
          />
        </View>
      </Card>
    );
  } else {
    card = (
      <Card style={{ gap: space.xxs }}>
        <Txt variant="body">Got an appointment coming up? Add it and we’ll get your summary ready.</Txt>
        <Button label="Add appointment" variant="text" align="start" onPress={() => setAdding(true)} />
      </Card>
    );
  }

  return (
    <>
      {card}
      {/* Outside the branches so the sheet can animate closed after the card switches state. */}
      <AddAppointmentSheet visible={adding} onClose={() => setAdding(false)} />
    </>
  );
}

export function AddAppointmentSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const create = useRecordsStore((s) => s.create);
  const [who, setWho] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setWho('');
    setDate('');
    setError('');
  }, [visible]);

  const canSave = who.trim() !== '' && date !== '';
  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError('');
    try {
      await create('appointment', {
        date, datePrecision: 'exact', who: who.trim(), why: '', told: '', tests: '', next: '', notes: '',
      });
      haptics.success();
      onClose();
      showToast('Saved.');
    } catch {
      setError("That didn't save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Add appointment"
      footer={<Button label="Save appointment" onPress={save} disabled={!canSave} loading={saving} />}
    >
      <View style={{ gap: space.xl }}>
        <TextField
          label="Who or where"
          value={who}
          onChangeText={setWho}
          placeholder="For example, GP or specialist clinic"
          autoCapitalize="sentences"
          returnKeyType="done"
        />
        <View>
          <FieldLabel label="Date" hint={date ? formatDay(date) : 'Choose a day'} />
          <DayChooser value={date} onChange={setDate} min={todayKey()} max={FAR_FUTURE} month={todayKey()} />
        </View>
        <InlineError message={error} />
      </View>
    </Sheet>
  );
}
