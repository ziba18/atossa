import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { initHealthKit, syncWeightFromHealthKit, syncBloodPressureFromHealthKit } from '../../../lib/healthKit';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Header } from '../../../components/layout/Header';
import { Icon } from '../../../components/ui/Icon';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';

export default function HealthIntegrationsScreen() {
  const user = useAuthStore((s) => s.user);
  const theme = useColors();
  const styles = createStyles(theme);
  const [healthKitConnected, setHealthKitConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const connectHealthKit = async () => {
    if (!user) return;
    const success = await initHealthKit();
    if (success) {
      setHealthKitConnected(true);
      Alert.alert('Connected!', 'Apple Health is now linked to Atossa.');
    } else {
      Alert.alert('Not Available', 'Apple Health requires a physical device and EAS Build (not Expo Go).');
    }
  };

  const syncNow = async () => {
    if (!user) return;
    setSyncing(true);
    await syncWeightFromHealthKit(user.id);
    await syncBloodPressureFromHealthKit(user.id);
    setSyncing(false);
    Alert.alert('Synced!', 'Your latest health data has been imported.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Header title="Health Integrations" showBack />
      <View style={styles.container}>
        {Platform.OS === 'ios' && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="heart-pulse" size={20} color={Colors.cherry} />
              <Text style={styles.cardTitle}>Apple Health</Text>
            </View>
            <Text style={styles.cardDesc}>
              Sync weight, blood pressure, and heart rate automatically from the Health app.
            </Text>
            {healthKitConnected ? (
              <Button label="Sync Now" onPress={syncNow} loading={syncing} variant="secondary" fullWidth />
            ) : (
              <Button label="Connect Apple Health" onPress={connectHealthKit} fullWidth />
            )}
            <View style={styles.noteRow}>
              <Icon name="triangle-alert" size={12} color={theme.textMuted} />
              <Text style={styles.note}>Requires EAS Build (not Expo Go)</Text>
            </View>
          </Card>
        )}

        {Platform.OS === 'android' && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="activity" size={20} color={Colors.forest} />
              <Text style={styles.cardTitle}>Google Fit</Text>
            </View>
            <Text style={styles.cardDesc}>
              Sync health data from Google Fit and Wear OS devices.
            </Text>
            <Button label="Connect Google Fit" onPress={() => Alert.alert('Coming Soon', 'Google Fit integration requires EAS Build.')} fullWidth />
            <View style={styles.noteRow}>
              <Icon name="triangle-alert" size={12} color={theme.textMuted} />
              <Text style={styles.note}>Requires EAS Build (not Expo Go)</Text>
            </View>
          </Card>
        )}

        <Card style={styles.manualCard}>
          <View style={styles.cardHeader}>
            <Icon name="pencil" size={20} color={Colors.forest} />
            <Text style={styles.cardTitle}>Manual Entry</Text>
          </View>
          <Text style={styles.cardDesc}>You can always log health metrics manually in the Track tab.</Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  const Colors = c;
  return StyleSheet.create({
    container: { padding: Spacing.md },
    card: { marginBottom: Spacing.md, gap: Spacing.sm },
    manualCard: { backgroundColor: Colors.emeraldLighter, borderColor: Colors.emerald },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    cardDesc: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
    noteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    note: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic' },
  });
}
