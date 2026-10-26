// A real thumbnail: a fixed-height crop of the top of page 1 (A4 proportions, capped at 420),
// with a white fade at the foot — no inner scroll, nothing inside it is touchable. Tapping the
// card opens the document reflowed at readable size (body 15) in a full sheet, so Sam can read
// every word on a phone; pinch-zoom on iOS for a closer look. The whole page is still laid out
// (clipped) so the caption can say how many A4 pages the PDF will be.
import React, { useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, layout, radii, shadows, space } from '../../../constants/atossaUI';
import type { DoctorDoc } from '../../../lib/records/summary';
import { Icon } from '../../ui/Icon';
import { Sheet, Txt } from '../kit';
import { A4, DocumentView } from './DocumentView';

// Printable height per A4 page: 842 pt minus the PDF's 40/34 pt margins and the repeated footer.
const PRINT_PAGE_BODY = 842 - 40 - 34 - 28;
const PAGE_CHROME = A4.pad * 2 + 28; // the on-screen page's padding + its single footer
const THUMB_MAX_H = 420;
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

export function DocumentPreview({ doc, tall }: { doc: DoctorDoc; tall?: boolean }) {
  const [width, setWidth] = useState(0);
  const [docHeight, setDocHeight] = useState<number>(A4.height);
  const [open, setOpen] = useState(false);
  const { width: screenW } = useWindowDimensions();
  // 0.15 page of slack: a document that is within a few lines of a page boundary measured 2 pages in the real PDF but 3 here.
  const pages = Math.max(1, Math.ceil((docHeight - PAGE_CHROME) / PRINT_PAGE_BODY - 0.15));
  const inner = Math.max(0, width - 2); // inside the 1 px border
  const thumbH = Math.min(Math.round(inner * (A4.height / A4.width)), tall ? THUMB_MAX_H * 2 : THUMB_MAX_H);
  const readerWidth = Math.min(screenW, layout.maxContentWidth) - layout.gutter * 2; // the Sheet's content gutter

  return (
    <View>
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
      <Txt variant="caption" style={{ marginTop: space.xs, textAlign: 'center' }}>
        {pages === 1 ? 'One page · tap to read it' : `About ${pages} pages · tap to read it`}
      </Txt>
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

      <Sheet visible={open} onClose={() => setOpen(false)} title="Your summary" full scroll={false} closeLabel="Close summary">
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
    </View>
  );
}
