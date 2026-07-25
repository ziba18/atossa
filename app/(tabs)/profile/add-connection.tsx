import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../components/layout/Header';
import { Icon } from '../../../components/ui/Icon';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { FontSize, Spacing } from '../../../constants/theme';

export default function AddConnectionScreen() {
  const theme = useColors();
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Header title="Invite Someone" showBack />
      <View style={styles.container}>
        <Icon name="user" size={48} color={theme.textMuted} />
        <Text style={styles.title}>Coming soon</Text>
        <Text style={styles.body}>
          Inviting connected accounts will be available in a future update.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
    title: { fontSize: FontSize.xl, fontFamily: 'Fraunces_400Regular_Italic', color: c.textPrimary },
    body: { fontSize: FontSize.md, fontFamily: 'Fraunces_400Regular', color: c.textMuted, textAlign: 'center', lineHeight: 22 },
  });
}
