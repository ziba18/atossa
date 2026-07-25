import React, {
  forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback,
} from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Icon, type IconName } from '../ui/Icon';
import { supabase, fetchMany } from '../../lib/supabase';
import { formatDisplayDate, daysBetween, addDaysToStr, isDateInRange } from '../../algorithms/dateHelpers';
import type { CycleLog, FlowIntensity, SymptomLog } from '../../types/database';

const PINK      = '#9CAF88';
const PINK_DEEP = '#1B4332';
const PINK_SOFT = '#E3DCC6';
const COMPOSER  = '#E3DCC6';
const INK       = '#1A1512';
const MUTED     = '#7A6F5C';

const FLOW_OPTIONS: { value: FlowIntensity; label: string; drops: number }[] = [
  { value: 'spotting',   label: 'Spotting',   drops: 1 },
  { value: 'light',      label: 'Light',      drops: 1 },
  { value: 'medium',     label: 'Medium',     drops: 2 },
  { value: 'heavy',      label: 'Heavy',      drops: 3 },
  { value: 'very_heavy', label: 'Very heavy', drops: 3 },
];

// Most-common first; chip grid stays short so nothing requires scrolling to find.
const SYMPTOMS: { key: string; label: string; icon: IconName }[] = [
  { key: 'cramps',            label: 'Cramps',         icon: 'activity' },
  { key: 'headache',          label: 'Headache',       icon: 'brain' },
  { key: 'bloating',          label: 'Bloating',       icon: 'droplets' },
  { key: 'breast_tenderness', label: 'Tender breasts', icon: 'heart' },
  { key: 'fatigue',           label: 'Fatigue',        icon: 'zap' },
  { key: 'back_pain',         label: 'Backache',       icon: 'activity' },
  { key: 'acne',              label: 'Acne',           icon: 'eye' },
];

// 5–7 options max, plain language, single-select.
const MOODS: { key: string; label: string; emoji: string }[] = [
  { key: 'great',     label: 'Great',     emoji: '😊' },
  { key: 'good',      label: 'Good',      emoji: '🙂' },
  { key: 'okay',      label: 'Okay',      emoji: '😐' },
  { key: 'low',       label: 'Low',       emoji: '😔' },
  { key: 'irritable', label: 'Irritable', emoji: '😠' },
  { key: 'anxious',   label: 'Anxious',   emoji: '😰' },
];

const DAILY_TYPES = ['symptom', 'mood', 'note'];

export interface LogEntrySheetHandle {
  open: (date: string) => void;
  close: () => void;
}

interface Props {
  userId: string;
  onSaved: () => void;
}

