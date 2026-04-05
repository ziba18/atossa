export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy';
export type CycleRegularity = 'regular' | 'irregular' | 'unknown';
export type SubscriptionTier = 'free' | 'premium';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'very_high';
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type ContentType = 'article' | 'video' | 'infographic';
export type ContentCategory =
  | 'cycle_basics' | 'pcos' | 'hormones' | 'fertility' | 'nutrition'
  | 'mental_health' | 'emergency_care' | 'teen_health' | 'menopause';

export interface Profile {
  id: string;
  display_name: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  average_cycle_length: number;
  average_period_length: number;
  cycle_regularity: CycleRegularity;
  subscription_tier: SubscriptionTier;
  revenuecat_customer_id: string | null;
  onboarding_complete: boolean;
  timezone: string;
  dark_mode: boolean;
  notifications_enabled: boolean;
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

export interface SymptomLog {
  id: string;
  user_id: string;
  logged_date: string;
  logged_time: string;
  symptom_type: string;
  severity: number | null;
  custom_label: string | null;
  notes: string | null;
  created_at: string;
}

export interface HealthMetric {
  id: string;
  user_id: string;
  recorded_at: string;
  metric_type: string;
  value: number;
  unit: string;
  source: 'manual' | 'apple_health' | 'google_fit';
  notes: string | null;
  created_at: string;
}

export interface ConnectedAccount {
  id: string;
  owner_user_id: string;
  viewer_user_id: string | null;
  invite_email: string | null;
  relationship: 'partner' | 'parent' | 'guardian' | 'friend' | 'doctor';
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  can_view_cycle: boolean;
  can_view_symptoms: boolean;
  can_view_metrics: boolean;
  can_receive_alerts: boolean;
  invite_token: string;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  relationship: string | null;
  notify_on_heavy_bleeding: boolean;
  notify_on_fainting: boolean;
  notify_on_missed_period: boolean;
  call_911_after_no_response: boolean;
  is_primary: boolean;
  created_at: string;
}

export interface AlertLog {
  id: string;
  user_id: string;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  body: string | null;
  metadata: Json;
  is_read: boolean;
  sent_to_contacts: boolean;
  created_at: string;
}

export interface PCOSAssessment {
  id: string;
  user_id: string;
  assessed_at: string;
  risk_score: number;
  risk_level: RiskLevel;
  flag_irregular_cycles: boolean;
  flag_hyperandrogenism: boolean;
  flag_elevated_lh_fsh_ratio: boolean;
  flag_insulin_resistance: boolean;
  flag_weight_gain: boolean;
  contributing_factors: string[];
  recommendation: string | null;
  is_dismissed: boolean;
  created_at: string;
}

export interface EducationContent {
  id: string;
  title: string;
  slug: string;
  content_type: ContentType;
  category: ContentCategory;
  body_markdown: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  reading_time_minutes: number | null;
  is_premium: boolean;
  is_published: boolean;
  tags: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: 'free' | 'premium_monthly' | 'premium_annual';
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  started_at: string;
  expires_at: string | null;
  revenuecat_product_id: string | null;
  revenuecat_transaction_id: string | null;
  store: 'app_store' | 'play_store' | 'web' | 'promotional' | null;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  donor_user_id: string | null;
  amount_cents: number;
  currency: string;
  stripe_payment_intent_id: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  campaign: string;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
}

export interface CyclePrediction {
  id: string;
  user_id: string;
  computed_at: string;
  next_period_start: string | null;
  next_period_end: string | null;
  next_ovulation: string | null;
  fertile_window_start: string | null;
  fertile_window_end: string | null;
  predicted_cycle_length: number | null;
  confidence_score: number | null;
  method_used: 'average' | 'moving_average_6' | 'kalman' | 'naive' | null;
}
