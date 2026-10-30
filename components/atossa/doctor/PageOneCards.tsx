// Page 1 of the summary as native cards for a phone: the thumbnail is too small to read, so the
// first sections are repeated here at body size. Same numbers as the document (read from the same
// DoctorDoc); descriptive only. "See the full page" opens the reflowed document.
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { colors, fonts, space } from '../../../constants/atossaUI';
import { curly, type DoctorDoc } from '../../../lib/records/summary';
import { thinView } from '../../../lib/records/thinCounts';
import { Card, Txt } from '../kit';

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

/** `showAgenda` is false when the editable agenda field already sits above the cards. */
export function PageOneCards({ doc, showAgenda = true }: { doc: DoctorDoc; showAgenda?: boolean }) {
  const narrow = useWindowDimensions().width < 360;
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
    const [all, ...allAreas] = freq.bars;
    // Under 7 written days: 'N days written so far' and no zero rows (first-week rules 7-8).
    const thin = thinView(all?.days ?? 0, allAreas.map((b) => ({ label: b.label, days: b.days })));
    const areas = thin.thin ? allAreas.filter((b) => thin.rows.some((r) => r.label === b.label)) : allAreas;
    const worstOf = (t: string) => /worst (\d+)\/10/.exec(t)?.[1];
    const usual = (t: string) => t.replace(/,?\s*worst \d+\/10/, '').replace(/^,\s*/, '');
    const worstAll = areas.reduce((m, b) => Math.max(m, Number(worstOf(b.strength ?? '') ?? 0)), 0);
    const num = { fontVariant: ['tabular-nums', 'lining-nums'] as ('tabular-nums' | 'lining-nums')[] };
    const big = narrow ? { ...num, fontSize: 34, lineHeight: 38 } : num;
    cards.push(
      <Card key="freq">
        <Txt variant="groupLabel">{freq.title}</Txt>
        <Txt variant="secondary" style={{ marginTop: space.xxs }}>{thin.thin && thin.line ? thin.line : freq.windowLabel}</Txt>
        {all ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.lg, rowGap: space.sm, marginTop: space.sm, alignItems: 'flex-end' }}>
            <View style={{ maxWidth: '100%' }} accessible accessibilityLabel={thin.thin ? `${all.days} with a note, ${thin.line}` : `${all.days} of ${plural(all.total, 'day')} with a note`}>
              <Txt variant="numeral" style={big}>{all.days}</Txt>
              <Txt variant="secondary">{thin.thin ? 'with a note' : `of ${plural(all.total, 'day')} with a note`}</Txt>
            </View>
            {worstAll ? (
              <View style={{ maxWidth: '100%' }} accessible accessibilityLabel={`Worst rating ${worstAll} out of 10`}>
                <Txt variant="numeral" style={big}>{`${worstAll}/10`}</Txt>
                <Txt variant="secondary">worst rating</Txt>
              </View>
            ) : null}
          </View>
        ) : null}
        {all?.worstOn ? <Txt variant="secondary" style={{ marginTop: space.sm }}>{`Worst: ${all.worstOn}`}</Txt> : null}
        <View style={{ gap: space.sm, marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderTopColor: colors.hairline }}>
          {areas.slice(0, 3).map((b) => {
            const w = worstOf(b.strength ?? '');
            const u = usual(b.strength ?? '');
            return (
              <View key={b.label} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: space.sm }}>
                {/* Basis 130: on very narrow screens the Worst column wraps under the name instead of squeezing it mid-word. */}
                <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 130, minWidth: 0 }}>
                  <Txt variant="body">{b.label}</Txt>
                  <Txt variant="body" style={[{ fontFamily: fonts.semibold }, num]}>{thin.thin ? plural(b.days, 'day') : `${b.days} of ${plural(b.total, 'day')}`}{u ? <Txt variant="secondary">{` · ${u}`}</Txt> : null}</Txt>
                </View>
                {w ? (
                  <View style={{ alignItems: 'flex-end' }} accessible accessibilityLabel={`Worst ${w} out of 10`}>
                    <Txt variant="secondary">Worst</Txt>
                    <Txt variant="body" style={[{ fontFamily: fonts.semibold }, num]}>{`${w}/10`}</Txt>
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
        {periods.windowCount ? <Txt variant="secondary" style={{ marginTop: space.xs }}>{periods.windowCount}</Txt> : null}
        <View style={{ gap: space.sm, marginTop: space.sm }}>
          {periods.runs.slice(0, 3).map((r) => (
            <View key={r.range}>
              <Txt variant="body">{r.range} · {plural(r.days, 'day')}</Txt>
              {r.flows ? <Txt variant="secondary">{r.flows.replace("Flow (chosen by the patient)", "Flow")}</Txt> : null}
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