export const LogEntrySheet = forwardRef<LogEntrySheetHandle, Props>(({ userId, onSaved }, ref) => {
  const sheetRef = useRef<BottomSheet>(null);
  const [date, setDate] = useState<string | null>(null);
  const [flow, setFlow] = useState<FlowIntensity | null>(null);
  const [symptoms, setSymptoms] = useState<Set<string>>(new Set());
  const [mood, setMood] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [confirmText, setConfirmText] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useImperativeHandle(ref, () => ({
    open: (d: string) => {
      setDate(d);
      loadedRef.current = false;
      sheetRef.current?.snapToIndex(0);
    },
    close: () => sheetRef.current?.close(),
  }), []);

  // Prefill once the sheet has a date — never auto-opens the keyboard.
  useEffect(() => {
    if (!date) return;
    (async () => {
      const [cycles, sym] = await Promise.all([
        fetchMany<CycleLog>('cycle_logs', { user_id: userId }, { orderBy: 'period_start', ascending: false, limit: 12 }),
        fetchMany<SymptomLog>('symptom_logs', { user_id: userId, logged_date: date }, { limit: 60 }),
      ]);
      const period = cycles.find((c) => isDateInRange(date, c.period_start, c.period_end ?? c.period_start));
      setFlow(period?.flow_intensity ?? null);

      const sset = new Set<string>();
      let m: string | null = null;
      let n = '';
      for (const r of sym) {
        if (r.symptom_type === 'symptom' && r.custom_label) sset.add(r.custom_label);
        if (r.symptom_type === 'mood' && r.custom_label) m = r.custom_label;
        if (r.symptom_type === 'note') n = r.notes ?? '';
      }
      setSymptoms(sset);
      setMood(m);
      setNotes(n);
      setNotesOpen(!!n);
      loadedRef.current = true;
    })();
  }, [date, userId]);

  const flash = useCallback((msg: string) => {
    setConfirmText(msg);
    setTimeout(() => setConfirmText(null), 1400);
  }, []);

  // ── Merge a day into a contiguous cycle_logs period range ──────────────────
  const applyFlow = useCallback(async (d: string, value: FlowIntensity | null) => {
    const logs = await fetchMany<CycleLog>('cycle_logs', { user_id: userId }, { orderBy: 'period_start', ascending: false, limit: 24 });
    const containing = logs.find((c) => isDateInRange(d, c.period_start, c.period_end ?? c.period_start));
    const adjacent = logs.find((c) =>
      isDateInRange(d, addDaysToStr(c.period_start, -1), addDaysToStr(c.period_end ?? c.period_start, 1)),
    );

    if (value) {
      const target = containing ?? adjacent;
      if (target) {
        const start = d < target.period_start ? d : target.period_start;
        const endCur = target.period_end ?? target.period_start;
        const end = d > endCur ? d : endCur;
        await supabase.from('cycle_logs').update({
          period_start: start,
          period_end: start === end ? null : end,
          period_length: daysBetween(start, end) + 1,
          flow_intensity: d === start ? value : (target.flow_intensity ?? value),
          is_confirmed: true,
        }).eq('id', target.id);
        return;
      }
      // No nearby period — this is a new cycle starting. Caller already confirmed.
      await supabase.from('cycle_logs').insert({
        user_id: userId, period_start: d, period_end: null, period_length: 1,
        flow_intensity: value, is_confirmed: true,
      });
      return;
    }

    if (!containing) return;
    const start = containing.period_start;
    const end = containing.period_end ?? containing.period_start;
    if (start === end) {
      await supabase.from('cycle_logs').delete().eq('id', containing.id);
    } else if (d === start) {
      const newStart = addDaysToStr(start, 1);
      await supabase.from('cycle_logs').update({
        period_start: newStart, period_end: newStart === end ? null : end,
        period_length: daysBetween(newStart, end) + 1,
      }).eq('id', containing.id);
    } else if (d === end) {
      const newEnd = addDaysToStr(end, -1);
      await supabase.from('cycle_logs').update({
        period_end: start === newEnd ? null : newEnd,
        period_length: daysBetween(start, newEnd) + 1,
      }).eq('id', containing.id);
    }
  }, [userId]);

  const selectFlow = useCallback(async (value: FlowIntensity | null) => {
    if (!date) return;
    setFlow(value);
    if (value === null) {
      await applyFlow(date, null);
      onSaved();
      return;
    }

    // Data-integrity check: more than ~2 days since any nearby logged period
    // day means this looks like the start of a new cycle, not a continuation.
    const logs = await fetchMany<CycleLog>('cycle_logs', { user_id: userId }, { orderBy: 'period_start', ascending: false, limit: 6 });
    const nearby = logs.find((c) => {
      const end = c.period_end ?? c.period_start;
      return Math.abs(daysBetween(end, date)) <= 2 || Math.abs(daysBetween(c.period_start, date)) <= 2;
    });

    if (!nearby && logs.length > 0) {
      Alert.alert(
        'Start of a new period?',
        "It's been a few days since your last logged period day.",
        [
          { text: 'No, just spotting', style: 'cancel', onPress: () => { setFlow(null); } },
          { text: 'Yes, new period', onPress: async () => { await applyFlow(date, value); flash('Saved'); onSaved(); } },
        ],
      );
      return;
    }

    await applyFlow(date, value);
    flash('Saved');
    onSaved();
  }, [date, userId, applyFlow, onSaved, flash]);

  // Debounced auto-save for symptoms / mood / notes — feels instant without
  // hammering the database on every single chip tap.
  const detailsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!date || !loadedRef.current) return;
    if (detailsTimer.current) clearTimeout(detailsTimer.current);
    detailsTimer.current = setTimeout(async () => {
      await supabase.from('symptom_logs')
        .delete().eq('user_id', userId).eq('logged_date', date).in('symptom_type', DAILY_TYPES);

      const time = new Date().toTimeString().slice(0, 8);
      const base = { user_id: userId, logged_date: date, logged_time: time, severity: null as number | null };
      const rows: any[] = [];
      symptoms.forEach((k) => rows.push({ ...base, symptom_type: 'symptom', custom_label: k }));
      if (mood) rows.push({ ...base, symptom_type: 'mood', custom_label: mood });
      if (notes.trim()) rows.push({ ...base, symptom_type: 'note', custom_label: null, notes: notes.trim() });

      if (rows.length) await supabase.from('symptom_logs').insert(rows);
      flash('Saved');
      onSaved();
    }, 500);
    return () => { if (detailsTimer.current) clearTimeout(detailsTimer.current); };
  }, [symptoms, mood, notes, date, userId, onSaved, flash]);

  const toggleSymptom = (key: string) => {
    setSymptoms((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['62%', '88%']}
      enablePanDownToClose
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={styles.header}>
        <View style={styles.dateRow}>
          <Icon name="broom" size={14} color={PINK_DEEP} />
          <Text style={styles.dateText}>{date ? formatDisplayDate(date) : ''}</Text>
        </View>
        {confirmText && (
          <View style={styles.confirmPill}>
            <Icon name="check" size={12} color="#fff" />
            <Text style={styles.confirmText}>{confirmText}</Text>
          </View>
        )}
      </BottomSheetView>

      <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Flow — primary, always visible, one tap is a complete log */}
        <View style={styles.flowRow}>
          <Pressable style={[styles.flowChip, flow === null && styles.flowChipActive]} onPress={() => selectFlow(null)}>
            <Icon name="x" size={14} color={flow === null ? '#fff' : PINK_DEEP} />
            <Text style={[styles.flowLabel, flow === null && styles.flowLabelActive]}>None</Text>
          </Pressable>
          {FLOW_OPTIONS.map((f) => {
            const active = flow === f.value;
            return (
              <Pressable key={f.value} style={[styles.flowChip, active && styles.flowChipActive]} onPress={() => selectFlow(f.value)}>
                <View style={styles.drops}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <Icon key={i} name="droplet" size={11}
                      color={i < f.drops ? (active ? '#fff' : PINK_DEEP) : (active ? 'rgba(255,255,255,0.4)' : PINK_SOFT)} />
                  ))}
                </View>
                <Text style={[styles.flowLabel, active && styles.flowLabelActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Symptoms — optional, multi-select */}
        <Text style={styles.sectionLabel}>Symptoms</Text>
        <View style={styles.chipRow}>
          {SYMPTOMS.map((s) => {
            const active = symptoms.has(s.key);
            return (
              <Pressable key={s.key} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleSymptom(s.key)}>
                <Icon name={s.icon} size={13} color={active ? '#fff' : PINK_DEEP} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Mood — optional, single-select */}
        <Text style={styles.sectionLabel}>Mood</Text>
        <View style={styles.chipRow}>
          {MOODS.map((m) => {
            const active = mood === m.key;
            return (
              <Pressable key={m.key} style={[styles.chip, active && styles.chipActive]} onPress={() => setMood(active ? null : m.key)}>
                <Text style={styles.emoji}>{m.emoji}</Text>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Notes — collapsed until tapped; never auto-opens the keyboard */}
        {notesOpen ? (
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything else worth remembering…"
            placeholderTextColor={MUTED}
            multiline
            autoFocus
          />
        ) : (
          <Pressable style={styles.addNoteBtn} onPress={() => setNotesOpen(true)}>
            <Icon name="plus" size={13} color={PINK_DEEP} />
            <Text style={styles.addNoteText}>Add a note</Text>
          </Pressable>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: '#FFFDF6', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handle: { backgroundColor: PINK_SOFT, width: 40 },
  header: { paddingHorizontal: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { color: INK, fontSize: 16, fontWeight: '800' },
  confirmPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#3F7D58',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  confirmText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  content: { paddingHorizontal: 20, paddingBottom: 36, gap: 6 },

  flowRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  flowChip: {
    flexGrow: 1, minWidth: '30%', alignItems: 'center', gap: 5, paddingVertical: 13,
    borderRadius: 16, backgroundColor: COMPOSER, borderWidth: 1, borderColor: PINK,
  },
  flowChipActive: { backgroundColor: PINK_DEEP, borderColor: PINK_DEEP },
  drops: { flexDirection: 'row', gap: 1, height: 14, alignItems: 'center' },
  flowLabel: { color: PINK_DEEP, fontSize: 12, fontWeight: '700' },
  flowLabelActive: { color: '#fff' },

  sectionLabel: { color: MUTED, fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9,
    borderRadius: 999, backgroundColor: COMPOSER, borderWidth: 1, borderColor: PINK,
  },
  chipActive: { backgroundColor: PINK_DEEP, borderColor: PINK_DEEP },
  chipText: { color: PINK_DEEP, fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  emoji: { fontSize: 14 },

  addNoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingVertical: 6 },
  addNoteText: { color: PINK_DEEP, fontSize: 13, fontWeight: '700' },
  notesInput: {
    backgroundColor: COMPOSER, borderRadius: 14, borderWidth: 1, borderColor: PINK,
    paddingHorizontal: 14, paddingVertical: 11, color: INK, fontSize: 14, minHeight: 80,
    textAlignVertical: 'top', marginTop: 10,
  },
});
