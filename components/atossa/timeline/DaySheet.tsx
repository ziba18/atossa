// Month → tap a day: that day's entries (no per-card date — the sheet title is the day), then
// "Add a note for this day" and "Log bleeding" ("Edit bleeding" when the day is already logged).
// The parent closes this sheet before navigating or opening another sheet (one Modal at a time).
import React from 'react';
import { View } from 'react-native';
import { Button, Sheet, Txt } from '../kit';
import { space } from '../../../constants/atossaUI';
import { todayKey } from '../../../lib/records/dates';
import { formatDay } from '../../../lib/records/format';
import { EntryCard } from './EntryCard';
import type { FeedItem } from './feed';

export function DaySheet({
  day, items, onClose, onOpenItem, onAddNote, onLogBleeding,
}: {
  /** Date key, or null when closed. */
  day: string | null;
  items: FeedItem[];
  onClose: () => void;
  onOpenItem: (item: FeedItem) => void;
  onAddNote: (day: string) => void;
  onLogBleeding: (day: string) => void;
}) {
  // Keep the last day while the sheet animates closed.
  const [shown, setShown] = React.useState(day);
  React.useEffect(() => { if (day) setShown(day); }, [day]);
  const key = day ?? shown;
  const future = key ? key > todayKey() : false;
  const bleedingLogged = items.some((i) => i.kind === 'bleeding');

  return (
    <Sheet visible={day != null} onClose={onClose} title={key ? formatDay(key) : ''}>
      <View style={{ gap: space.sm }}>
        {items.length === 0 ? (
          <Txt variant="secondary">Nothing logged on this day.</Txt>
        ) : (
          items.map((item) => <EntryCard key={item.key} item={item} hideDate onPress={() => onOpenItem(item)} />)
        )}
        {key && !future ? (
          <View style={{ marginTop: space.xs, gap: space.sm }}>
            <Button variant="text" label="Add a note for this day" onPress={() => onAddNote(key)} />
            <Button variant="text" label={bleedingLogged ? 'Edit bleeding' : 'Log bleeding'} onPress={() => onLogBleeding(key)} />
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}
