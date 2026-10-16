// One List card stands for consecutive bleeding days ("Period · 21–26 Aug"); this screen lists
// those days in ONE grouped card (clay edge once, a row per day, N8), each opening its own
// bleeding detail. Logged facts only — no cycle maths.
import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { EmptyState, GlyphLine, ScreenLarge } from '../kit';
import { bleedingFacts, formatDay } from '../../../lib/records/format';
import { useRecordsStore } from '../../../stores/recordsStore';
import { Group, GroupRow } from '../records/GroupedRows';
import { runSummary } from './EntryCard';
import { bleedingRuns } from './feed';
import { bleedingHref, goBack } from './navigation';

export function PeriodRun({ start, from }: { start: string; from: string }) {
  const router = useRouter();
  const periodDays = useRecordsStore((s) => s.records.period_day);
  const loaded = useRecordsStore((s) => s.loadedFor != null && !s.loading);
  // The run that holds `start` (days may have been edited since the card was tapped).
  const run = useMemo(
    () => bleedingRuns(periodDays).find((r) => r.some((d) => d.data.date === start)) ?? null,
    [periodDays, start],
  );

  const back = () => goBack(router, from);
  useEffect(() => {
    if (!run && loaded) back();
  }, [run, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!run) {
    return (
      <ScreenLarge title="Period" back={{ label: from, onPress: back }}>
        <EmptyState message="Nothing is logged for these days any more." />
      </ScreenLarge>
    );
  }

  const { title, range, flows } = runSummary(run);
  const n = run.length;
  return (
    <ScreenLarge
      title={title}
      subtitle={<GlyphLine icon="droplet" clay text={[`${range} · ${n} ${n === 1 ? 'day' : 'days'}`, flows].filter(Boolean).join(' · ')} />}
      back={{ label: from, onPress: back }}
    >
      <Group edge="clay">
        {run.map((d) => {
          const day = formatDay(d.data.date);
          const facts = bleedingFacts(d.data);
          const note = (d.data.note ?? '').trim(); // her own words, so a Quote
          return (
            <GroupRow
              key={d.id}
              label={day}
              detail={facts}
              quote={note || undefined}
              accessibilityLabel={[day, facts, note].filter(Boolean).join('. ')}
              onPress={() => router.push(bleedingHref(d.data.date, title) as any)}
            />
          );
        })}
      </Group>
    </ScreenLarge>
  );
}
