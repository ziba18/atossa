// A run of consecutive bleeding days — /(tabs)/timeline/period/[start]?from=<screen title>
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PeriodRun } from '../../../../components/atossa/timeline/PeriodRun';
import { fromLabel } from '../../../../components/atossa/timeline/navigation';

export default function PeriodScreen() {
  const { start, from } = useLocalSearchParams<{ start: string; from?: string }>();
  return <PeriodRun key={String(start)} start={String(start)} from={fromLabel(from)} />;
}
