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
import { DocumentPreview, SummaryThumb } from '../../../components/atossa/doctor/DocumentPreview';
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
  icon, label, caption, onPress, disabled, busy, compact,
}: { icon: IconName; label: string; /** One word under the circle (hidden in the compact bar). */ caption?: string; onPress: () => void; disabled?: boolean; busy?: boolean; compact?: boolean }) {
  const size = compact ? heights.minHit : heights.secondary;
  // The caption costs ~16 pt of bar height; on shorter screens (< 700) the glyph and its label alone stay.
  const roomForCaption = useWindowDimensions().height >= 700;
  const inactive = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!busy }}
      hitSlop={4}
      style={{ alignItems: 'center', gap: 2 }}
    >
      {({ pressed }) => (
        <>
          <View
            style={{
              width: size, height: size, borderRadius: radii.pill, borderWidth: 1,
              borderColor: inactive ? colors.hairline : colors.borderStrong, alignItems: 'center', justifyContent: 'center',
              backgroundColor: inactive || pressed ? colors.sunken : 'transparent',
            }}
          >
            <Icon name={icon} size={24} color={inactive ? colors.ink3 : colors.ink} />
          </View>
          {caption && !compact && roomForCaption ? <Txt variant="caption" color={inactive ? colors.ink3 : colors.ink2}>{caption}</Txt> : null}
        </>
      )}
    </Pressable>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: space.xxl, gap: space.sm }}>
      <Txt variant="headline" accessibilityRole="header" aria-level={2}>{title}</Txt>
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
  // Under ~240 pt wide (200% text on a small phone) a sticky bar plus the tab bar leaves no room for the summary: the bar moves to the end of the page.
  const inlineBar = winWidth < 240 || winHeight < 450;
  const nothingYet = doc.empty && doc.available.length === 0;
  // An appointment today: the note field sits above the Customise fold (phone layout) so it is hard to miss.
  // Phones with notes and an appointment: page 1 itself rides the appointment card, above the fold (PRD doctor-v2 §21).
  const thumbUp = !desk && winWidth >= 300 && winHeight >= 800 && !nothingYet && !doc.empty && !!upcoming;
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
        <BarIconButton compact={short} icon="printer" label="Print" caption="Print" onPress={print} disabled={off} busy={busy === 'print'} />
        <BarIconButton
          compact={short} icon="monitor" label="Show on screen" caption="Show" disabled={doc.empty}
          onPress={() => router.push('/(tabs)/doctor/show' as any)}
        />
      </View>
    </View>
  );

  return (
    <ScreenLarge wide={desk} title="For my doctor" right={<HeaderAvatar />} footer={nothingYet || inlineBar ? undefined : footer}>
      {/* With notes the title and the Save bar already say it; the line is kept for the first run only (more room to the chart above the fold). */}
      {short || !nothingYet ? null : (
        <Txt variant="body" color={colors.ink2}>Your notes, in your words, for your appointment.</Txt>
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
        <Card style={{ marginTop: short || thumbUp ? space.md : space.xl, flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          {/* Under ~240 pt wide the icon disc goes: the words beside it were breaking mid-word. */}
          {winWidth < 240 || short || thumbUp ? null : (
          <View aria-hidden style={{
            width: 44, height: 44, borderRadius: 22, backgroundColor: colors.plumTint,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="calendar" size={22} color={colors.ink} />
          </View>
          )}
          <View style={{ flex: 1 }}>
            {/* The date rides the caption so the name gets a line to itself (one line at 360). */}
            {thumbUp ? (
              <>
                <Txt variant="caption">{upcoming.data.date === today ? 'Appointment today' : 'Next appointment'}</Txt>
                <Txt variant="caption">{formatDay(upcoming.data.date)}</Txt>
              </>
            ) : (
              <Txt variant="caption">
                {joinFacts(upcoming.data.date === today ? 'Appointment today' : 'Next appointment', formatDay(upcoming.data.date).replace(/ /g, '\u00A0'))}
              </Txt>
            )}
            <Txt variant="headline">{upcoming.data.who.trim() || formatDay(upcoming.data.date)}</Txt>
          </View>
          {thumbUp ? <SummaryThumb doc={doc} width={winWidth < 340 ? 72 : 88} /> : null}
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
        <View style={{ marginTop: space.xl }}>
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

      {nothingYet && !olderData ? (
        <View style={{ marginTop: space.md }} accessible accessibilityLabel="Example summary. Made-up words, not yours.">
        <Card tone="sunken">
          <Txt variant="groupLabel">Example</Txt>
          <Txt variant="secondary" style={{ marginTop: space.xxs }}>How often and how strong</Txt>
          <Txt variant="body" style={{ marginTop: space.xs }}>Lower tummy · 12 of 28 days</Txt>
          <Txt variant="quote" style={{ marginTop: space.sm }}>{'“Dull ache that comes and goes, worse in the evening.”'}</Txt>
        </Card>
        </View>
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
            <DocumentPreview doc={doc} tall={desk} noCard={thumbUp} />
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
        <View style={{ marginTop: space.xl }}>
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
      {inlineBar ? <View style={{ marginTop: space.xl }}>{footer}</View> : null}
    </ScreenLarge>
  );
}
