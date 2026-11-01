import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radii, space } from '../../../../constants/atossaUI';
import { HeroNumber, ScreenLarge, Txt } from '../../../../components/atossa/kit';
import { Icon } from '../../../../components/ui/Icon';
import { KIND_INFO } from '../../../../components/atossa/records/recordKinds';
import { RECORD_ICONS, RECORD_KINDS, previewLine } from '../../../../components/atossa/records/previewLine';
import { formatShortDate, noteCount } from '../../../../lib/records/format';
import { useCountUp } from '../../../../components/atossa/capture/TodayCards';
import { useRecordsStore } from '../../../../stores/recordsStore';
import { usePageTitle } from '../../../../lib/usePageTitle';

/** One line under an empty tile: the invitation, never a fake number. */
const INVITE: Record<(typeof RECORD_KINDS)[number], string> = {
  medicine: 'Add what you take',
  appointment: 'Add a visit',
  history: 'Add what you want your doctor to know',
};

/**
 * Records index (PRD pm/prd/records.md): the note count as the hero, then a tile per kind with its
 * real count and one latest line. Counts come from the records store only; an empty tile says
 * 'None added' and invites, it never shows 0 as an achievement.
 */
export default function RecordsIndexScreen() {
  usePageTitle('Records');
  const router = useRouter();
  const records = useRecordsStore((s) => s.records);
  const compact = useWindowDimensions().width < 360;

  const total = noteCount(records.symptom);
  const shown = useCountUp(total);
  const noteDates = records.symptom.map((n) => n.data.date).filter(Boolean).sort();
  const span = noteDates.length
    ? noteDates[0] === noteDates[noteDates.length - 1]
      ? `On ${formatShortDate(noteDates[0])}`
      : `First note ${formatShortDate(noteDates[0])} · latest ${formatShortDate(noteDates[noteDates.length - 1])}`
    : '';

  return (
    <ScreenLarge title="Records" back={{ label: 'Profile', onPress: () => (router.canGoBack() ? router.back() : router.navigate('/(tabs)/profile' as any)) }}>
      <HeroNumber
        big={String(shown)}
        line={total === 0 ? 'notes so far' : `${total === 1 ? 'note' : 'notes'} in your record`}
        sub={total === 0 ? 'Your first note starts your record' : span}
        onPress={total === 0 ? undefined : () => router.push('/(tabs)/timeline' as any)}
        accessibilityHint="Opens Timeline"
        keepSub
        filled
      />
      <View style={styles.grid}>
        {RECORD_KINDS.map((kind, i) => {
          const count = records[kind].length;
          const latest = previewLine(kind, records);
          const status = count ? `${count} saved` : 'None added';
          const title = KIND_INFO[kind].listTitle;
          const wide = i === RECORD_KINDS.length - 1 && RECORD_KINDS.length % 2 === 1;
          return (
            <Pressable
              key={kind}
              accessibilityRole="button"
              accessibilityLabel={[title, status, count ? latest : INVITE[kind]].filter(Boolean).join('. ')}
              onPress={() => router.push({ pathname: '/(tabs)/profile/records/[kind]', params: { kind: KIND_INFO[kind].slug } } as any)}
              style={({ pressed }) => [styles.tile, (compact || wide) && styles.tileWide, compact && styles.tileRow, pressed && { backgroundColor: colors.sunken }]}
            >
              <Icon name={RECORD_ICONS[kind]} size={22} color={colors.plum} />
              <View style={compact ? { flex: 1, minWidth: 0 } : undefined}>
                <Txt variant="headline" style={compact ? undefined : { marginTop: space.xs }}>{title}</Txt>
                <Txt variant="secondary" color={colors.ink2}>{status}</Txt>
                <Txt variant="secondary" color={colors.ink2} numberOfLines={3} style={{ marginTop: space.xs }}>{count ? latest : INVITE[kind]}</Txt>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScreenLarge>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  tile: {
    flexGrow: 1, flexBasis: '47%', minHeight: 132, padding: space.md, borderRadius: radii.card,
    borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.white,
  },
  // Under 360 pt wide two tiles would break 'Appointments' mid-word: one tile per row, icon beside the words.
  tileRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, minHeight: 0 },
  tileWide: { flexBasis: '100%', minHeight: 0 },
});
