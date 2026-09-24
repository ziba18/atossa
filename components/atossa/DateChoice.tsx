import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { UI } from '../../constants/atossaUI';
import type { DatePrecision } from '../../types/records';
import { BigButton, Card, FutureDateMessage, Txt } from './kit';
import { MonthGrid } from './Calendar';
import {
  MONTH_NAMES, formatRecordDate, isFuture, parseKey, toKey, todayKey,
} from '../../lib/records/dates';

const C = UI.colors;

function Stepper({ label, onMinus, onPlus }: { label: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <BigButton label="−" accessibilityLabel={`Previous ${label.includes(' ') ? 'month' : 'year'}`} variant="outline" onPress={onMinus} style={{ width: 64 }} />
      <View style={{ flex: 1, alignItems: 'center' }}><Txt variant="h2">{label}</Txt></View>
      <BigButton label="+" accessibilityLabel={`Next ${label.includes(' ') ? 'month' : 'year'}`} variant="outline" onPress={onPlus} style={{ width: 64 }} />
    </View>
  );
}

/**
 * "Exact date" / "Around this date" (year, or month and year) picker used on every record.
 * `value` is 'YYYY-MM-DD' ('' = not set, only when `optional`); precision 'month'/'year' means
 * the missing parts are placeholders. `onBlockedChange(true)` fires while a future date is
 * waiting for the user to confirm it — the parent should disable Save until then.
 */
export function DateChoice({
  label, value, precision, onChange, optional = false, exactOnly = false, onBlockedChange,
}: {
  label: string;
  value: string;
  precision: DatePrecision;
  onChange: (value: string, precision: DatePrecision) => void;
  optional?: boolean;
  exactOnly?: boolean;
  onBlockedChange?: (blocked: boolean) => void;
}) {
  const today = todayKey();
  const [futureKept, setFutureKept] = useState(false);
  const [open, setOpen] = useState(!value && !optional);
  const around = precision !== 'exact';
  const base = parseKey(value || today);
  const [viewMonth, setViewMonth] = useState({ y: base.y, m0: base.m0 });

  const future = isFuture(value);
  const blocked = future && !futureKept;
  useEffect(() => { onBlockedChange?.(blocked); }, [blocked]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (v: string, p: DatePrecision) => { setFutureKept(false); onChange(v, p); };

  const setPrecision = (p: DatePrecision) => {
    const { y, m0 } = parseKey(value || today);
    if (p === 'exact') set(value || today, 'exact');
    else if (p === 'month') set(toKey(y, m0, 1), 'month');
    else set(toKey(y, 0, 1), 'year');
  };

  const year = parseKey(value || today).y;

  return (
    <View style={{ gap: 12 }}>
      <View>
        <Txt variant="bodyBold">
          {label}
          {optional ? <Txt variant="body" color={C.mutedForeground}> (optional)</Txt> : null}
        </Txt>
        <Txt variant="h3" style={{ marginTop: 4 }}>{value ? formatRecordDate(value, precision) : 'Not set'}</Txt>
      </View>

      {!exactOnly && (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <BigButton label="Exact date" selected={!around} variant="outline" onPress={() => setPrecision('exact')} style={{ flex: 1 }} />
          <BigButton label="Around this date" selected={around} variant="outline" onPress={() => setPrecision(precision === 'exact' ? 'month' : precision)} style={{ flex: 1 }} />
        </View>
      )}
      {around && (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <BigButton label="Year only" selected={precision === 'year'} variant="outline" onPress={() => setPrecision('year')} style={{ flex: 1 }} />
          <BigButton label="Month and year" selected={precision === 'month'} variant="outline" onPress={() => setPrecision('month')} style={{ flex: 1 }} />
        </View>
      )}

      {!open && (
        <BigButton label={value ? 'Change' : 'Choose'} variant="outline" onPress={() => { setOpen(true); const p = parseKey(value || today); setViewMonth({ y: p.y, m0: p.m0 }); }} />
      )}

      {open && (
        <Card>
          {precision === 'year' && (
            <Stepper label={String(year)} onMinus={() => set(toKey(year - 1, 0, 1), 'year')} onPlus={() => set(toKey(year + 1, 0, 1), 'year')} />
          )}
          {precision === 'month' && (
            <View style={{ gap: 12 }}>
              <Stepper label={String(year)} onMinus={() => set(toKey(year - 1, parseKey(value).m0, 1), 'month')} onPlus={() => set(toKey(year + 1, parseKey(value).m0, 1), 'month')} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {MONTH_NAMES.map((m, i) => (
                  <BigButton
                    key={m}
                    label={m.slice(0, 3)}
                    variant="outline"
                    selected={value ? parseKey(value).m0 === i : false}
                    onPress={() => set(toKey(year, i, 1), 'month')}
                    style={{ width: '31%' }}
                  />
                ))}
              </View>
            </View>
          )}
          {precision === 'exact' && (
            <View style={{ gap: 12 }}>
              <Stepper label={String(viewMonth.y)} onMinus={() => setViewMonth((v) => ({ ...v, y: v.y - 1 }))} onPlus={() => setViewMonth((v) => ({ ...v, y: v.y + 1 }))} />
              <Stepper
                label={`${MONTH_NAMES[viewMonth.m0]} ${viewMonth.y}`}
                onMinus={() => setViewMonth((v) => (v.m0 === 0 ? { y: v.y - 1, m0: 11 } : { ...v, m0: v.m0 - 1 }))}
                onPlus={() => setViewMonth((v) => (v.m0 === 11 ? { y: v.y + 1, m0: 0 } : { ...v, m0: v.m0 + 1 }))}
              />
              <MonthGrid
                year={viewMonth.y}
                month0={viewMonth.m0}
                cellState={() => ({ bleeding: false })}
                selected={value || undefined}
                onSelect={(k) => set(k, 'exact')}
                cellHeight={46}
              />
            </View>
          )}
          <BigButton label="Done" style={{ marginTop: 12 }} onPress={() => setOpen(false)} />
        </Card>
      )}

      {optional && value ? (
        <BigButton label="Clear date (ongoing)" variant="outline" onPress={() => { setFutureKept(false); onChange('', 'exact'); }} />
      ) : null}

      {blocked ? (
        <FutureDateMessage onKeep={() => setFutureKept(true)} onChange={() => set(today, 'exact')} />
      ) : null}
    </View>
  );
}
