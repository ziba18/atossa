import React, { useMemo, useRef, useEffect } from 'react';
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

export function DayEditorSheet({ open, date, info, onClose, onMarkStart, onMarkEnd, onClear }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['46%'], []);

  useEffect(() => {
    if (open) sheetRef.current?.expand();
    else sheetRef.current?.close();
  }, [open]);

  if (!date) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.bg}
      handleIndicatorStyle={styles.handle}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.35} />
      )}
    >
      <BottomSheetView style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tag}>{info?.predicted ? 'PREDICTED' : 'LOGGED'}</Text>
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
            onPress={() => { onMarkStart(date); onClose(); }}
          />
          <Button
            label="Mark period end"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => { onMarkEnd(date); onClose(); }}
          />
          {!info?.predicted && (
            <Button
              label="Clear this day"
              variant="ghost"
              size="lg"
              fullWidth
              onPress={() => { onClear(date); onClose(); }}
            />
          )}
        </View>
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
    fontFamily: 'Fraunces_600SemiBold',
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
