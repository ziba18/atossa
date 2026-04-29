import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Header } from '../../../components/layout/Header';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';

export default function EditProfileScreen() {
  const { user, profile, fetchProfile } = useAuthStore();
  const theme = useColors();
  const styles = createStyles(theme);

  const [name, setName] = useState(profile?.display_name ?? '');
  const [dob, setDob] = useState(profile?.date_of_birth ?? '');
  const [cycleLength, setCycleLength] = useState(String(profile?.average_cycle_length ?? 28));
  const [profileLoading, setProfileLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: name || null,
        date_of_birth: dob || null,
        average_cycle_length: parseInt(cycleLength) || 28,
      })
      .eq('id', user.id);
    setProfileLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    await fetchProfile();
    Alert.alert('Saved!', 'Your profile has been updated.');
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setNewPassword('');
    setConfirmPassword('');
    Alert.alert('Password Updated', 'Your password has been changed successfully.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Header title="Edit Profile" showBack />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.emailRow}>
            <Text style={styles.emailLabel}>Email</Text>
            <Text style={styles.emailValue}>{user?.email ?? '—'}</Text>
          </View>
          <Input label="Display Name" value={name} onChangeText={setName} placeholder="Your name" />
          <Input label="Date of Birth" value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
          <Input label="Average Cycle Length (days)" value={cycleLength} onChangeText={setCycleLength} keyboardType="number-pad" placeholder="28" />
          <Button label="Save Profile" onPress={handleSaveProfile} loading={profileLoading} size="lg" fullWidth style={styles.btn} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <Input label="New Password" value={newPassword} onChangeText={setNewPassword} placeholder="At least 6 characters" secureTextEntry />
          <Input label="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat new password" secureTextEntry />
          <Button label="Update Password" onPress={handleChangePassword} loading={passwordLoading} size="lg" fullWidth style={styles.btn} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  const Colors = c;
  return StyleSheet.create({
    container: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    section: { marginBottom: Spacing.xl },
    sectionTitle: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      color: Colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: Spacing.md,
    },
    emailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: Colors.surfaceElevated,
      borderRadius: 8,
      marginBottom: Spacing.sm,
    },
    emailLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
    emailValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
    btn: { marginTop: Spacing.md },
  });
}
