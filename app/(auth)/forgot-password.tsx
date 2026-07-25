import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { Icon } from '../../components/ui/Icon';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { FontSize, Spacing } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const theme = useColors();
  const styles = createStyles(theme);

  return (
    <SafeScreen>
      <Header title="Reset Password" showBack />
      <View style={styles.container}>
        <Icon name="send" size={48} color={theme.textMuted} />
        <Text style={styles.title}>Coming soon</Text>
        <Text style={styles.body}>
          Password reset by email will be available in a future update. For now, please contact support if you need access to your account.
        </Text>
      </View>
    </SafeScreen>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
    title: { fontSize: FontSize.xl, fontFamily: 'Fraunces_400Regular_Italic', color: c.textPrimary },
    body: { fontSize: FontSize.md, fontFamily: 'Fraunces_400Regular', color: c.textMuted, textAlign: 'center', lineHeight: 22 },
  });
}
