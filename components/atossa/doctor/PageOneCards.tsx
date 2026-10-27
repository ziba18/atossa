// Page 1 of the summary as native cards for a phone: the thumbnail is too small to read, so the
// first sections are repeated here at body size. Same numbers as the document (read from the same
// DoctorDoc); descriptive only. "See the full page" opens the reflowed document.
import React from 'react';
import { View } from 'react-native';
import { space } from '../../../constants/atossaUI';
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
            <Txt variant="secondary" style={{ flex: 1, minWidth: 0 }}>{`${all.days} of ${plural(all.total, 'day')} with a note`}</Txt>
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
