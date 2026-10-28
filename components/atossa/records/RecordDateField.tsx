import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { colors, radii, space } from '../../../constants/atossaUI';
import type { DatePrecision } from '../../../types/records';
import { MONTH_NAMES, addDays, parseKey, toKey, todayKey } from '../../../lib/records/dates';
import { formatRecordDate } from '../../../lib/records/format';
import { Chip, DayChooser, FieldLabel, Txt } from '../kit';

type Mode = 'exact' | 'around' | 'ongoing' | null;

/**
 * Record date (medicine started/stopped, appointment date, health-history "when").
 *
 * NOTHING is pre-selected: Sam first chooses "Exact day" or "Around" (optionally a third
 * "ongoing" chip such as "Still taking"), and no date exists until she picks one.
 *  - Exact day → a year row (jump) + the kit DayChooser. `allowFuture` lifts the "no future
 *    days" limit (appointments).
 *  - Around → a year row, then optional month chips. Year only = precision 'year'
 *    ("Around 2019"); with a month = 'month' ("Around April 2019").
 * No native <select>/Picker anywhere — chips and the kit month grid only.
 */
export function RecordDateField({
  label, value, precision, onChange, optional, allowFuture, ongoingLabel, initiallyOngoing, min,
}: {
  label: string;
  /** 'YYYY-MM-DD' or '' (not set). */
  value: string;
  precision: DatePrecision;
  onChange: (value: string, precision: DatePrecision) => void;
  optional?: boolean;
  allowFuture?: boolean;
  /** Adds a third chip (e.g. "Still taking") meaning "no date": value ''. */
  ongoingLabel?: string;
  /** Existing record whose empty value means ongoing → that chip starts selected. */
  initiallyOngoing?: boolean;
  /** Earliest allowed exact day (e.g. stopped ≥ started). */
  min?: string;
}) {
  const today = todayKey();
  const thisYear = parseKey(today).y;
  const maxKey = allowFuture ? addDays(today, 365 * 3) : today;
  const maxYear = parseKey(maxKey).y;

  const [mode, setMode] = useState<Mode>(() => {
    if (value) return precision === 'exact' ? 'exact' : 'around';
    return ongoingLabel && initiallyOngoing ? 'ongoing' : null;
  });
  // An existing record opens with its date as one line; the picker opens when a chip is tapped (again).
  const [open, setOpen] = useState(!value);
  // Year Sam jumped to in exact mode (the day grid then opens on it).
  const [jump, setJump] = useState<{ y: number; m0: number } | null>(null);

  const years = useMemo(() => {
    const out: number[] = [];
    for (let y = maxYear; y >= thisYear - 70; y--) out.push(y);
    return out;
  }, [maxYear, thisYear]);

  const v = value ? parseKey(value) : null;

  const choose = (next: Mode) => {
    if (next === mode) { if (value) setOpen((o) => !o); return; }
    setOpen(true);
    setJump(null);
    setMode(next);
    if (next === 'ongoing') onChange('', 'exact');
    else if (next === 'around') {
      // Keep the month/year Sam already gave as an exact day; otherwise nothing yet.
      if (value && precision === 'exact' && v) onChange(toKey(v.y, v.m0, 1), 'month');
      else if (!value) onChange('', 'month');
    } else if (next === 'exact') {
      // An approximate date has no day: start again.
      if (precision !== 'exact' || !value) onChange('', 'exact');
    }
  };

  const shown = value ? formatRecordDate(value, precision) : '';
  const status = shown
    || (mode === 'ongoing' && ongoingLabel ? ongoingLabel
      : mode === 'around' ? 'Choose a year'
      : mode === 'exact' ? 'Choose a day'
      : 'Not set yet');

  // ---- Around: year + optional month ------------------------------------------------------
  const aroundYear = mode === 'around' && v ? v.y : null;
  const aroundMonth = mode === 'around' && v && precision === 'month' ? v.m0 : null;
  const monthDisabled = (y: number | null, m0: number) =>
    y == null || (!allowFuture && (y > thisYear || (y === thisYear && m0 > parseKey(today).m0)));

  const pickAroundYear = (y: number) => {
    if (aroundYear === y) return;
    const m0 = aroundMonth;
    if (m0 != null && !monthDisabled(y, m0)) onChange(toKey(y, m0, 1), 'month');
    else onChange(toKey(y, 0, 1), 'year');
  };
  const pickAroundMonth = (m0: number) => {
    if (aroundYear == null) return;
    if (aroundMonth === m0) onChange(toKey(aroundYear, 0, 1), 'year'); // re-tap clears the month
    else onChange(toKey(aroundYear, m0, 1), 'month');
  };

  // ---- Exact: year jump + day grid --------------------------------------------------------
  const exactYearSelected = jump ? jump.y : mode === 'exact' && v ? v.y : null;
  const jumpTo = (y: number) => {
    const m0 = jump?.m0 ?? v?.m0 ?? parseKey(today).m0;
    const capped = y === maxYear ? Math.min(m0, parseKey(maxKey).m0) : m0;
    setJump({ y, m0: capped });
  };
  // While Sam has jumped away from her chosen day's month, open the grid on the jumped month.
  const jumpedAway = jump && !(v && v.y === jump.y && v.m0 === jump.m0);

  return (
    <View style={styles.field}>
      <FieldLabel label={label} optional={optional} style={{ marginBottom: 0 }} />
      {/* Always exactly one line (the chosen date, or what's still needed), so picking a chip
          never pushes the controls below it down. */}
      <Txt
        variant="body"
        color={shown || mode === 'ongoing' ? colors.ink : colors.ink2}
        numberOfLines={1}
        accessibilityLiveRegion="polite"
      >
        {status}
      </Txt>

      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={`${label}: how exact`}>
        {ongoingLabel ? (
          <Chip label={ongoingLabel} selected={mode === 'ongoing'} accessibilityRole="radio" onPress={() => choose('ongoing')} />
        ) : null}
        <Chip label="Exact day" selected={mode === 'exact'} accessibilityRole="radio" onPress={() => choose('exact')} />
        <Chip label="Around" selected={mode === 'around'} accessibilityRole="radio" onPress={() => choose('around')} />
      </View>

      {open && mode === 'around' ? (
        <View style={styles.panel}>
          <Txt variant="caption">Year</Txt>
          <YearRow years={years} selected={aroundYear} focus={thisYear} onPick={pickAroundYear} label={`${label} year`} />
          <Txt variant="caption" style={{ marginTop: space.sm }}>Month, if you know it</Txt>
          <View style={styles.months}>
            {MONTH_NAMES.map((name, m0) => (
              <Chip
                key={name}
                label={name.slice(0, 3)}
                selected={aroundMonth === m0}
                disabled={monthDisabled(aroundYear, m0)}
                accessibilityRole="radio"
                onPress={() => pickAroundMonth(m0)}
                style={styles.monthChip}
              />
            ))}
          </View>
        </View>
      ) : null}

      {open && mode === 'exact' ? (
        <View style={styles.panel}>
          <Txt variant="caption">Jump to a year</Txt>
          <YearRow years={years} selected={exactYearSelected} focus={thisYear} onPick={jumpTo} label={`${label} year`} />
          <View style={{ marginTop: space.xs }}>
            <DayChooser
              key={jump ? `${jump.y}-${jump.m0}` : 'start'}
              value={jumpedAway ? '' : value}
              month={jump ? toKey(jump.y, jump.m0, 1) : today}
              max={maxKey}
              min={min}
              onChange={(k) => { setJump(null); onChange(k, 'exact'); }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Horizontal year chips. The selected year (or `focus` — this year — when none is chosen) is
 * scrolled to the centre on open and whenever the selection changes, so "2019" isn't hidden
 * behind 2026–2022.
 */
function YearRow({
  years, selected, focus, onPick, label,
}: { years: number[]; selected: number | null; focus: number; onPick: (y: number) => void; label: string }) {
  const ref = useRef<ScrollViewInstance | null>(null);
  const viewW = useRef(0);
  const chips = useRef<Record<number, { x: number; w: number }>>({});
  const target = selected ?? focus;

  const centre = (animated: boolean) => {
    const c = chips.current[target];
    if (!c || !viewW.current) return;
    const x = Math.max(0, c.x - (viewW.current - c.w) / 2);
    // Deferred: during the first layout pass the content may not be measurable yet (web).
    requestAnimationFrame(() => ref.current?.scrollTo({ x, animated }));
  };
  useEffect(() => { centre(true); }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={label}
      contentContainerStyle={styles.yearRow}
      onLayout={(e) => { viewW.current = e.nativeEvent.layout.width; centre(false); }}
      onContentSizeChange={() => centre(false)}
    >
      {years.map((y) => (
        <View
          key={y}
          onLayout={(e) => {
            chips.current[y] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width };
            if (y === target) centre(false);
          }}
        >
          <Chip label={String(y)} selected={selected === y} accessibilityRole="radio" onPress={() => onPick(y)} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xxs },
  panel: {
    marginTop: space.xs, gap: space.xs, padding: space.md, borderRadius: radii.card,
    borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface,
  },
  yearRow: { flexDirection: 'row', gap: space.xs, paddingRight: space.md },
  months: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  monthChip: { minWidth: 64 },
});
