import type { CycleLog } from '../types/database';

// Only period_start/period_end/period_length ever feed the phase/prediction
// algorithms — kept as its own type (rather than requiring a full CycleLog)
// so callers sharing phase timing across accounts (e.g. friend cycle
// matching) never need to pass along flow_intensity, notes, or any other
// private field.
export type CyclePhaseLog = Pick<CycleLog, 'period_start' | 'period_end' | 'period_length'>;
