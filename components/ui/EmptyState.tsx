import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { FontSize, FontWeight, Spacing } from '../../constants/theme';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  iconName?: IconName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ iconName = 'flower', title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const theme = useColors();
  const styles = createStyles(theme);
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon name={iconName} size={48} color={theme.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} style={styles.button} />
      )}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
    iconWrap: { marginBottom: Spacing.md },
    title: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.semibold,
      fontFamily: 'Fraunces_500Medium',
      color: c.textPrimary,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: FontSize.md,
      fontFamily: 'Fraunces_400Regular',
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Spacing.lg,
    },
    button: { marginTop: Spacing.md },
  });
}
