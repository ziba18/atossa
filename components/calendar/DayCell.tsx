import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import type { CalendarDay, CalendarPhase } from '../../algorithms/calendarDerive';
import { CalendarDayText, Accent } from '../../constants/typography';

// Phase fills tuned for the cream background — softer than the orb hues.
const PHASE_BG: Record<CalendarPhase, string> = {
  period:     '#E5A5AD',  // soft rose
  follicular: '#CCE2CD',  // matcha mist
  ovulation:  '#BFD6EC',  // sky tint
  luteal:     '#F2E5C9',  // cream apricot
};

interface Props {
  day: number;
  info?: CalendarDay;
  isToday: boolean;
  inMonth: boolean;
  onPress: () => void;
}

export function DayCell({ day, info, isToday, inMonth, onPress }: Props) {
  // Pressable is the OUTER element so gestures reach it directly.
  // The scale animation lives on an inner Animated.View — it can't
  // swallow touches because it sits inside the Pressable hit box.
  const scale = useSharedValue(1);

  const onPressIn  = () => { scale.value = withSpring(0.88, { stiffness: 500, damping: 22 }); };
  const onPressOut = () => { scale.value = withSpring(1.0,  { stiffness: 400, damping: 18 }); };

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const hasPhase = !!info;
  const predicted = info?.predicted;
  const bg = hasPhase
    ? predicted ? 'transparent' : PHASE_BG[info!.phase]
    : 'rgba(255,255,255,0.40)';

  const border = hasPhase && predicted
    ? PHASE_BG[info!.phase]
    : 'rgba(255,255,255,0.55)';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      // hitSlop expands the tap target slightly beyond the visible cell so
      // narrow gaps between cells don't dead-zone the tap.
      hitSlop={2}
      style={styles.cell}
    >
      <Animated.View
        style={[
          styles.inner,
          {
            backgroundColor: bg,
            borderColor: border,
            borderStyle: predicted ? 'dashed' : 'solid',
            borderWidth: predicted ? 1.4 : 1,
          },
          animatedStyle,
        ]}
        // Animated.View must not eat touches — pointerEvents=none lets
        // every tap fall through to the Pressable wrapper.
        pointerEvents="none"
      >
        {/* Ovulation glow halo */}
        {info?.phase === 'ovulation' && !predicted && (
          <View style={[styles.ovulationHalo, { backgroundColor: PHASE_BG.ovulation + '99' }]} />
        )}

        {/* Today border */}
        {isToday && <View style={styles.todayBorder} />}

        <Text
          style={[
            styles.dayText,
            !inMonth && styles.dayTextOutOfMonth,
          ]}
        >
          {day}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Explicit width = 1/7 of the row. `flex: 1` inside `flexWrap: 'wrap'`
  // is fragile — yoga can collapse cells to 0 width in some Metro states,
  // which is the exact symptom that broke tapping before.
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  inner: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ovulationHalo: {
    position: 'absolute',
    top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: 18,
    opacity: 0.5,
    zIndex: -1,
  },
  todayBorder: {
    position: 'absolute',
    top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Accent.calendar.deep,
  },
  dayText: { ...CalendarDayText },
  dayTextOutOfMonth: {
    color: 'rgba(63,47,74,0.35)',
  },
});
