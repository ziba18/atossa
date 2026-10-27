// For my doctor — the summary builder. Everything on this tab only repeats what Sam entered.
// One model (lib/records/summary.ts) feeds the preview, Show on screen and the PDF.
import { usePageTitle } from '../../../lib/usePageTitle';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, heights, radii, space } from '../../../constants/atossaUI';
import {
  Button, Card, ChipGroup, EmptyState, HeaderAvatar, InlineError, SafetyLine, ScreenLarge, SkeletonCards, Txt, showToast,
} from '../../../components/atossa/kit';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { openCapture } from '../../../lib/captureStore';
import { AgendaField } from '../../../components/atossa/doctor/AgendaField';
import { DocumentPreview } from '../../../components/atossa/doctor/DocumentPreview';
import { PageOneCards } from '../../../components/atossa/doctor/PageOneCards';
import { SectionToggles } from '../../../components/atossa/doctor/SectionToggles';
import { printSummary, shareSummaryPdf } from '../../../components/atossa/doctor/share';
import { useDoctorBuilder, useDoctorDoc } from '../../../components/atossa/doctor/useDoctorDoc';
import { useTimelineSession } from '../../../components/atossa/timeline/session';
import { haptics } from '../../../lib/haptics';
import { formatDay, joinFacts, notesLabel } from '../../../lib/records/format';
import { toKey, todayKey } from '../../../lib/records/dates';
import {
  RANGE_LABEL, VISIT_TYPES, agendaTitleFor, summaryToHtml, type RangeChoice, type VisitType,
} from '../../../lib/records/summary';
import { useAuthStore } from '../../../stores/authStore';
import { useRecordsStore } from '../../../stores/recordsStore';

const isCancel = (e: unknown) => /cancel|did not complete|dismiss/i.test(String((e as Error)?.message ?? e));

/**
 * 48 outlined circle with an icon — Print and Show on screen in the share bar (labelled for screen
 * readers). Disabled: an ink-3 glyph on a sunken disc, so it can't be mistaken for an active button.
 */
function BarIconButton({
  icon, label, onPress, disabled, busy, compact,
}: { icon: IconName; label: string; onPress: () => void; disabled?: boolean; busy?: boolean; compact?: boolean }) {
  const size = compact ? heights.minHit : heights.secondary;
  const inactive = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!busy }}
      hitSlop={4}
      style={({ pressed }) => ({
        width: size, height: size, borderRadius: radii.pill, borderWidth: 1,
        borderColor: inactive ? colors.hairline : colors.borderStrong, alignItems: 'center', justifyContent: 'center',
        backgroundColor: inactive || pressed ? colors.sunken : 'transparent',
      })}
    >
      <Icon name={icon} size={24} color={inactive ? colors.ink3 : colors.ink} />
    </Pressable>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: space.xxl, gap: space.sm }}>
      <Txt variant="headline" accessibilityRole="header">{title}</Txt>
      {children}
    </View>
  );
}

