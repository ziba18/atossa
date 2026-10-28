// A real thumbnail: a fixed-height crop of the top of page 1 (A4 proportions, capped at 420),
// with a white fade at the foot — no inner scroll, nothing inside it is touchable. Tapping the
// card opens the document reflowed at readable size (body 15) in a full sheet, so Sam can read
// every word on a phone; pinch-zoom on iOS for a closer look. The whole page is still laid out
// (clipped) so the caption can say how many A4 pages the PDF will be.
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, layout, radii, shadows, space } from '../../../constants/atossaUI';
import { printedRange, type DoctorDoc } from '../../../lib/records/summary';
import { Icon } from '../../ui/Icon';
import { Button, Quote, Sheet, Txt } from '../kit';
import { A4, DocumentView } from './DocumentView';

// Printable height per A4 page: 842 pt minus the PDF's 40/34 pt margins and the repeated footer.
const PRINT_PAGE_BODY = 842 - 40 - 34 - 28;
const PRINT_VS_SCREEN = 0.835; // printed length / on-screen length, see `pages` below. Re-measured 28 Oct 2026 after the PDF became a record (Sam seed: on-screen 1867 pt printed as 2 pages, page 2 about 97% full).
const PAGE_CHROME = A4.pad * 2 + 28; // the on-screen page's padding + its single footer
const THUMB_MAX_H = 300; // phone: a peek at the page; the section cards below carry the readable content
const FADE_H = 48;

/** Page 1, scaled to `width` and clipped to `height`. Reports the full laid-out page height. */
function PageCrop({ doc, width, height, onHeight }: { doc: DoctorDoc; width: number; height: number; onHeight: (h: number) => void }) {
  const scale = width / A4.width;
  return (
    <View
      style={{ width, height, overflow: 'hidden' }}
      pointerEvents="none"
      aria-hidden
    >
      <View
        style={{ position: 'absolute', top: 0, left: 0, width: A4.width, transform: [{ scale }], transformOrigin: 'top left' }}
        onLayout={(e) => onHeight(e.nativeEvent.layout.height)}
      >
        <DocumentView doc={doc} />
      </View>
      <LinearGradient
        colors={['rgba(255,255,255,0)', colors.white]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: FADE_H }}
        pointerEvents="none"
      />
    </View>
  );
}

/** Pages the PDF will run to, from the on-screen page's laid-out height (factor measured in design/a4-gap.md, run 22). */
function pagesFor(docHeight: number) {
  return Math.max(1, Math.ceil(((docHeight - PAGE_CHROME) / PRINT_PAGE_BODY) * PRINT_VS_SCREEN));
}

/** The reader sheet: the whole summary at a size you can read. One place, used by the thumbnail and the preview. */
function ReaderSheet({ doc, open, onClose }: { doc: DoctorDoc; open: boolean; onClose: () => void }) {
  const { width: screenW } = useWindowDimensions();
  const readerWidth = Math.min(screenW, layout.maxContentWidth) - layout.gutter * 2; // the Sheet's content gutter
  return (
    <Sheet visible={open} onClose={onClose} title="Your summary" full scroll={false} closeLabel="Close summary">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space.xxxl, alignItems: 'center' }}
        maximumZoomScale={3}
        minimumZoomScale={1}
        bouncesZoom
        pinchGestureEnabled
      >
        <View style={{ borderWidth: 1, borderColor: colors.hairline, borderRadius: radii.input, overflow: 'hidden' }}>
          <DocumentView doc={doc} variant="reader" width={readerWidth - 2} />
        </View>
      </ScrollView>
    </Sheet>
  );
}

/** Phones: page 1 itself, scaled (the same DocumentView the PDF uses), above the fold. Tap opens the readable page. */
export function SummaryThumb({ doc, width = 96 }: { doc: DoctorDoc; width?: number }) {
  const [docHeight, setDocHeight] = useState<number>(A4.height);
  const [open, setOpen] = useState(false);
  const height = Math.round(width * 1.1); // the top of page 1 (header, agenda, pattern table), not the whole sheet
  const pages = pagesFor(docHeight);
  return (
    <View style={{ alignItems: 'center', gap: space.xxs }}>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Preview of page 1 of your summary"
        accessibilityHint="Opens the summary at a size you can read"
        style={({ pressed }) => [{ width, height, borderRadius: 6, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.white, overflow: 'hidden', opacity: pressed ? 0.85 : 1 }, shadows.hero]}
      >
        <PageCrop doc={doc} width={width - 2} height={height - 2} onHeight={setDocHeight} />
      </Pressable>
      <Txt variant="caption">{`Page 1 of ${pages}`}</Txt>
      <ReaderSheet doc={doc} open={open} onClose={() => setOpen(false)} />
    </View>
  );
}

