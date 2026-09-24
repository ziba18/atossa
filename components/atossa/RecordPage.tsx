import React, { useState } from 'react';
import { View } from 'react-native';
import { BackButton, BigButton, ConfirmDelete, InlineError, Screen, Txt, PageTitle } from './kit';

/** Tracks which DateChoice fields are waiting on a future-date confirmation. */
export function useBlockedDates() {
  const [map, setMap] = useState<Record<string, boolean>>({});
  return {
    blocked: Object.values(map).some(Boolean),
    track: (key: string) => (b: boolean) => setMap((cur) => (cur[key] === b ? cur : { ...cur, [key]: b })),
  };
}

export function RecordListPage({
  title, count, onBack, onAdd, addLabel, children, emptyText,
}: {
  title: string;
  count: number;
  onBack: () => void;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
  emptyText?: string;
}) {
  return (
    <Screen>
      <BackButton onPress={onBack} />
      <View style={{ marginTop: 20 }}>
        <PageTitle title={title} subtitle={`${count} saved ${count === 1 ? 'entry' : 'entries'}`} />
      </View>
      {onAdd ? <BigButton label={addLabel ?? 'Add'} icon="plus" onPress={onAdd} style={{ marginTop: 12 }} /> : null}
      <View style={{ marginTop: 20, gap: 12 }}>
        {count === 0 && emptyText ? <Txt variant="body" color="#554b44">{emptyText}</Txt> : children}
      </View>
    </Screen>
  );
}

export function EditorShell({
  title, onBack, onSave, saveLabel, saveDisabled, onDelete, deleteName, busy, error, children,
}: {
  title: string;
  onBack: () => void;
  onSave: () => void;
  saveLabel: string;
  saveDisabled?: boolean;
  onDelete?: () => void;
  deleteName?: string;
  busy?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <Screen>
      <BackButton onPress={onBack} label="Back" />
      <View style={{ marginTop: 20 }}><PageTitle title={title} /></View>
      <View style={{ marginTop: 16, gap: 20 }}>
        {children}
        <InlineError message={error ?? ''} />
        <BigButton label={busy ? 'Saving…' : saveLabel} icon="check" disabled={busy || saveDisabled} onPress={onSave} />
        {onDelete && !confirming ? (
          <BigButton label="Delete entry" icon="trash" variant="outline" textColor="#be3029" onPress={() => setConfirming(true)} />
        ) : null}
        {onDelete && confirming ? (
          <ConfirmDelete name={deleteName ?? 'this entry'} onCancel={() => setConfirming(false)} onDelete={onDelete} />
        ) : null}
      </View>
    </Screen>
  );
}