export default function DoctorScreen() {
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  usePageTitle('For my doctor');
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const loading = useRecordsStore((s) => s.loading);
  const loadedFor = useRecordsStore((s) => s.loadedFor);
  const loadError = useRecordsStore((s) => s.error);
  const offlineCopyFrom = useRecordsStore((s) => s.offlineCopyFrom);
  const localKey = (iso: string) => { const d = new Date(iso); return toKey(d.getFullYear(), d.getMonth(), d.getDate()); };
  const load = useRecordsStore((s) => s.load);
  const savedNote = useRecordsStore((s) => s.records.doctor_note[0]?.data.text ?? '');
  const saveDoctorNote = useRecordsStore((s) => s.saveDoctorNote);
  const symptomRecs = useRecordsStore((s) => s.records.symptom);
  const periodRecs = useRecordsStore((s) => s.records.period_day);

  const { visitType, agenda, include, setVisitType, setRange, setAgenda, loadAgenda, setInclude } = useDoctorBuilder();
  const { doc, range, hasLast, rangeNote, upcoming } = useDoctorDoc();

  const [customise, setCustomise] = useState(false);
  const [busy, setBusy] = useState<'share' | 'print' | null>(null);
  const [actionError, setActionError] = useState('');
  const [noteError, setNoteError] = useState('');
  const lastSaved = useRef(savedNote);

  // Show the saved "What I'd like from today" once loaded, unless Sam already typed this session.
  useEffect(() => {
    lastSaved.current = savedNote;
    loadAgenda(savedNote);
  }, [savedNote, loadAgenda]);

  const saveAgenda = async () => {
    const text = useDoctorBuilder.getState().agenda.trim();
    if (text === lastSaved.current.trim()) return;
    setNoteError('');
    try {
      await saveDoctorNote(text);
      lastSaved.current = text;
    } catch {
      setNoteError("Your words couldn’t be saved just now. They’re still in this summary.");
    }
  };

  const share = async () => {
    setBusy('share');
    setActionError('');
    try {
      await shareSummaryPdf(summaryToHtml(doc), 'Share your summary', () => {
        haptics.success();
        // On web the browser's print window is the confirmation; a toast would outlive a cancelled dialog.
        if (Platform.OS !== 'web') showToast('Summary ready to share.');
      });
    } catch (e) {
      if (!isCancel(e)) setActionError("The summary couldn’t be made into a PDF. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const print = async () => {
    setBusy('print');
    setActionError('');
    try {
      await printSummary(summaryToHtml(doc));
    } catch (e) {
      if (!isCancel(e)) setActionError("The summary couldn’t be sent to a printer. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  if (loadedFor === null && (loading || loadError)) {
    return (
      <ScreenLarge title="For my doctor" right={<HeaderAvatar />}>
        {loadError ? (
          <InlineError message={loadError} onRetry={userId ? () => load(userId) : undefined} />
        ) : (
          <SkeletonCards count={3} label="Loading your information" />
        )}
      </ScreenLarge>
    );
  }

  const today = todayKey();
  const rangeOptions: { value: RangeChoice; label: string }[] = [
    ...(hasLast ? [{ value: 'since' as const, label: RANGE_LABEL.since }] : []),
    { value: '3m', label: RANGE_LABEL['3m'] },
    { value: '6m', label: RANGE_LABEL['6m'] },
  ];
  // Short phones (320x568): no intro line, tighter gaps, one-line agenda hint, so the digits card starts on the first screen.
  const short = winHeight < 640 && winWidth < 700;
  const agendaTitle = agendaTitleFor(upcoming?.data.date === today);
  // No data at all for this summary: a calm empty state instead of an empty page.
  // Web at desktop width: preview (the document) on the right, controls always open on the left.
  const desk = Platform.OS === 'web' && winWidth >= 1024;
  const nothingYet = doc.empty && doc.available.length === 0;
  // An appointment today: the note field sits above the Customise fold (phone layout) so it is hard to miss.
  const agendaUp = !desk && !nothingYet && upcoming?.data.date === today;
  // With nothing to share, the builder steps are noise — only the range stays, and only when a
  // longer range would find something.
  const olderData = symptomRecs.some((r) => r.data.date < doc.from) || periodRecs.some((r) => r.data.date < doc.from);
  const off = doc.empty || busy !== null;

  // One slim row: Share PDF (primary) + Print and Show on screen as labelled 48 icon buttons.
  const footer = (
    <View style={{ gap: space.xs }}>
      <InlineError message={actionError} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.xs }}>
        <Button
          label={winWidth < 280 ? 'Save' : Platform.OS === 'web' ? 'Save PDF' : 'Share PDF'}
          accessibilityLabel={Platform.OS === 'web' ? 'Save PDF' : 'Share PDF'}
          icon="share-2"
          onPress={share}
          loading={busy === 'share'}
          disabled={off}
          style={{ flex: 1, minWidth: winWidth < 280 ? 64 : 120, maxWidth: desk ? 420 : undefined, ...(short ? { minHeight: heights.minHit } : null) }}
          accessibilityHint={doc.empty ? 'Nothing to share yet' : Platform.OS === 'web' ? 'Opens the print window; choose Save as PDF' : 'Makes a PDF and opens the share sheet'}
        />
        <BarIconButton compact={short} icon="printer" label="Print" onPress={print} disabled={off} busy={busy === 'print'} />
        <BarIconButton
          compact={short} icon="monitor" label="Show on screen" disabled={doc.empty}
          onPress={() => router.push('/(tabs)/doctor/show' as any)}
        />
      </View>
    </View>
  );

  return (
    <ScreenLarge wide={desk} title="For my doctor" right={<HeaderAvatar />} footer={footer}>
      {short ? null : (
        <Txt variant="body" color={colors.ink2}>
          Your notes, in your words, ready to share.
        </Txt>
      )}

      {offlineCopyFrom ? (
        <Card tone="sunken" style={{ marginTop: space.md }}>
          <Txt accessibilityRole="alert" testID="offline-copy">
            {`No connection. This is the copy saved on this phone. Made on ${formatDay(localKey(offlineCopyFrom), 'always')}.`}
          </Txt>
          {userId ? <Button label="Try again" variant="text" small onPress={() => load(userId)} /> : null}
        </Card>
      ) : null}

      {upcoming ? (
        <Card style={{ marginTop: short ? space.md : space.xl, flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          {/* Under ~240 pt wide the icon disc goes: the words beside it were breaking mid-word. */}
          {winWidth < 240 || short ? null : (
          <View aria-hidden style={{
            width: 44, height: 44, borderRadius: 22, backgroundColor: colors.plumTint,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="calendar" size={22} color={colors.ink} />
          </View>
          )}
          <View style={{ flex: 1 }}>
            <Txt variant="caption">{upcoming.data.date === today ? 'Appointment today' : 'Next appointment'}</Txt>
            <Txt variant="headline">
              {joinFacts(upcoming.data.who.trim(), formatDay(upcoming.data.date).replace(/ /g, '\u00A0'))}
            </Txt>
          </View>
        </Card>
      ) : null}

      {desk && !nothingYet ? (
        <View style={{ flexDirection: 'row', gap: space.xxl, alignItems: 'flex-start' }}>
          <View style={{ width: 340 }}>
      {nothingYet ? null : (
        <Step title="What’s this appointment for?">
          <ChipGroup
            mode="single"
            options={[...VISIT_TYPES]}
            value={visitType}
            onChange={(v) => setVisitType(v as VisitType | null)}
            allowDeselect
            accessibilityLabel="What’s this appointment for?"
          />
        </Step>
      )}

      {nothingYet && !olderData ? null : (
        <Step title="How far back?">
          <ChipGroup
            mode="single"
            options={rangeOptions}
            value={range}
            onChange={(v) => { if (v) setRange(v as RangeChoice); }}
            accessibilityLabel="How far back?"
          />
          {rangeNote ? <Txt variant="secondary">{rangeNote}</Txt> : null}
          <Txt variant="secondary">{joinFacts(doc.rangeLabel, notesLabel(doc.entries))}</Txt>
        </Step>
      )}

      {nothingYet ? null : (
        <View style={{ marginTop: space.xxl }}>
          <AgendaField value={agenda} onChange={setAgenda} onBlur={saveAgenda} title={agendaTitle} />
          <InlineError message={noteError} style={{ marginTop: space.xs }} />
        </View>
      )}

      {doc.available.length ? (
        <Step title="Sections">
          <SectionToggles sections={doc.available} include={include} onChange={setInclude} />
        </Step>
      ) : null}

          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
      <Step title={nothingYet ? 'Your summary' : 'Preview'}>
        {nothingYet ? (
          <Card>
            <EmptyState
              message={olderData
                ? 'Nothing logged in this time. Choose a longer range above, or add a note.'
                : 'Nothing to share yet. Notes you add will appear here, in your words.'}
              action={{ label: 'Add a note', onPress: () => openCapture() }}
              style={{ paddingVertical: space.xl }} />
          </Card>
        ) : doc.empty ? (
          <Card>
            <EmptyState message="Every section is switched off. Turn one on below to include it." style={{ paddingVertical: space.xl }} />
          </Card>
        ) : (
          <>
            <DocumentPreview doc={doc} tall={desk} />
            <View style={{ marginTop: space.sm, marginLeft: -space.xs, alignItems: 'flex-start' }}>
              <Button
                label="See the patterns behind this"
                variant="text"
                small
                onPress={() => { useTimelineSession.getState().setMode('patterns'); router.push('/(tabs)/timeline' as any); }}
                accessibilityHint="Opens Patterns on the Timeline tab"
              />
            </View>
          </>
        )}
      </Step>

          </View>
        </View>
      ) : (
        <>
      {nothingYet || doc.empty ? (
        <Step title="Your summary">
          {nothingYet ? (
            <Card>
              <EmptyState
                message={olderData
                  ? 'Nothing logged in this time. Choose a longer range above, or add a note.'
                  : 'Nothing to share yet. Notes you add will appear here, in your words.'}
                action={{ label: 'Add a note', onPress: () => openCapture() }}
                style={{ paddingVertical: space.xl }} />
            </Card>
          ) : (
            <Card>
              <EmptyState message="Every section is switched off. Turn one on below to include it." style={{ paddingVertical: space.xl }} />
            </Card>
          )}
        </Step>
      ) : null}

      {agendaUp ? (
        <View style={{ marginTop: short ? space.md : space.xl }}>
          <AgendaField value={agenda} onChange={setAgenda} onBlur={saveAgenda} title={agendaTitle} compact={short} />
          <InlineError message={noteError} style={{ marginTop: space.xs }} />
        </View>
      ) : null}

      {!nothingYet && !doc.empty ? (
        <>
          <PageOneCards doc={doc} showAgenda={!agendaUp} />
          <Step title="Your summary page">
            <DocumentPreview doc={doc} tall={desk} />
          </Step>
          <View style={{ marginTop: space.sm, marginLeft: -space.xs, alignItems: 'flex-start' }}>
            <Button
              label="See the patterns behind this"
              variant="text"
              small
              onPress={() => { useTimelineSession.getState().setMode('patterns'); router.push('/(tabs)/timeline' as any); }}
              accessibilityHint="Opens Patterns on the Timeline tab"
            />
          </View>
        </>
      ) : null}

      {nothingYet && !olderData ? null : (
        <Pressable
          onPress={() => setCustomise((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: customise }}
          accessibilityLabel="Customise this summary"
          style={{
            marginTop: space.xl, flexDirection: 'row', alignItems: 'center', gap: space.sm,
            minHeight: heights.secondary, paddingVertical: space.sm,
          }}
        >
          <Icon name="settings" size={24} color={colors.plum} />
          <View style={{ flex: 1 }}>
            <Txt variant="headline">Customise this summary</Txt>
            <Txt variant="secondary">{joinFacts(visitType ?? 'Any visit', doc.rangeLabel)}</Txt>
          </View>
          <Icon name={customise ? 'chevron-up' : 'chevron-down'} size={24} color={colors.ink2} />
        </Pressable>
      )}
      {customise ? (
        <View>
      {nothingYet ? null : (
        <Step title="What’s this appointment for?">
          <ChipGroup
            mode="single"
            options={[...VISIT_TYPES]}
            value={visitType}
            onChange={(v) => setVisitType(v as VisitType | null)}
            allowDeselect
            accessibilityLabel="What’s this appointment for?"
          />
        </Step>
      )}

      {nothingYet && !olderData ? null : (
        <Step title="How far back?">
          <ChipGroup
            mode="single"
            options={rangeOptions}
            value={range}
            onChange={(v) => { if (v) setRange(v as RangeChoice); }}
            accessibilityLabel="How far back?"
          />
          {rangeNote ? <Txt variant="secondary">{rangeNote}</Txt> : null}
          <Txt variant="secondary">{joinFacts(doc.rangeLabel, notesLabel(doc.entries))}</Txt>
        </Step>
      )}

      {nothingYet || agendaUp ? null : (
        <View style={{ marginTop: space.xxl }}>
          <AgendaField value={agenda} onChange={setAgenda} onBlur={saveAgenda} title={agendaTitle} />
          <InlineError message={noteError} style={{ marginTop: space.xs }} />
        </View>
      )}

      {doc.available.length ? (
        <Step title="Sections">
          <SectionToggles sections={doc.available} include={include} onChange={setInclude} />
        </Step>
      ) : null}

        </View>
      ) : null}
        </>
      )}

      <SafetyLine style={{ marginTop: space.xxl }} />
    </ScreenLarge>
  );
}
