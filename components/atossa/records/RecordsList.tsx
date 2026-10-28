import React from 'react';
import { View } from 'react-native';
import { colors, radii, space } from '../../../constants/atossaUI';
import { formatRecordDate } from '../../../lib/records/format';
import { todayKey } from '../../../lib/records/dates';
import type { AppointmentData, HistoryData, MedicineData, Rec } from '../../../types/records';
import { useRecordsStore } from '../../../stores/recordsStore';
import { AddButton, EmptyState, InlineError, ScreenLarge, Txt } from '../kit';
import { Icon } from '../../ui/Icon';
import type { IconName } from '../../ui/Icon';
import { Group, GroupHeading, GroupRow } from './GroupedRows';
import { ALLERGY_TYPE, KIND_INFO, recordFacts, recordTitle, sortRecords, type RecordDataKind } from './recordKinds';

type AnyData = MedicineData | AppointmentData | HistoryData;

function groupByType(recs: Rec<HistoryData>[]): [string, Rec<HistoryData>[]][] {
  const map = new Map<string, Rec<HistoryData>[]>();
  for (const r of recs) map.set(r.data.type || 'Health history', [...(map.get(r.data.type || 'Health history') ?? []), r]);
  return [...map.entries()];
}

/** "3 saved" / "1 saved" / "None yet" — the count line on Profile and on the list. */
const PURPOSE: Record<RecordDataKind, string> = {
  medicine: 'Add what you take or have tried, and it goes into your summary.',
  appointment: 'Add a booked visit and Today counts down to it.',
  history: 'Add past tests, scans or things a doctor told you, so they are in one place.',
};
const EXAMPLE: Record<RecordDataKind, [string, string]> = {
  medicine: ['Pain relievers', 'Started around June 2024'],
  appointment: ['GP', 'Around March 2025'],
  history: ['An ultrasound', 'Around May 2023'],
};

/** What a saved row will look like, clearly marked as an example (same device as Today's ghost note). */
function GhostRow({ kind }: { kind: RecordDataKind }) {
  const [title, facts] = EXAMPLE[kind];
  return (
    <View
      accessible
      accessibilityLabel={`Example of a saved entry. ${title}. ${facts}.`}
      style={{ width: '100%', gap: space.xs, padding: space.md, borderRadius: radii.card, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.hairline }}
    >
      <Txt variant="caption">Example · yours will appear here</Txt>
      <View aria-hidden style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, opacity: 0.85 }}>
        <Icon name={kind === 'medicine' ? 'pill' : kind === 'appointment' ? 'calendar' : 'file-text'} size={22} color={colors.ink} />
        <View style={{ flex: 1 }}>
          <Txt variant="body">{title}</Txt>
          <Txt variant="secondary">{facts}</Txt>
        </View>
      </View>
    </View>
  );
}

const HISTORY_ICONS: Record<string, IconName> = {
  'Told to me by a doctor': 'file-text', 'Test or scan': 'activity', 'Procedure or surgery': 'clipboard-list', 'Emergency visit': 'heart-pulse',
};
const rowIcon = (kind: RecordDataKind, data: AnyData): IconName =>
  kind === 'medicine' ? 'pill' : kind === 'appointment' ? 'calendar' : HISTORY_ICONS[(data as HistoryData).type] ?? 'file-text';

export const savedLabel = (n: number) => (n === 0 ? 'None yet' : `${n} saved`);

/**
 * Profile → Records list (its own screen, no Profile header): BackChevron "Profile", large
 * title, a plain plum "+" (hidden while the empty state shows its own Add button), and ONE
 * inset-grouped card (as on Profile, N17): a row per record, newest first, title + date facts.
 */
