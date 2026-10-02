// Renders the DoctorDoc (lib/records/summary.ts) in React Native. Three sizes of the SAME model:
//   'page'   — the A4 page at 595 × ≥842 pt (scaled down in DocumentPreview's thumbnail). Same
//              type scale as the PDF (PAGE_TYPE: body 10.5, quotes 12, heads 12).
//   'reader' — the full-size preview: reflowed to the sheet width, body 15/21, so it can be read
//              on a phone without zooming.
//   'large'  — Show on screen: body 20/28, quotes 26/34, for handing the phone across the desk.
// Only Sam's own words use the serif. Plum appears only in the heat-strip ramp, clay only for bleeding.
import React from 'react';
import { View, type TextStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { fonts } from '../../../constants/atossaUI';
import { joinFacts } from '../../../lib/records/format';
import {
  APPT_AHEAD, APPT_PAST, DOC_COLORS, PAGE_TYPE, SPOT_DASH, SPOT_STROKE, STRIP_BLEED_KEY, STRIP_KEY, STRIP_SPOT_KEY,
  barText, countText, curly, daysText,
  type DatedItem, type DocQuote, type DocSection, type DoctorDoc, type FreqBar,
} from '../../../lib/records/summary';
import { Txt } from '../kit';
import { HeatStrip } from './HeatStrip';

export const A4 = { width: 595, height: 842, pad: 40 } as const;

export type DocVariant = 'page' | 'reader' | 'large';

type Pair = readonly [number, number];
interface Scale {
  pad: number; title: Pair; meta: Pair; head: Pair; body: Pair; quote: Pair; lead: Pair; label: Pair;
  /** Space above each section rule / between items. */
  section: number; item: number; gap: number; track: number; rule: number; labelW: number;
}

const SIZES: Record<DocVariant, Scale> = {
  page: {
    pad: A4.pad, title: PAGE_TYPE.title, meta: PAGE_TYPE.meta, head: PAGE_TYPE.head, body: PAGE_TYPE.body,
    quote: PAGE_TYPE.quote, lead: PAGE_TYPE.lead, label: PAGE_TYPE.label,
    section: PAGE_TYPE.section, item: PAGE_TYPE.item, gap: 2, track: 5, rule: 1, labelW: 112,
  },
  reader: {
    pad: 16, title: [26, 32], meta: [13, 18], head: [17, 22], body: [15, 21], quote: [17, 23], lead: [18, 24],
    label: [13, 21], section: 18, item: 10, gap: 3, track: 8, rule: 1, labelW: 0,
  },
  large: {
    pad: 20, title: [34, 41], meta: [17, 24], head: [20, 26], body: [20, 28], quote: [26, 34], lead: [26, 34],
    label: [17, 28], section: 28, item: 14, gap: 4, track: 12, rule: 1, labelW: 0,
  },
};

const C = DOC_COLORS;

function useStyles(v: DocVariant) {
  const s = SIZES[v];
  const t = (size: Pair, family: string, color: string = C.ink): TextStyle => ({
    fontFamily: family, fontSize: size[0], lineHeight: size[1], color, letterSpacing: 0,
  });
  return {
    s,
    title: t(s.title, fonts.serif),
    meta: t(s.meta, fonts.regular, C.ink2),
    head: t(s.head, fonts.semibold),
    body: t(s.body, fonts.regular),
    strong: t(s.body, fonts.semibold),
    muted: t(s.body, fonts.regular, C.ink2),
    label: t(s.label, fonts.regular, C.ink2),
    quote: t(s.quote, fonts.serif),
    lead: t(s.lead, fonts.serif),
  };
}

type St = ReturnType<typeof useStyles>;

/**
 * Phone sizes: keep a date's year on the same line as its month ("Wed 23 Sep 2026" never wraps
 * to an orphan "2026"). The A4 page keeps plain spaces, like the PDF.
 */
const keepYear = (t: string, st: St) => (st.s.labelW > 0 ? t : t.replace(/ (\d{4})\b/g, '\u00a0$1'));

function QuoteBlock({ q, st }: { q: DocQuote; st: St }) {
  // No facts → the date sits on the quote's line (as in the PDF); otherwise a meta line under it.
  if (!q.facts) {
    return (
      <Txt style={[st.quote, { marginBottom: st.s.item }]}>
        {`“${curly(q.text)}” `}<Txt style={st.meta}>{keepYear(q.dateLabel, st)}</Txt>
      </Txt>
    );
  }
  return (
    <View style={{ marginBottom: st.s.item }}>
      <Txt style={st.quote}>{`“${curly(q.text)}”`}</Txt>
      <Txt style={st.meta}>{joinFacts(keepYear(q.dateLabel, st), q.facts)}</Txt>
    </View>
  );
}

function Bars({ bars, st }: { bars: FreqBar[]; st: St }) {
  return (
    <View style={{ gap: st.s.gap * 3, marginTop: st.s.gap * 2 }}>
      {bars.map((b) => (
        <View key={b.label} accessible accessibilityLabel={joinFacts(barText(b), b.strength)}>
          <Txt style={st.body}>
            <Txt style={st.strong}>{barText(b)}</Txt>
            {b.strength ? <Txt style={st.muted}>{` · ${b.strength}`}</Txt> : null}
          </Txt>
          <View style={{ height: st.s.track, backgroundColor: C.track, borderWidth: 0.5, borderColor: C.borderStrong, marginTop: st.s.gap }}>
            <View style={{ height: '100%', width: `${Math.max(1.5, (b.days / Math.max(1, b.total)) * 100)}%`, backgroundColor: C.ink }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * One visit / history item: bold heading line, then one labelled fact per row. On the page the
 * labels are a 112 pt column (as in the PDF); on phone widths the label sits above its value.
 */
function DatedItemBlock({ item, st }: { item: DatedItem; st: St }) {
  const columns = st.s.labelW > 0;
  return (
    <View style={{ marginBottom: st.s.item }}>
      <Txt style={st.strong}>{joinFacts(keepYear(item.date, st), item.title)}</Txt>
      {item.lines.map((l) =>
        columns ? (
          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 1 }}>
            <Txt style={[st.label, { width: st.s.labelW, paddingRight: 8 }]}>{l.label}</Txt>
            <Txt style={[st.body, { flex: 1 }]}>{l.text}</Txt>
          </View>
        ) : (
          <View key={l.label} style={{ marginTop: st.s.gap * 2 }}>
            <Txt style={st.label}>{l.label}</Txt>
            <Txt style={st.body}>{l.text}</Txt>
          </View>
        ),
      )}
    </View>
  );
}

/** Key marks drawn like the strip: a solid clay bar (bleeding), a thin dashed clay line (spotting). */
function KeyMark({ kind, st }: { kind: 'bleeding' | 'spotting'; st: St }) {
  const w = st.s.meta[0] * 1.3;
  if (kind === 'bleeding') {
    return <View style={{ width: w, height: 3, backgroundColor: C.clay, marginBottom: st.s.meta[0] * 0.25 }} />;
  }
  const scale = st.s.labelW > 0 ? 1 : st.s.meta[0] / PAGE_TYPE.meta[0];
  return (
    <Svg width={w} height={4} style={{ marginBottom: st.s.meta[0] * 0.2 }}>
      <Line
        x1={0} y1={2} x2={w} y2={2} stroke={C.clay} strokeWidth={SPOT_STROKE * scale}
        strokeDasharray={SPOT_DASH.map((n) => n * scale)}
      />
    </Svg>
  );
}

function StripKey({ bleeding, spotting, st }: { bleeding: boolean; spotting: boolean; st: St }) {
  return (
    <Txt style={st.meta}>
      {STRIP_KEY}
      {bleeding ? <>{' '}<KeyMark kind="bleeding" st={st} />{` = ${STRIP_BLEED_KEY}.`}</> : null}
      {spotting ? <>{' '}<KeyMark kind="spotting" st={st} />{` = ${STRIP_SPOT_KEY}.`}</> : null}
    </Txt>
  );
}

function SectionBody({ section, st, contentWidth, variant }: { section: DocSection; st: St; contentWidth: number; variant: DocVariant }) {
  switch (section.id) {
    case 'words':
      return (
        <>
          {section.quotes.map((q) => <QuoteBlock key={q.date + q.text} q={q} st={st} />)}
          {section.more ? <Txt style={st.meta}>{section.more}</Txt> : null}
        </>
      );
    case 'frequency':
      return (
        <>
          <Txt style={st.meta}>{section.windowLabel}</Txt>
          <Bars bars={section.bars} st={st} />
          <View style={{ marginTop: st.s.gap * 5, marginBottom: st.s.gap * 3 }}>
            <HeatStrip
              strip={section.strip} width={contentWidth}
              mode={variant === 'page' ? 'page' : 'weeks'} textSize={st.s.meta[0]}
            />
          </View>
          <StripKey
            bleeding={section.strip.days.some((d) => d.bleeding)}
            spotting={section.strip.days.some((d) => d.spotting)}
            st={st}
          />
          <Txt style={st.meta}>{joinFacts(section.caption, section.strip.windowNote)}</Txt>
        </>
      );
    case 'periods':
      return (
        <>
          {section.runs.map((r) => (
            <View key={r.range} style={{ marginBottom: st.s.item }}>
              <Txt style={st.body}>
                <Txt style={st.strong}>{r.range}</Txt>{` · ${daysText(r.days)}${r.flows ? ` · ${r.flows}` : ''}`}
              </Txt>
              {r.notes.map((q) => <QuoteBlock key={q.date} q={q} st={st} />)}
            </View>
          ))}
          {section.spotting ? <Txt style={st.body}>{section.spotting}</Txt> : null}
        </>
      );
    case 'impacts': case 'sex': case 'mood': case 'eating':
      return (
        <>
          {section.items.length ? (
            <Txt style={[st.body, { marginBottom: st.s.item }]}>{section.items.map(countText).join('  ·  ')}</Txt>
          ) : null}
          {section.quotes.map((q) => <QuoteBlock key={q.date + q.text} q={q} st={st} />)}
        </>
      );
    case 'tried':
      return (
        <>
          {section.items.map((t) => (
            <View key={t.title + t.dates} style={{ marginBottom: st.s.item }}>
              <Txt style={st.body}>
                <Txt style={st.strong}>{t.title}</Txt>{t.dates ? ` · ${keepYear(t.dates, st)}` : ''}
              </Txt>
              {t.noticed ? (
                <Txt style={st.body}>
                  <Txt style={st.muted}>What I noticed: </Txt>
                  <Txt style={st.quote}>{`“${curly(t.noticed)}”`}</Txt>
                </Txt>
              ) : null}
            </View>
          ))}
          {section.quotes.map((q) => <QuoteBlock key={q.date + q.text} q={q} st={st} />)}
        </>
      );
    case 'appointments':
      return (
        <>
          {section.upcoming.length ? (
            <>
              <Txt style={[st.label, { fontFamily: fonts.semibold, marginBottom: st.s.gap }]}>{APPT_AHEAD}</Txt>
              {section.upcoming.map((a, i) => <DatedItemBlock key={`up-${a.date}-${i}`} item={a} st={st} />)}
              {section.items.length ? (
                <Txt style={[st.label, { fontFamily: fonts.semibold, marginBottom: st.s.gap }]}>{APPT_PAST}</Txt>
              ) : null}
            </>
          ) : null}
          {section.items.map((a, i) => <DatedItemBlock key={`${a.date}-${i}`} item={a} st={st} />)}
          {section.more ? <Txt style={st.meta}>{section.more}</Txt> : null}
        </>
      );
    case 'history':
      return (
        <>
          {section.items.map((a, i) => <DatedItemBlock key={`${a.date}-${i}`} item={a} st={st} />)}
          {section.more ? <Txt style={st.meta}>{section.more}</Txt> : null}
        </>
      );
  }
}

/** The document itself. `width` is the page width for 'reader' / 'large'; 'page' is always 595. */
export function DocumentView({ doc, variant = 'page', width }: { doc: DoctorDoc; variant?: DocVariant; width?: number }) {
  const st = useStyles(variant);
  const isPage = variant === 'page';
  const pageWidth = isPage ? A4.width : width ?? 390;
  const contentWidth = pageWidth - st.s.pad * 2;

  const block = (key: string, title: string, children: React.ReactNode, first: boolean) => (
    <View
      key={key}
      style={{
        paddingTop: st.s.section, paddingBottom: st.s.section - 4,
        borderTopWidth: first ? 0 : 0.75, borderTopColor: C.borderStrong,
      }}
    >
      <Txt style={[st.head, { marginBottom: st.s.gap * 2 }]} accessibilityRole="header">{title}</Txt>
      {children}
    </View>
  );

  const blocks = [
    ...(doc.agenda ? [{ key: 'agenda', title: doc.agendaTitle, body: <Txt style={st.lead}>{`“${curly(doc.agenda)}”`}</Txt> }] : []),
    ...doc.sections.map((s) => ({
      key: s.id, title: s.title, body: <SectionBody section={s} st={st} contentWidth={contentWidth} variant={variant} />,
    })),
  ];

  return (
    <View
      style={{
        width: pageWidth, minHeight: isPage ? A4.height : undefined, padding: st.s.pad,
        backgroundColor: C.white,
      }}
    >
      <Txt style={st.title} accessibilityRole="header">{doc.title}</Txt>
      <Txt style={[st.meta, { marginTop: st.s.gap, paddingBottom: st.s.gap * 4, borderBottomWidth: st.s.rule, borderBottomColor: C.ink }]}>
        {keepYear(doc.meta, st)}
      </Txt>
      {blocks.map((b, i) => block(b.key, b.title, b.body, i === 0))}
      <View style={{ flexGrow: 1 }} />
      <View style={{ marginTop: st.s.section, paddingTop: st.s.gap * 2, borderTopWidth: 0.5, borderTopColor: C.borderStrong }}>
        <Txt style={isPage ? { ...st.meta, fontSize: PAGE_TYPE.footer[0], lineHeight: PAGE_TYPE.footer[1] } : st.meta}>{doc.footer}</Txt>
      </View>
    </View>
  );
}
