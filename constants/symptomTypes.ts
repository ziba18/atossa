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

import type { IconName } from '../components/ui/Icon';

export const SYMPTOM_META: Record<SymptomType, { label: string; icon: IconName; category: string }> = {
  cramps:               { label: 'Cramps',              icon: 'activity',    category: 'physical' },
  bloating:             { label: 'Bloating',             icon: 'activity',    category: 'physical' },
  headache:             { label: 'Headache',             icon: 'brain',       category: 'physical' },
  mood_swings:          { label: 'Mood Swings',          icon: 'sparkles',    category: 'emotional' },
  acne:                 { label: 'Acne',                 icon: 'eye',         category: 'skin' },
  fatigue:              { label: 'Fatigue',              icon: 'zap',         category: 'physical' },
  breast_tenderness:    { label: 'Breast Tenderness',    icon: 'heart',       category: 'physical' },
  back_pain:            { label: 'Back Pain',            icon: 'activity',    category: 'physical' },
  nausea:               { label: 'Nausea',               icon: 'alert-circle',category: 'physical' },
  dizziness:            { label: 'Dizziness',            icon: 'refresh',     category: 'physical' },
  spotting:             { label: 'Spotting',             icon: 'droplets',    category: 'cycle' },
  discharge:            { label: 'Discharge',            icon: 'droplet',     category: 'cycle' },
  hot_flashes:          { label: 'Hot Flashes',          icon: 'thermometer', category: 'physical' },
  insomnia:             { label: 'Insomnia',             icon: 'clock',       category: 'sleep' },
  anxiety:              { label: 'Anxiety',              icon: 'brain',       category: 'emotional' },
  depression:           { label: 'Depression',           icon: 'heart',       category: 'emotional' },
  hair_loss:            { label: 'Hair Loss',            icon: 'user',        category: 'skin' },
  excessive_hair_growth:{ label: 'Excess Hair Growth',   icon: 'leaf',        category: 'skin' },
  custom:               { label: 'Custom',               icon: 'pencil',      category: 'other' },
};

// Symptoms that may indicate PCOS when frequent
export const PCOS_INDICATOR_SYMPTOMS: SymptomType[] = [
  'acne',
  'hair_loss',
  'excessive_hair_growth',
  'mood_swings',
];
