import React from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { RecordDetail } from '../../../../../components/atossa/records/RecordDetail';
import { safeBackLabel } from '../../../../../components/atossa/timeline/navigation';
import { KIND_INFO, firstParam, toDataKind } from '../../../../../components/atossa/records/recordKinds';
import { usePageTitle } from '../../../../../lib/usePageTitle';

/** /(tabs)/profile/records/[kind]/[id] (id or `new`). Back label = `from`, else the list name. */
export default function ProfileRecordScreen() {
  usePageTitle('Record');
  const router = useRouter();
  const params = useLocalSearchParams<{ kind: string; id: string; from?: string }>();
  const kind = toDataKind(params.kind);
  if (!kind) return <Redirect href={'/(tabs)/profile' as any} />;
  const info = KIND_INFO[kind];
  const backLabel = safeBackLabel(params.from, info.listTitle);

  const done = () => {
    if (router.canGoBack()) router.back();
    else router.navigate({ pathname: '/(tabs)/profile/records/[kind]', params: { kind: info.slug } } as any);
  };

  return <RecordDetail kind={kind} id={firstParam(params.id)} backLabel={backLabel} onDone={done} />;
}
