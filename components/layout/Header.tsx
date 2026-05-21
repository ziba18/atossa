import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../constants/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  displayTitle?: boolean;
}

export function Header({ title, subtitle, showBack = false, rightAction, displayTitle = false }: HeaderProps) {
  const router = useRouter();
  const theme = useColors();
  const styles = createStyles(theme);

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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    left: { width: 44, alignItems: 'flex-start' },
    center: { flex: 1, alignItems: 'center' },
    right: { width: 44, alignItems: 'flex-end' },
    backBtn: { padding: Spacing.xs },
    backArrow: {
      fontSize: 22,
      fontWeight: FontWeight.bold,
      color: Colors.whiskey,
    },
    title: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.semibold,
      fontFamily: 'Fraunces_500Medium_Italic',
      color: c.textPrimary,
      letterSpacing: 0.01,
    },
    titleDisplay: {
      fontFamily: 'Fraunces_500Medium_Italic',
      fontSize: FontSize.xl,
      letterSpacing: 0.02,
    },
    subtitle: {
      fontSize: FontSize.xs,
      fontFamily: 'Fraunces_400Regular',
      color: c.textMuted,
      marginTop: 2,
    },
  });
}
