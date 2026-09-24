import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, Share, TextInput } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { UI } from '../../../constants/atossaUI';
import { BigButton, Card, InlineError, PageTitle, Screen, Txt } from '../../../components/atossa/kit';
import { Icon } from '../../../components/ui/Icon';
import { useAuthStore } from '../../../stores/authStore';
import { useRecordsStore } from '../../../stores/recordsStore';
import {
  buildDoctorSummary, summaryToHtml, summaryToText, type SummaryRow,
} from '../../../lib/records/summary';

const C = UI.colors;

function Rows({ rows }: { rows: SummaryRow[] }) {
  return (
    <View>
      {rows.map((row, i) => (
        <View key={`${row.title}-${i}`} style={{ paddingVertical: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: C.border }}>
          <Txt variant="h3">{row.title}</Txt>
          {row.lines.map((line, j) => <Txt key={j} variant="body" style={{ marginTop: 2 }}>{line}</Txt>)}
        </View>
      ))}
    </View>
  );
}

function CollapsibleSection({ title, count, open, onToggle, children }: { title: string; count?: number; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}${count !== undefined ? `, ${count}` : ''}`}
        style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <Txt variant="h2" style={{ flex: 1 }}>
          {title}{count !== undefined ? <Txt variant="body" color={C.mutedForeground}> ({count})</Txt> : null}
        </Txt>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <Icon name="chevron-right" size={26} color={C.foreground} />
        </View>
      </Pressable>
      {open ? <View style={{ marginTop: 8 }}>{children}</View> : null}
    </View>
  );
}

export default function DoctorScreen() {
  const userId = useAuthStore((s) => s.user?.id);
  const { records, loadedFor, loading, error, load, saveDoctorNote } = useRecordsStore();
  const savedNote = records.doctor_note[0]?.data.text ?? '';
  const [notes, setNotes] = useState('');
  const touched = useRef(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({ glance: true, notes: true });

  // Show the saved note once it has loaded, unless the user has already started typing.
  useEffect(() => {
    if (!touched.current) setNotes(savedNote);
  }, [savedNote]);

  const summary = useMemo(
    () =>
      buildDoctorSummary({
        symptoms: records.symptom,
        periodDays: records.period_day,
        medicines: records.medicine,
        history: records.history,
        appointments: records.appointment,
        notes,
      }),
    [records, notes],
  );

  const toggle = (key: string) => setOpen((cur) => ({ ...cur, [key]: !cur[key] }));

  const saveNotes = async () => {
    setSavingNote(true);
    setNoteError('');
    try {
      await saveDoctorNote(notes);
      setNoteSaved(true);
    } catch {
      setNoteError("Your notes couldn't be saved. Check your connection and try again.");
    } finally {
      setSavingNote(false);
    }
  };

  const shareSummary = async () => {
    setSharing(true);
    setShareError('');
    try {
      if (await Sharing.isAvailableAsync()) {
        const { uri } = await Print.printToFileAsync({ html: summaryToHtml(summary) });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Share your Atossa summary' });
      } else {
        await Share.share({ title: 'My Atossa summary', message: summaryToText(summary) });
      }
    } catch {
      // Could not make or share a PDF — fall back to plain text so the summary can still be sent.
      try {
        await Share.share({ title: 'My Atossa summary', message: summaryToText(summary) });
      } catch {
        setShareError("The summary couldn't be shared. Please try again.");
      }
    } finally {
      setSharing(false);
    }
  };

  if (loading && loadedFor === null) {
    return <Screen><PageTitle title="For my doctor" /><Txt variant="body" color={C.mutedForeground}>Loading your information…</Txt></Screen>;
  }
  if (error && loadedFor === null) {
    return (
      <Screen>
        <PageTitle title="For my doctor" />
        <InlineError message={error} />
        <BigButton label="Try again" icon="refresh" onPress={() => userId && load(userId)} style={{ marginTop: 16 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Txt variant="bodyBold" color={C.primaryStrong}>{summary.rangeText}</Txt>
      <PageTitle title="For my doctor" subtitle="Information entered in Atossa." />

      <CollapsibleSection title="At a glance" count={summary.glance.length} open={!!open.glance} onToggle={() => toggle('glance')}>
        <Card tone="blue"><Rows rows={summary.glance} /></Card>
      </CollapsibleSection>

      {summary.sections.map((section) => (
        <CollapsibleSection key={section.key} title={section.title} count={section.count} open={!!open[section.key]} onToggle={() => toggle(section.key)}>
          {section.rows.length ? <Rows rows={section.rows} /> : <Txt variant="body" color={C.mutedForeground}>None saved.</Txt>}
        </CollapsibleSection>
      ))}

      <CollapsibleSection title="Doctor's notes for this visit" count={notes.trim() ? 1 : 0} open={!!open.notes} onToggle={() => toggle('notes')}>
        <Txt variant="small">These notes are included when sharing.</Txt>
        <View style={{ marginTop: 12, gap: 12 }}>
          <NotesBox value={notes} onChange={(v) => { touched.current = true; setNotes(v); setNoteSaved(false); }} />
          <InlineError message={noteError} />
          <BigButton label={savingNote ? 'Saving…' : 'Save notes'} icon="check" variant="outline" disabled={savingNote} onPress={saveNotes} />
          {noteSaved ? <Txt variant="smallBold" color={C.success} accessibilityRole="alert">Notes saved.</Txt> : null}
        </View>
      </CollapsibleSection>

      <View style={{ marginTop: 28, gap: 12 }}>
        <InlineError message={shareError} />
        <BigButton label={sharing ? 'Preparing…' : 'Share / PDF'} icon="external-link" disabled={sharing} onPress={shareSummary} />
        <Txt variant="small">This page only repeats information entered in Atossa and notes added during the appointment.</Txt>
      </View>
    </Screen>
  );
}

// Kept separate so typing in the notes doesn't re-create the whole summary layout each keystroke.
const NotesBox = React.memo(function NotesBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      multiline
      placeholder="Type notes here…"
      placeholderTextColor="#8b8079"
      accessibilityLabel="Doctor's notes for this visit"
      textAlignVertical="top"
      style={{
        minHeight: 200, borderRadius: UI.radius, borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
        padding: 16, fontFamily: UI.font.body, fontSize: UI.size.body, color: C.foreground,
      }}
    />
  );
});
