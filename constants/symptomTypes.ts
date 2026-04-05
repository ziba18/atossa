export type SymptomType =
  | 'cramps'
  | 'bloating'
  | 'headache'
  | 'mood_swings'
  | 'acne'
  | 'fatigue'
  | 'breast_tenderness'
  | 'back_pain'
  | 'nausea'
  | 'dizziness'
  | 'spotting'
  | 'discharge'
  | 'hot_flashes'
  | 'insomnia'
  | 'anxiety'
  | 'depression'
  | 'hair_loss'
  | 'excessive_hair_growth'
  | 'custom';

export const SYMPTOM_META: Record<SymptomType, { label: string; emoji: string; category: string }> = {
  cramps:               { label: 'Cramps',              emoji: '😣', category: 'physical' },
  bloating:             { label: 'Bloating',             emoji: '🫧', category: 'physical' },
  headache:             { label: 'Headache',             emoji: '🤕', category: 'physical' },
  mood_swings:          { label: 'Mood Swings',          emoji: '🎭', category: 'emotional' },
  acne:                 { label: 'Acne',                 emoji: '😖', category: 'skin' },
  fatigue:              { label: 'Fatigue',              emoji: '😴', category: 'physical' },
  breast_tenderness:    { label: 'Breast Tenderness',    emoji: '🌸', category: 'physical' },
  back_pain:            { label: 'Back Pain',            emoji: '🔙', category: 'physical' },
  nausea:               { label: 'Nausea',               emoji: '🤢', category: 'physical' },
  dizziness:            { label: 'Dizziness',            emoji: '💫', category: 'physical' },
  spotting:             { label: 'Spotting',             emoji: '🩸', category: 'cycle' },
  discharge:            { label: 'Discharge',            emoji: '💧', category: 'cycle' },
  hot_flashes:          { label: 'Hot Flashes',          emoji: '🔥', category: 'physical' },
  insomnia:             { label: 'Insomnia',             emoji: '🌙', category: 'sleep' },
  anxiety:              { label: 'Anxiety',              emoji: '😰', category: 'emotional' },
  depression:           { label: 'Depression',           emoji: '😔', category: 'emotional' },
  hair_loss:            { label: 'Hair Loss',            emoji: '💇', category: 'skin' },
  excessive_hair_growth:{ label: 'Excess Hair Growth',   emoji: '🌿', category: 'skin' },
  custom:               { label: 'Custom',               emoji: '✏️', category: 'other' },
};

// Symptoms that may indicate PCOS when frequent
export const PCOS_INDICATOR_SYMPTOMS: SymptomType[] = [
  'acne',
  'hair_loss',
  'excessive_hair_growth',
  'mood_swings',
];
