// Shared answer lists for capture follow-ups, the noted card and entry-detail editors.
// Plain NHS-style labels. Escape answers are stored as values but never counted as impacts.

export const BODY_ZONES = [
  'Lower tummy left',
  'Lower tummy centre',
  'Lower tummy right',
  'Lower back',
  'Deep inside',
  'Legs',
  'Bottom',
] as const;

/** Display labels where the chip needs more words than the stored value (spec wording). */
export const BODY_ZONE_LABELS: Partial<Record<(typeof BODY_ZONES)[number], string>> = {
  Bottom: 'Bottom / when opening bowels',
};

export const WHEN_OPTIONS = ['Only around my period', 'At other times too', 'All the time'] as const;

export const IMPACT_OPTIONS = ['Work or study', 'Sleep', 'Exercise', 'Plans with people', 'Sex', 'Nothing today'] as const;

export const ESCAPE_ANSWERS = ['Not sure', 'It varies', 'Skip'] as const;

export const STARTER_CHIPS = ['Pain today', 'My period', 'Something new', 'Just a quick note'] as const;
