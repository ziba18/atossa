import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, space } from '../../constants/atossaUI';
import { Txt } from '../atossa/kit';
import { Icon } from '../ui/Icon';

/** Pre-login 'Help now' link: static route to the public Help now page, no API call, no account needed. */
export function HelpNowLink() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/(auth)/help-now' as any)}
      accessibilityRole="link"
      accessibilityLabel="Help now"
      accessibilityHint="Opens phone numbers for urgent help"
      hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
      style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}
    >
      <Icon name="heart-pulse" size={16} color={colors.plum} />
      <Txt variant="caption" color={colors.plum} style={styles.text}>Help now</Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingLeft: space.xs },
  text: { fontWeight: '600', fontSize: 15 },
});
