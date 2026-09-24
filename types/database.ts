export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy';
export type CycleRegularity = 'regular' | 'irregular' | 'unknown';

export interface Profile {
  id: string;
  display_name: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  average_cycle_length: number;
  average_period_length: number;
  cycle_regularity: CycleRegularity;
  onboarding_complete: boolean;
  timezone: string;
  dark_mode: boolean;
  notifications_enabled: boolean;
  daily_log_reminder_enabled: boolean;
  daily_log_reminder_time: string;
  created_at: string;
  updated_at: string;
}

export interface CycleLog {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string | null;
  cycle_length: number | null;
  period_length: number | null;
  flow_intensity: FlowIntensity | null;
  is_confirmed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
