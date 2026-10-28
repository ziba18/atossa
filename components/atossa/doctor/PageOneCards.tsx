// Page 1 of the summary as native cards for a phone: the thumbnail is too small to read, so the
// first sections are repeated here at body size. Same numbers as the document (read from the same
// DoctorDoc); descriptive only. "See the full page" opens the reflowed document.
import React from 'react';
import { View } from 'react-native';
import { colors, radii, space } from '../../../constants/atossaUI';
import { addDays } from '../../../lib/records/dates';
import { curly, type DoctorDoc } from '../../../lib/records/summary';
import { Card, Txt } from '../kit';

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

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
  if (freq && freq.id === 'frequency' && freq.strip.days.length >= 15) {
    // Strongest number in each 7-day block of the same window as the card above (same days, same numbers).
    const days = freq.strip.days;
    const start = days[0].date;
    const blocks: { from: string; peak: number | null }[] = [];
    for (let i = 0; i * 7 < days.length; i++) {
      const from = addDays(start, i * 7);
      const to = addDays(from, 6);
      const peak = days.reduce<number | null>((hi, d) => (d.date >= from && d.date <= to && d.value != null && (hi == null || d.value > hi) ? d.value : hi), null);
      blocks.push({ from, peak });
    }
    if (blocks.some((w) => w.peak != null) && blocks.length <= 16) {
      const hi = Math.max(...blocks.map((w) => w.peak ?? 0));
      cards.push(
        <Card key="weekly">
          <Txt variant="groupLabel">Strongest note each week, out of 10</Txt>
          <View role="img" accessibilityLabel={`Strongest number in each week, out of 10. ${blocks.map((w, i) => `Week ${i + 1}, ${w.peak ?? 'no number'}`).join('; ')}.`} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 72, marginTop: space.sm }}>
            {blocks.map((w) => (
              <View key={w.from} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                {w.peak != null && blocks.length <= 12 ? <Txt variant="caption" style={{ fontSize: 11 }}>{w.peak}</Txt> : null}
                <View style={{ width: '100%', maxWidth: 28, height: w.peak == null ? 3 : Math.max(3, (w.peak / 10) * 54), borderRadius: 4, backgroundColor: w.peak == null ? colors.hairline : colors.plum }} />
              </View>
            ))}
          </View>
          <Txt variant="caption" style={{ marginTop: space.xs }}>Highest in one week: {hi} out of 10.</Txt>
        </Card>,
      );
    }
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
