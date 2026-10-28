import React from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { RecordsList } from '../../../../../components/atossa/records/RecordsList';
import { KIND_INFO, toDataKind } from '../../../../../components/atossa/records/recordKinds';
import { usePageTitle } from '../../../../../lib/usePageTitle';

/** /(tabs)/profile/records/[kind] — kind = medicines | appointments | history. */
export default function RecordsListScreen() {
  usePageTitle('Records');
  const router = useRouter();
  const { kind: raw } = useLocalSearchParams<{ kind: string }>();
  const kind = toDataKind(raw);
  if (!kind) return <Redirect href={'/(tabs)/profile' as any} />;
  const slug = KIND_INFO[kind].slug;

  const open = (id: string) =>
    router.push({
      pathname: '/(tabs)/profile/records/[kind]/[id]',
      params: { kind: slug, id, from: KIND_INFO[kind].listTitle },
    } as any);

  return (
    <RecordsList
      kind={kind}
      onBack={() => (router.canGoBack() ? router.back() : router.navigate('/(tabs)/profile' as any))}
      onOpen={open}
      onAdd={() => open('new')}
    />
  );
}
