// Page 1 of the summary as native cards for a phone: the thumbnail is too small to read, so the
// first sections are repeated here at body size. Same numbers as the document (read from the same
// DoctorDoc); descriptive only. "See the full page" opens the reflowed document.
import React from 'react';
import { View } from 'react-native';
import { colors, radii, space } from '../../../constants/atossaUI';
import { curly, type DoctorDoc } from '../../../lib/records/summary';
import { Card, Txt } from '../kit';

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

/** Three counts from the frequency section, at the top of page 1: what she recorded, in numbers. Same figures as the card below. */
function ProofStrip({ all, top, worst }: { all: { days: number; total: number }; top?: { label: string; days: number }; worst?: string }) {
  const tiles = [
    { big: String(all.days), small: `of ${plural(all.total, 'day')} with a note` },
    ...(top ? [{ big: String(top.days), small: `days · ${top.label.toLowerCase()}` }] : []),
    ...(worst ? [{ big: `${worst}/10`, small: 'worst, out of 10' }] : []),
  ];
  return (
    <View style={{ flexDirection: 'row', gap: space.xs }} accessible accessibilityLabel={tiles.map((t) => `${t.big} ${t.small}`).join('. ')}>
      {tiles.map((t) => (
        <View key={t.big + t.small} aria-hidden style={{ flex: 1, minWidth: 0, backgroundColor: colors.ink, borderRadius: radii.input, padding: space.sm }}>
          <Txt variant="numeral" numberOfLines={1} style={{ fontSize: 24, lineHeight: 30, color: colors.white }}>{t.big}</Txt>
          <Txt variant="caption" style={{ color: colors.white, marginTop: space.xxs }}>{t.small}</Txt>
        </View>
      ))}
    </View>
  );
}

/** `showAgenda` is false when the editable agenda field already sits above the cards. */
export function PageOneCards({ doc, showAgenda = true }: { doc: DoctorDoc; showAgenda?: boolean }) {
  const freq = doc.sections.find((s) => s.id === 'frequency');
  const periods = doc.sections.find((s) => s.id === 'periods');
  const impacts = doc.sections.find((s) => s.id === 'impacts');
  const cards: React.ReactNode[] = [];
  const agenda = doc.agendaBlock;

  if (showAgenda && agenda && (agenda.priority || agenda.questions.length)) {
    cards.push(
      <Card key="agenda">
        <Txt variant="groupLabel">{agenda.priority ? 'Main priority' : agenda.title}</Txt>
        <View style={{ gap: space.sm, marginTop: space.sm }}>
          {agenda.priority ? <Txt variant="quote">{`“${curly(agenda.priority)}”`}</Txt> : null}
          {agenda.questions.map((q) => <Txt key={q} variant="body">{`“${curly(q)}”`}</Txt>)}
        </View>
      </Card>,
    );
  }

  if (freq && freq.id === 'frequency') {
    const [first, ...rest] = freq.bars;
    if (first && first.days > 0) {
      // Same three area rows as the card below, so the strip never shows a number the card does not.
      const worstNums = rest.slice(0, 3).map((b) => Number(/worst (\d+)\/10/.exec(b.strength ?? '')?.[1])).filter((n) => !Number.isNaN(n));
      cards.push(
        <ProofStrip
          key="proof"
          all={first}
          top={rest[0]}
          worst={worstNums.length ? String(Math.max(...worstNums)) : undefined}
        />,
      );
    }
    // The first bar is "Days with a note": it becomes the card subtitle; the rest are area rows with
    // the count on the left and one right-aligned "Worst" column (no "worst 9/10" repeated in text).
    const [all, ...areas] = freq.bars;
    const worstOf = (t: string) => /worst (\d+)\/10/.exec(t)?.[1];
    const usual = (t: string) => t.replace(/,?\s*worst \d+\/10/, '').replace(/^,\s*/, '');
    cards.push(
      <Card key="freq">
        <Txt variant="groupLabel">{freq.title}</Txt>
        {all ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, marginTop: space.xxs }}>
            {/* Her count as the card's one display figure. */}
            <View
              style={{ flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: space.xs }}
            >
              <Txt variant="numeral" style={{ fontSize: 32, lineHeight: 36 }}>{String(all.days)}</Txt>
              <Txt variant="secondary" style={{ flexShrink: 1 }}>{`of ${plural(all.total, 'day')} with a note`}</Txt>
            </View>
            {/* The column header: said once here, so the rows below carry only the number. */}
            {areas.some((b) => worstOf(b.strength ?? '')) ? <Txt variant="secondary" aria-hidden>Worst</Txt> : null}
          </View>
        ) : null}
        <View style={{ gap: space.sm, marginTop: space.sm }}>
          {areas.slice(0, 3).map((b) => {
            const w = worstOf(b.strength ?? '');
            const u = usual(b.strength ?? '');
            return (
              <View key={b.label} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.sm }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt variant="body">{b.label}</Txt>
                  <Txt variant="secondary">{`${b.days} of ${plural(b.total, 'day')}${u ? ` · ${u}` : ''}`}</Txt>
                  {/* Length = days with a note out of the range; the words above carry the number. */}
                  <View aria-hidden style={{ height: 4, borderRadius: radii.pill, backgroundColor: colors.hairline, marginTop: space.xs, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.max(2, Math.min(100, (b.days / Math.max(1, b.total)) * 100))}%`, height: 4, borderRadius: radii.pill, backgroundColor: colors.ink2 }} />
                  </View>
                </View>
                {w ? (
                  <View style={{ alignItems: 'flex-end' }} accessible accessibilityLabel={`Worst ${w} out of 10`}>
                    <Txt variant="body" style={{ fontVariant: ['tabular-nums'] }}>{`${w}/10`}</Txt>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </Card>,
    );
  }
  if (periods && periods.id === 'periods' && periods.runs.length) {
    cards.push(
      <Card key="periods">
        <Txt variant="groupLabel">{periods.title}</Txt>
        <View style={{ gap: space.sm, marginTop: space.sm }}>
          {periods.runs.slice(0, 3).map((r) => (
            <View key={r.range}>
              <Txt variant="body">{r.range} · {plural(r.days, 'day')}</Txt>
              {r.flows ? <Txt variant="secondary">{r.flows}</Txt> : null}
            </View>
          ))}
        </View>
      </Card>,
    );
  }
  if (impacts && impacts.id === 'impacts' && impacts.items.length) {
    cards.push(
      <Card key="impacts">
        <Txt variant="groupLabel">{impacts.title}</Txt>
        <View style={{ gap: space.xxs, marginTop: space.sm }}>
          {impacts.items.slice(0, 4).map((i) => (
            <Txt key={i.label} variant="body">{i.label} · {plural(i.days, 'day')}</Txt>
          ))}
        </View>
      </Card>,
    );
  }
  if (!cards.length) return null;
  return <View style={{ gap: space.sm, marginTop: space.md }}>{cards}</View>;
}