export function RecordsList({
  kind, onBack, onOpen, onAdd,
}: {
  kind: RecordDataKind;
  onBack: () => void;
  onOpen: (id: string) => void;
  onAdd: () => void;
}) {
  const info = KIND_INFO[kind];
  const recs = useRecordsStore((s) => s.records[kind] as Rec<AnyData>[]);
  const loadedFor = useRecordsStore((s) => s.loadedFor);
  const loadError = useRecordsStore((s) => s.error);
  const sorted = sortRecords(kind, recs);

  const nextId = kind === 'appointment' ? sorted.filter((r) => (r.data as AppointmentData).date >= todayKey()).reverse()[0]?.id : undefined;
  const renderRow = (r: Rec<AnyData>) => {
    const grouped = kind === 'history';
    const h = r.data as HistoryData;
    // Under a type header the type is not repeated: the row leads with what was said or found.
    // What was done leads for tests, scans and procedures ("Ultrasound"), so rows under one header are told apart; what a doctor said leads under "Told to me by a doctor".
    const lines = grouped ? (h.type === 'Told to me by a doctor' ? [h.told, h.done, h.result] : [h.done, h.told, h.result]).map((t) => (t ?? '').trim().split('\n')[0]).filter(Boolean) : [];
    const said = lines[0] ?? '';
    const title = grouped ? said || recordTitle(kind, r.data) : recordTitle(kind, r.data);
    // An allergy line carries no date of its own (it is a standing statement), so no date shows under it.
    const facts = grouped ? (h.type === ALLERGY_TYPE ? '' : formatRecordDate(h.date, h.datePrecision)) : recordFacts(kind, r.data);
    return (
      <GroupRow
        key={r.id}
        icon={rowIcon(kind, r.data)}
        tint={r.id === nextId}
        label={title}
        detail={facts || undefined}
        accessibilityLabel={[grouped ? `${h.type}. ${title}` : title, facts].filter(Boolean).join('. ')}
        onPress={() => onOpen(r.id)}
      />
    );
  };

  return (
    <ScreenLarge
      title={info.listTitle}
      subtitle={sorted.length ? savedLabel(sorted.length) : undefined}
      back={{ label: 'Profile', onPress: onBack }}
      right={sorted.length ? <AddButton label={info.addLabel} onPress={onAdd} /> : null}
    >
      {loadError && !loadedFor ? <InlineError message={loadError} /> : null}
      {sorted.length === 0 && loadedFor ? (
        <EmptyState illustration={<GhostRow kind={kind} />} message={`${info.empty} ${PURPOSE[kind]}`} action={{ label: info.addLabel, onPress: onAdd }} />
      ) : sorted.length ? (
        kind === 'history' ? (
          // Health history: one header per type (the clinic asks for "any reports or results"), newest group first.
          groupByType(sorted as Rec<HistoryData>[]).map(([type, items], i) => (
            <View key={type} style={{ marginTop: i ? space.xl : 0 }}>
              <GroupHeading title={type} />
              <Group>{items.map((r) => renderRow(r))}</Group>
            </View>
          ))
        ) : kind === 'appointment' ? (
          // Upcoming first (soonest at the top), then past, once there is a visit in each.
          (() => {
            const today = todayKey();
            const isUpcoming = (r: Rec<AnyData>) => (r.data as AppointmentData).date >= today;
            const upcoming = sorted.filter(isUpcoming).reverse();
            const past = sorted.filter((r) => !isUpcoming(r));
            if (!upcoming.length || !past.length) return <Group>{sorted.map((r) => renderRow(r))}</Group>;
            return [['Upcoming', upcoming], ['Past', past]].map(([title, items], i) => (
              <View key={title as string} style={{ marginTop: i ? space.xl : 0 }}>
                <GroupHeading title={title as string} />
                <Group>{(items as Rec<AnyData>[]).map((r) => renderRow(r))}</Group>
              </View>
            ));
          })()
        ) : kind === 'medicine' ? (
          // Current first, then stopped, once there is one of each.
          (() => {
            const stopped = (r: Rec<AnyData>) => !!(r.data as MedicineData).stopped;
            const current = sorted.filter((r) => !stopped(r));
            const past = sorted.filter(stopped);
            if (!current.length || !past.length) return <Group>{sorted.map((r) => renderRow(r))}</Group>;
            return [['Current', current], ['Stopped', past]].map(([title, items], i) => (
              <View key={title as string} style={{ marginTop: i ? space.xl : 0 }}>
                <GroupHeading title={title as string} />
                <Group>{(items as Rec<AnyData>[]).map((r) => renderRow(r))}</Group>
              </View>
            ));
          })()
        ) : (
          <Group>{sorted.map((r) => renderRow(r))}</Group>
        )
      ) : null}
      {sorted.length ? (
        <Group style={{ marginTop: space.xl }}>
          <GroupRow icon="plus" label={info.addLabel} chevron={false} onPress={onAdd} />
        </Group>
      ) : null}
    </ScreenLarge>
  );
}
