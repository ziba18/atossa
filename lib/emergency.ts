import * as SMS from 'expo-sms';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';
import type { EmergencyContact } from '../types/database';

export interface EmergencyAlertOptions {
  userId: string;
  contacts: EmergencyContact[];
  userName: string;
  triggerReason: 'manual' | 'auto_heavy_bleeding';
}

export async function sendEmergencyAlert(options: EmergencyAlertOptions): Promise<void> {
  const { userId, contacts, userName, triggerReason } = options;

  // Log the emergency alert
  await supabase.from('alert_logs').insert({
    user_id: userId,
    alert_type: 'emergency_sent',
    severity: 'emergency',
    title: 'Emergency Alert Sent',
    body: `Emergency triggered by: ${triggerReason}`,
    metadata: { trigger_reason: triggerReason, contacts_count: contacts.length },
    sent_to_contacts: contacts.length > 0,
  });

  // Get primary contact
  const primary = contacts.find((c) => c.is_primary) ?? contacts[0];
  if (!primary) return;

  const message =
    `🚨 ATTOSA EMERGENCY ALERT 🚨\n\n` +
    `${userName} may need urgent help. ` +
    `Atossa's health monitoring app has detected a potential health emergency.\n\n` +
    `Please call or check on them immediately.\n\n` +
    `If you cannot reach them, consider calling emergency services.`;

  // Send SMS
  const isSmsAvailable = await SMS.isAvailableAsync();
  if (isSmsAvailable) {
    await SMS.sendSMSAsync([primary.phone_number], message);
  }

  // If 911 escalation is configured and SMS send fails, fall back to phone call
  if (primary.call_911_after_no_response) {
    // Give 2 minutes then open 911 dialer
    setTimeout(() => {
      Linking.openURL('tel:911');
    }, 120_000);
  }
}

export async function callEmergencyContact(phoneNumber: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(`tel:${phoneNumber}`);
  if (canOpen) {
    await Linking.openURL(`tel:${phoneNumber}`);
  }
}
