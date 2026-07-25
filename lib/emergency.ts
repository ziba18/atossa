import * as SMS from 'expo-sms';
import * as Linking from 'expo-linking';
import type { EmergencyContact } from '../types/database';

export interface EmergencyAlertOptions {
  userId: string;
  contacts: EmergencyContact[];
  userName: string;
  triggerReason: 'manual' | 'auto_heavy_bleeding';
}

export async function sendEmergencyAlert(options: EmergencyAlertOptions): Promise<void> {
  const { contacts, userName } = options;

  const primary = contacts.find((c) => c.is_primary) ?? contacts[0];
  if (!primary) return;

  const message =
    `🚨 ATOSSA EMERGENCY ALERT 🚨\n\n` +
    `${userName} may need urgent help. ` +
    `Atossa's health monitoring app has detected a potential health emergency.\n\n` +
    `Please call or check on them immediately.\n\n` +
    `If you cannot reach them, consider calling emergency services.`;

  const isSmsAvailable = await SMS.isAvailableAsync();
  if (isSmsAvailable) {
    await SMS.sendSMSAsync([primary.phone_number], message);
  }

  if (primary.call_911_after_no_response) {
    setTimeout(() => { Linking.openURL('tel:911'); }, 120_000);
  }
}

export async function callEmergencyContact(phoneNumber: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(`tel:${phoneNumber}`);
  if (canOpen) await Linking.openURL(`tel:${phoneNumber}`);
}
