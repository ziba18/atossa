import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { FontSize, Spacing } from '../../constants/theme';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

import { Colors } from '../../constants/colors';

export function LoadingSpinner({ message, fullScreen = false }: LoadingSpinnerProps) {
  const theme = useColors();
  const styles = createStyles(theme);
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={Colors.whiskey} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
    fullScreen: { flex: 1, backgroundColor: c.background },
    message: {
      marginTop: Spacing.md,
      fontSize: FontSize.md,
      fontFamily: 'Jost_400Regular',
      color: c.textSecondary,
    },
  });
}