export function DocumentPreview({ doc, tall, noCard }: { doc: DoctorDoc; tall?: boolean; noCard?: boolean }) {
  const [width, setWidth] = useState(0);
  const [docHeight, setDocHeight] = useState<number>(A4.height);
  const [open, setOpen] = useState(false);
  const { width: screenW } = useWindowDimensions();
  // The on-screen page runs about 15% longer than the PDF's compact tables. Measured on Sam's seed (real Chromium PDF vs
  // this height): 2.18 / 1.96 / 1.68 / 1.17 screen pages printed as 2 / 2 / 2 / 1 pages, each at or just under the
  // estimate (design/a4-gap.md, run 22). Never lower the factor without re-measuring.
  const pages = pagesFor(docHeight);
  const inner = Math.max(0, width - 2); // inside the 1 px border
  const thumbH = Math.min(Math.round(inner * (A4.height / A4.width)), tall ? THUMB_MAX_H * 2 : THUMB_MAX_H);
  const wordsSec = doc.sections.find((x) => x.id === 'words');
  const words = wordsSec && wordsSec.id === 'words' ? wordsSec.quotes[0] : undefined;
  const readerWidth = Math.min(screenW, layout.maxContentWidth) - layout.gutter * 2; // the Sheet's content gutter

  return (
    <View>
      {tall ? (
        <>
          <Pressable
            onPress={() => setOpen(true)}
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
            accessibilityRole="button"
            accessibilityLabel={`Preview of your summary, ${pages === 1 ? 'one page' : `about ${pages} pages`}`}
            accessibilityHint="Opens the summary at a size you can read"
            style={({ pressed }) => [{
              borderRadius: radii.input, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface,
              overflow: 'hidden', opacity: pressed ? 0.85 : 1,
            }, shadows.hero]}
          >
            {inner > 0 ? <PageCrop doc={doc} width={inner} height={thumbH} onHeight={setDocHeight} /> : <View style={{ height: THUMB_MAX_H }} />}
          </Pressable>
          <Txt variant="secondary" style={{ marginTop: space.sm, textAlign: 'center' }}>
            {`${doc.entries} ${doc.entries === 1 ? 'note' : 'notes'} · ${printedRange(doc).split(' · ')[0]} · ${pages === 1 ? 'one page' : `about ${pages} pages`}`}
          </Txt>
        </>
      ) : (
        // Phones: the page itself is far too small to read as a thumbnail, so it is a labelled card that opens the
        // readable version. The page is still laid out, unseen, so the page count stays measured.
        <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          <View style={{ height: 0, overflow: 'hidden' }} aria-hidden>
            {inner > 0 ? <PageCrop doc={doc} width={inner} height={0} onHeight={setDocHeight} /> : null}
          </View>
          {noCard ? null : <Pressable
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Your summary page, ${pages === 1 ? 'one page' : `about ${pages} pages`}, ${doc.entries} ${doc.entries === 1 ? 'note' : 'notes'}, ${printedRange(doc).split(' · ')[0]}`}
            accessibilityHint="Opens the summary at a size you can read"
            style={({ pressed }) => [{
              flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, minHeight: 72,
              borderRadius: radii.input, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface,
              opacity: pressed ? 0.85 : 1,
            }, shadows.hero]}
          >
            <View aria-hidden style={{ width: 44, height: 56, borderRadius: 6, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="file-text" size={22} color={colors.plum} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="headline">See the full page</Txt>
              <Txt variant="secondary">{`${pages === 1 ? 'One page' : `About ${pages} pages`} · ${doc.entries} ${doc.entries === 1 ? 'note' : 'notes'} · ${printedRange(doc).split(' · ')[0].replace(/ /g, "\u00A0")}`}</Txt>
            </View>
            <View aria-hidden><Icon name="chevron-right" size={20} color={colors.ink3} /></View>
          </Pressable>}
        </View>
      )}
      {words ? (
        <View style={{ marginTop: space.md, gap: space.xxs }}>
          <Txt variant="caption">{`In your words · ${words.dateLabel}`}</Txt>
          <Quote numberOfLines={3}>{words.text}</Quote>
        </View>
      ) : null}
      {tall ? <Button label="See the full page" variant="secondary" onPress={() => setOpen(true)} style={{ marginTop: space.xs }} accessibilityHint="Opens the summary at a size you can read" /> : null}
      {Platform.OS === 'web' ? (
        <Txt variant="caption" style={{ marginTop: space.xs, textAlign: 'center' }}>Save PDF opens your browser’s print window. Choose “Save as PDF” there.</Txt>
      ) : null}
      {doc.sections.length ? (
        <View style={{ marginTop: space.md, gap: space.xs }}>
          <Txt variant="groupLabel">In this summary</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.md, rowGap: space.xs }}>
            {doc.sections.map((sec) => (
              <View key={sec.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.xs, flexBasis: '100%' }}>
                <View aria-hidden style={{ marginTop: 2 }}><Icon name="check" size={16} color={colors.ink3} /></View>
                <Txt variant="secondary" style={{ flex: 1 }}>{sec.title}</Txt>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <ReaderSheet doc={doc} open={open} onClose={() => setOpen(false)} />
    </View>
  );
}
