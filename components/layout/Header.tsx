import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../constants/theme';

// Matches web page headers: Cormorant display font for titles, whiskey gold back arrow
interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  displayTitle?: boolean; // use Cormorant serif for main section titles
}

export function Header({ title, subtitle, showBack = false, rightAction, displayTitle = false }: HeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.center}>
        <Text style={[styles.title, displayTitle && styles.titleDisplay]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.right}>{rightAction ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,           // rgba(163,133,96,0.18)
    backgroundColor: Colors.surface,            // #FFFFFF
  },
  left: { width: 44, alignItems: 'flex-start' },
  center: { flex: 1, alignItems: 'center' },
  right: { width: 44, alignItems: 'flex-end' },
  backBtn: { padding: Spacing.xs },
  backArrow: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: Colors.whiskey,                      // #A38560 — whiskey gold back arrow
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.textPrimary,
    letterSpacing: 0.01,
  },
  titleDisplay: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: FontSize.xl,
    letterSpacing: 0.02,
  },
  subtitle: {
    fontSize: FontSize.xs,
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
    marginTop: 2,
  },
});
