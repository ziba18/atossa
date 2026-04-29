import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { Icon } from '../ui/Icon';
import { Colors } from '../../constants/colors';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '../../constants/theme';
import { sendEmergencyAlert } from '../../lib/emergency';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  emergencyContacts: import('../../types/database').EmergencyContact[];
}

export function EmergencyButton({ emergencyContacts }: Props) {
  const theme = useColors();
  const styles = createStyles(theme);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);

  const handleEmergency = async () => {
    if (!user || !profile) return;
    setSending(true);
    try {
      await sendEmergencyAlert({
        userId: user.id,
        contacts: emergencyContacts,
        userName: profile.display_name ?? 'Atossa user',
        triggerReason: 'manual',
      });
      setShowConfirm(false);
      Alert.alert('Alert Sent', 'Your emergency contacts have been notified.');
    } catch {
      Alert.alert('Error', 'Could not send alert. Please call emergency services directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowConfirm(true)}
        style={styles.button}
        activeOpacity={0.85}
      >
        <Icon name="shield" size={20} color="#FFFFFF" />
        <Text style={styles.label}>Emergency</Text>
      </TouchableOpacity>

      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Send Emergency Alert?</Text>
            <Text style={styles.modalBody}>
              This will send an SMS to your emergency contacts and notify connected accounts.
            </Text>
            <TouchableOpacity
              onPress={handleEmergency}
              style={styles.confirmBtn}
              disabled={sending}
            >
              <Text style={styles.confirmText}>
                {sending ? 'Sending...' : 'Yes, Send Alert'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowConfirm(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    button: { backgroundColor: Colors.cherryDark, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, ...Shadow.md },
    label: { color: '#FFFFFF', fontWeight: FontWeight.bold, fontSize: FontSize.md },
    overlay: { flex: 1, backgroundColor: c.overlay, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
    modal: { backgroundColor: c.surface, borderRadius: Radius.xl, padding: Spacing.xl, width: '100%' },
    modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.cherryDark, marginBottom: Spacing.sm, textAlign: 'center' },
    modalBody: { fontSize: FontSize.md, color: c.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
    confirmBtn: { backgroundColor: c.cherry, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.sm },
    confirmText: { color: '#FFFFFF', fontWeight: FontWeight.bold, fontSize: FontSize.md },
    cancelBtn: { alignItems: 'center', padding: Spacing.sm },
    cancelText: { color: c.textSecondary, fontSize: FontSize.md },
  });
}
