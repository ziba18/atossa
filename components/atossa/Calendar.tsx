import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, Animated, AccessibilityInfo, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UI } from '../../constants/atossaUI';
import { Txt } from './kit';
import { WEEKDAY_LETTERS, daysInMonth, firstWeekdayOffset, formatDate, toKey } from '../../lib/records/dates';

const C = UI.colors;

/** One shared, slow "sparkle" value for every bleeding day on screen. Static under reduce-motion. */
export function useTwinkle(): Animated.Value {
  const value = useRef(new Animated.Value(0.6)).current;
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reduce) {
      value.setValue(0.6);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0.2, duration: 1800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, value]);

  return value;
}

// Fixed sparkle positions (percent of the cell) in two groups that twinkle out of phase.
const DOTS_A = [{ x: 18, y: 16 }, { x: 70, y: 30 }, { x: 40, y: 78 }, { x: 84, y: 82 }];
const DOTS_B = [{ x: 60, y: 12 }, { x: 12, y: 58 }, { x: 88, y: 55 }, { x: 52, y: 46 }];

export function BleedingBackground({ twinkle, radius = 6 }: { twinkle: Animated.Value; radius?: number }) {
  const inverse = twinkle.interpolate({ inputRange: [0, 1], outputRange: [1, 0.25] });
  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]} pointerEvents="none">
      <LinearGradient
        colors={[C.bleedingLight, C.bleeding, C.bleedingDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: twinkle }]}>
        {DOTS_A.map((d, i) => <View key={i} style={[styles.dot, { left: `${d.x}%`, top: `${d.y}%` }]} />)}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: inverse }]}>
        {DOTS_B.map((d, i) => <View key={i} style={[styles.dot, styles.dotSmall, { left: `${d.x}%`, top: `${d.y}%` }]} />)}
      </Animated.View>
    </View>
  );
}

export interface CellState {
  bleeding: boolean;
  start?: boolean;
  end?: boolean;
}

export function MonthGrid({
  year, month0, cellState, selected, onSelect, cellHeight = 56, compact = false,
}: {
  year: number;
  month0: number;
  cellState: (dateKey: string) => CellState;
  selected?: string;
  onSelect?: (dateKey: string) => void;
  cellHeight?: number;
  /** Mini preview: no taps, smaller type. */
  compact?: boolean;
}) {
  const twinkle = useTwinkle();
  const offset = firstWeekdayOffset(year, month0);
  const total = daysInMonth(year, month0);
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View>
      <View style={styles.weekRow}>
        {WEEKDAY_LETTERS.map((d, i) => (
          <View key={`${d}-${i}`} style={styles.weekdayCell}>
            <Txt variant={compact ? 'tiny' : 'smallBold'} color={C.mutedForeground}>{d}</Txt>
          </View>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (day === null) return <View key={di} style={{ flex: 1, height: cellHeight }} />;
            const key = toKey(year, month0, day);
            const state = cellState(key);
            const isSelected = selected === key;
            const content = (
              <>
                {state.bleeding ? <BleedingBackground twinkle={twinkle} /> : null}
                <Txt
                  variant={compact ? 'smallBold' : 'bodyBold'}
                  color={state.bleeding ? C.white : C.foreground}
                >
                  {day}
                </Txt>
                {state.start || state.end ? (
                  <View style={[styles.marker, state.bleeding ? styles.markerOnRed : styles.markerPlain]} />
                ) : null}
              </>
            );
            const label = `${formatDate(key)}${state.bleeding ? ', a day you bled' : ''}${state.start ? ', start' : ''}${state.end ? ', end' : ''}`;
            const cellStyle = [
              styles.cell,
              { height: cellHeight },
              !state.bleeding && { backgroundColor: C.muted },
              isSelected && styles.selected,
            ];
            if (compact || !onSelect) {
              return <View key={di} style={cellStyle} accessibilityLabel={label}>{content}</View>;
            }
            return (
              <Pressable
                key={di}
                onPress={() => onSelect(key)}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: isSelected }}
                style={cellStyle}
              >
                {content}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  weekRow: { flexDirection: 'row' },
  weekdayCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  cell: {
    flex: 1, margin: 1.5, borderRadius: 6, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  selected: { borderWidth: 3, borderColor: C.foreground },
  dot: { position: 'absolute', width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.85)' },
  dotSmall: { width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.7)' },
  marker: { position: 'absolute', bottom: 4, width: 8, height: 8, borderRadius: 4 },
  markerOnRed: { backgroundColor: C.white, borderWidth: 1, borderColor: C.foreground },
  markerPlain: { backgroundColor: C.foreground },
});
