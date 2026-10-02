// Symptom entry detail — /(tabs)/timeline/entry/[id]?from=<screen title>
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { EntryDetail } from '../../../../components/atossa/timeline/EntryDetail';
import { fromLabel } from '../../../../components/atossa/timeline/navigation';

export default function EntryScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  return <EntryDetail key={String(id)} id={String(id)} from={fromLabel(from)} />;
}
