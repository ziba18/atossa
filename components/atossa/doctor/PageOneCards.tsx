// Page 1 of the summary as native cards for a phone: the thumbnail is too small to read, so the
// first sections are repeated here at body size. Same numbers as the document (read from the same
// DoctorDoc); descriptive only. "See the full page" opens the reflowed document.
import React from 'react';
import { View } from 'react-native';
import { space } from '../../../constants/atossaUI';
import { barText, curly, type DoctorDoc } from '../../../lib/records/summary';
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
    cards.push(
      <Card key="freq">
        <Txt variant="groupLabel">{freq.title}</Txt>
        <View style={{ gap: space.sm, marginTop: space.sm }}>
          {freq.bars.slice(0, 4).map((b) => (
            <View key={b.label}>
              <Txt variant="body">{barText(b)}</Txt>
              {b.strength ? <Txt variant="secondary">{b.strength}</Txt> : null}
            </View>
          ))}
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
