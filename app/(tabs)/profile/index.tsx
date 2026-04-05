import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../stores/authStore';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../../constants/theme';

interface MenuItemProps {
  emoji: string;
  label: string;
  onPress: () => void;
  badge?: string;
}

function MenuItem({ emoji, label, onPress, badge }: MenuItemProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuItem} activeOpacity={0.8}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      {badge && <Badge label={badge} variant="cherry" />}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, signOut } = useAuthStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={[Colors.cherry, Colors.cherryDark]} style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.display_name ?? user?.email ?? 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.display_name ?? 'Atossa User'}</Text>
          {user?.email && (
            <Text style={styles.email}>{user.email}</Text>
          )}
        </LinearGradient>

        {/* Account info card */}
        <View style={styles.infoSection}>
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{profile?.display_name || '—'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{user?.email || '—'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{profile?.date_of_birth || '—'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Avg Cycle Length</Text>
              <Text style={styles.infoValue}>
                {profile?.average_cycle_length ? `${profile.average_cycle_length} days` : '—'}
              </Text>
            </View>
            <View style={[styles.infoDivider, { marginBottom: Spacing.sm }]} />
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile/edit-profile' as any)}
              style={styles.editBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.editBtnText}>✏️  Edit Profile & Change Password</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Menu sections */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card noPadding>
            <MenuItem emoji="🔗" label="Connected Accounts" onPress={() => router.push('/(tabs)/profile/connected-accounts' as any)} />
            <MenuItem emoji="🚨" label="Emergency Contacts" onPress={() => router.push('/(tabs)/profile/emergency-contacts' as any)} />
            <MenuItem emoji="📱" label="Health Integrations" onPress={() => router.push('/(tabs)/profile/health-integrations' as any)} />
          </Card>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <Card noPadding>
            <MenuItem emoji="⚙️" label="App Settings" onPress={() => router.push('/(tabs)/profile/settings' as any)} />
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { padding: Spacing.xl, alignItems: 'center', paddingBottom: Spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { fontSize: 36, fontWeight: FontWeight.bold, color: Colors.white },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white, marginBottom: 4 },
  email: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.sm },
  heroBadgeRow: { marginTop: Spacing.xs },

  infoSection: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
  infoCard: { padding: Spacing.md },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  infoValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    flex: 2,
    textAlign: 'right',
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  editBtn: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.cherryLighter,
    marginTop: Spacing.xs,
  },
  editBtnText: {
    fontSize: FontSize.sm,
    color: Colors.cherry,
    fontWeight: FontWeight.semibold,
  },

  menuSection: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  menuEmoji: { fontSize: 20, width: 28 },
  menuLabel: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  chevron: { fontSize: 20, color: Colors.textMuted },

  signOutBtn: { margin: Spacing.xl, padding: Spacing.md, alignItems: 'center' },
  signOutText: { fontSize: FontSize.md, color: Colors.cherry, fontWeight: FontWeight.semibold },
});
