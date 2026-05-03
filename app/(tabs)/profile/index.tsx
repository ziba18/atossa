import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { supabase } from '../../../lib/supabase';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../../constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, signOut } = useAuthStore();
  const { cycleLogs, fetchCycleLogs } = useCycleStore();
  const [totalSymptoms, setTotalSymptoms] = useState<number>(0);
  const theme = useColors();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  // Tab bar floats absolutely (height 68 + 12 from bottom). Pad the scroll
  // content so the footer line clears it on every device.
  const bottomPad = insets.bottom + 96;

  useEffect(() => {
    if (!user) return;
    fetchCycleLogs(user.id);
    supabase
      .from('symptom_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setTotalSymptoms(count ?? 0));
  }, [user]);

  const totalCycles = cycleLogs.length;

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const MenuItem = ({ iconName, label, onPress, badge }: { iconName: IconName; label: string; onPress: () => void; badge?: string }) => (
    <TouchableOpacity onPress={onPress} style={styles.menuItem} activeOpacity={0.8}>
      <Icon name={iconName} size={20} color={theme.textSecondary} />
      <Text style={styles.menuLabel}>{label}</Text>
      {badge && <Badge label={badge} variant="cherry" />}
      <Icon name="chevron-right" size={18} color={theme.textMuted} />
    </TouchableOpacity>
  );

  const CycleRegularityBadge = ({ regularity }: { regularity: string }) => {
    const cfg: Record<string, { bg: string; color: string }> = {
      regular: { bg: Colors.emeraldLighter, color: Colors.emeraldDark },
      irregular: { bg: Colors.whiskeyLighter, color: Colors.whiskeyDark },
    };
    const c = cfg[regularity] ?? { bg: theme.surface, color: theme.textMuted };
    return (
      <View style={[styles.regularityBadge, { backgroundColor: c.bg }]}>
        <Text style={[styles.regularityText, { color: c.color }]}>{regularity}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad }}>

        <LinearGradient colors={[Colors.cherry, Colors.cherryDark]} style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.display_name ?? user?.email ?? 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.display_name ?? 'Attosa User'}</Text>
          {user?.email && <Text style={styles.email}>{user.email}</Text>}
          {user?.created_at && (
            <Text style={styles.memberSince}>
              Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
          )}
        </LinearGradient>

        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <Card style={styles.statCell}>
              <Text style={styles.statValue}>{totalCycles}</Text>
              <Text style={styles.statLabel}>Cycles logged</Text>
            </Card>
            <Card style={styles.statCell}>
              <Text style={styles.statValue}>{profile?.average_cycle_length ?? 28}d</Text>
              <Text style={styles.statLabel}>Avg cycle</Text>
            </Card>
            <Card style={styles.statCell}>
              <Text style={styles.statValue}>{totalSymptoms}</Text>
              <Text style={styles.statLabel}>Symptoms</Text>
            </Card>
          </View>
        </View>

        {profile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cycle Profile</Text>
            <Card>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Regularity</Text>
                <CycleRegularityBadge regularity={profile.cycle_regularity ?? 'unknown'} />
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Average cycle length</Text>
                <Text style={styles.infoValue}>{profile.average_cycle_length} days</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Average period length</Text>
                <Text style={styles.infoValue}>{profile.average_period_length} days</Text>
              </View>
              {profile.date_of_birth && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Date of birth</Text>
                    <Text style={styles.infoValue}>{formatDate(profile.date_of_birth)}</Text>
                  </View>
                </>
              )}
              <View style={styles.divider} />
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile/edit-profile' as any)}
                style={styles.editBtn}
                activeOpacity={0.8}
              >
                <Icon name="pencil" size={14} color={Colors.cherry} />
                <Text style={styles.editBtnText}>Edit Profile & Change Password</Text>
              </TouchableOpacity>
            </Card>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card noPadding>
            <MenuItem iconName="link" label="Connected Accounts" onPress={() => router.push('/(tabs)/profile/connected-accounts' as any)} />
            <MenuItem iconName="shield" label="Emergency Contacts" onPress={() => router.push('/(tabs)/profile/emergency-contacts' as any)} />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <Card noPadding>
            <MenuItem iconName="settings" label="App Settings" onPress={() => router.push('/(tabs)/profile/settings' as any)} />
          </Card>
        </View>

        <TouchableOpacity
          onPress={() =>
            Alert.alert('Sign Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                  await signOut();
                  router.replace('/(auth)/welcome');
                },
              },
            ])
          }
          style={styles.signOutBtn}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Attosa v1.0 · Your health data is encrypted and private</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  const Colors = c;
  return StyleSheet.create({
    hero: { padding: Spacing.xl, alignItems: 'center', paddingBottom: Spacing.xl },
    avatar: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
    },
    avatarText: { fontSize: 36, fontWeight: FontWeight.bold, color: c.white ?? '#FFFFFF' },
    name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: c.white ?? '#FFFFFF', marginBottom: 4 },
    email: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
    memberSince: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)' },

    statsSection: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
    statsGrid: { flexDirection: 'row', gap: Spacing.sm },
    statCell: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
    statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.cherry },
    statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },

    section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
    sectionTitle: {
      fontSize: FontSize.xs, fontWeight: FontWeight.semibold,
      color: Colors.textMuted, textTransform: 'uppercase',
      letterSpacing: 0.8, marginBottom: Spacing.sm,
    },
    infoRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    infoLabel: { fontSize: FontSize.sm, color: Colors.textMuted, flex: 1 },
    infoValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
    divider: { height: 1, backgroundColor: Colors.border },
    regularityBadge: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
    regularityText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textTransform: 'capitalize' },
    editBtn: {
      flexDirection: 'row', gap: Spacing.xs,
      paddingVertical: Spacing.sm, alignItems: 'center', justifyContent: 'center',
      borderRadius: Radius.md, backgroundColor: Colors.cherryLighter, marginTop: Spacing.sm,
    },
    editBtnText: { fontSize: FontSize.sm, color: Colors.cherry, fontWeight: FontWeight.semibold },

    menuItem: {
      flexDirection: 'row', alignItems: 'center',
      padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm,
    },
    menuLabel: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },

    signOutBtn: { margin: Spacing.xl, padding: Spacing.md, alignItems: 'center' },
    signOutText: { fontSize: FontSize.md, color: Colors.cherry, fontWeight: FontWeight.semibold },
    footer: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted },
  });
}
