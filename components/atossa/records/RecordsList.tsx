import React from 'react';
import type { AppointmentData, HistoryData, MedicineData, Rec } from '../../../types/records';
import { useRecordsStore } from '../../../stores/recordsStore';
import { AddButton, EmptyState, InlineError, ScreenLarge } from '../kit';
import { Group, GroupRow } from './GroupedRows';
import { KIND_INFO, recordFacts, recordTitle, sortRecords, type RecordDataKind } from './recordKinds';

type AnyData = MedicineData | AppointmentData | HistoryData;

/** "3 saved" / "1 saved" / "None yet" — the count line on Profile and on the list. */
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

  return (
    <ScreenLarge
      title={info.listTitle}
      subtitle={sorted.length ? savedLabel(sorted.length) : undefined}
      back={{ label: 'Profile', onPress: onBack }}
      right={sorted.length ? <AddButton label={info.addLabel} onPress={onAdd} /> : null}
    >
      {loadError && !loadedFor ? <InlineError message={loadError} /> : null}
      {sorted.length === 0 && loadedFor ? (
        <EmptyState message={info.empty} action={{ label: info.addLabel, onPress: onAdd }} />
      ) : sorted.length ? (
        <Group>
          {sorted.map((r) => {
            const title = recordTitle(kind, r.data);
            const facts = recordFacts(kind, r.data);
            return (
              <GroupRow
                key={r.id}
                label={title}
                detail={facts || undefined}
                accessibilityLabel={[title, facts].filter(Boolean).join('. ')}
                onPress={() => onOpen(r.id)}
              />
            );
          })}
        </Group>
      ) : null}
    </ScreenLarge>
  );
}
