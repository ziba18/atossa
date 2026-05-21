import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { format, parseISO } from 'date-fns';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import type { CalendarDay } from '../../algorithms/calendarDerive';
import { FontFamily, Spacing } from '../../constants/theme';
import { Colors } from '../../constants/colors';

const PHASE_LABEL: Record<CalendarDay['phase'], string> = {
  period:     'Menstrual',
  follicular: 'Follicular',
  ovulation:  'Ovulation',
  luteal:     'Luteal',
};

interface Props {
  open: boolean;
  date: string | null;
  info?: CalendarDay;
  onClose: () => void;
  onMarkStart: (date: string) => void;
  onMarkEnd:   (date: string) => void;
  onClear:     (date: string) => void;
}

/**
 * Bottom sheet editor for a calendar day.
 *
 * Important: the sheet is ALWAYS mounted. Open/close is controlled
 * declaratively via the `index` prop (open ? 0 : -1). The `onChange`
 * callback notifies the parent when the sheet has actually closed
 * (whether via drag, backdrop tap, or programmatic close) so React
 * state stays in sync.
 */
export function DayEditorSheet({
  open, date, info, onClose,
  onMarkStart, onMarkEnd, onClear,
}: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['48%'], []);

  // Render the backdrop only when the sheet is open.
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.35}
        pressBehavior="close"
      />
    ),
    [],
  );

  // Fires when the sheet finishes a snap transition. -1 = fully closed.
  const handleChange = useCallback((index: number) => {
    if (index === -1 && open) onClose();
  }, [open, onClose]);

  // Button handlers: trigger the action, then close the sheet.
  const handleStart = useCallback(() => {
    if (!date) return;
    onMarkStart(date);
    onClose();
  }, [date, onMarkStart, onClose]);

  const handleEnd = useCallback(() => {
    if (!date) return;
    onMarkEnd(date);
    onClose();
  }, [date, onMarkEnd, onClose]);

  const handleClear = useCallback(() => {
    if (!date) return;
    onClear(date);
    onClose();
  }, [date, onClear, onClose]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={open ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleChange}
      backgroundStyle={styles.bg}
      handleIndicatorStyle={styles.handle}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.content}>
        {date && (
          <>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tag}>
                  {info?.predicted ? 'PREDICTED' : 'LOGGED'}
                </Text>
                <Text style={styles.title}>{format(parseISO(date), 'EEEE, MMM d')}</Text>
                {info && (
                  <Text style={styles.sub}>
                    Day {info.cycleDay} · {PHASE_LABEL[info.phase]}
                  </Text>
                )}
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={styles.close}>
                <Icon name="x" size={16} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {/* Actions */}
            <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
              <Button
                label="Mark period start"
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleStart}
              />
              <Button
                label="Mark period end"
                variant="secondary"
                size="lg"
                fullWidth
                onPress={handleEnd}
              />
              <Button
                label="Clear this day"
                variant="ghost"
                size="lg"
                fullWidth
                onPress={handleClear}
              />
            </View>
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#3F2F4A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  handle: {
    backgroundColor: 'rgba(63,47,74,0.18)',
    width: 36,
    height: 4,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tag: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 10,
    color: 'rgba(63,47,74,0.50)',
    letterSpacing: 2.5,
  },
  title: {
    fontFamily: FontFamily.displayItalic,
    fontSize: 30,
    color: Colors.ink,
    marginTop: 2,
  },
  sub: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
