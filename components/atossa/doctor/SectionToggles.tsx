// "Sections" list under the preview: one switch per section that has data. Sensitive sections
// carry a lock glyph and are off unless Sam switches them on for this summary.
import React from 'react';
import { View } from 'react-native';
import { colors, heights, space } from '../../../constants/atossaUI';
import { sectionIncluded, type SectionId } from '../../../lib/records/summary';
import { Icon } from '../../ui/Icon';
import { Card, Toggle, Txt } from '../kit';

export function SectionToggles({
  sections, include, onChange,
}: {
  sections: { id: SectionId; title: string; sensitive: boolean }[];
  include: Partial<Record<SectionId, boolean>>;
  onChange: (id: SectionId, on: boolean) => void;
}) {
  if (!sections.length) return null;
  return (
    <Card style={{ paddingVertical: space.xxs }}>
      {sections.map((s, i) => {
        const on = sectionIncluded(s.id, include);
        return (
          <View
            key={s.id}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: heights.minHit + 8,
              paddingVertical: space.sm, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.hairline,
            }}
          >
            <View style={{ flex: 1, gap: space.xxs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                {s.sensitive ? <Icon name="lock" size={20} color={colors.ink2} /> : null}
                <Txt variant="body" style={{ flexShrink: 1 }}>{s.title}</Txt>
              </View>
              {s.sensitive ? <Txt variant="caption">Off unless you turn it on for this summary</Txt> : null}
              {s.id === 'history' ? <Txt variant="caption">Includes your allergies and family history</Txt> : null}
            </View>
            <Toggle value={on} onChange={(v) => onChange(s.id, v)} label={`Include ${s.title}`} />
          </View>
        );
      })}
    </Card>
  );
}
