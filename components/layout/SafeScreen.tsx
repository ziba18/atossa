import React from 'react';
import { ScrollView, View, StyleSheet, ViewStyle, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Spacing } from '../../constants/theme';

interface SafeScreenProps extends ScrollViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  noPadding?: boolean;
}

export function SafeScreen({
  children,
  style,
  scrollable = true,
  noPadding = false,
  ...scrollProps
}: SafeScreenProps) {
  const theme = useTheme();

  const content = (
    <View style={[styles.inner, noPadding && styles.noPadding, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1 },
  inner: { flex: 1, padding: Spacing.md },
  noPadding: { padding: 0 },
});
