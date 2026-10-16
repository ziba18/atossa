import React from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { RecordDetail } from '../../../../../components/atossa/records/RecordDetail';
import { firstParam, toDataKind } from '../../../../../components/atossa/records/recordKinds';

/**
 * Appointment / medicine / health-history detail opened from Timeline (owned by Profile+Records;
 * Timeline links here via recordHref). Back — and Save / Delete — return to Timeline.
 */
export default function TimelineRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind: string; id: string; from?: string }>();
  const kind = toDataKind(params.kind);
  if (!kind) return <Redirect href={'/(tabs)/timeline' as any} />;
  const backLabel = firstParam(params.from).trim() || 'Timeline';

  const done = () => {
    if (router.canGoBack()) router.back();
    else router.navigate('/(tabs)/timeline' as any);
  };

  return <RecordDetail kind={kind} id={firstParam(params.id)} backLabel={backLabel} onDone={done} />;
}
