import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '../../constants/atossaUI';
import { Txt } from './kit';
import { Icon } from '../ui/Icon';

const TAB_TITLES: Record<string, string> = { today: 'Today', timeline: 'Timeline', doctor: 'For my doctor' };

/**
 * A slim 'Help now' link above every screen of a tab. Static, same for everyone, offline: it only
 * routes to the Help now screen (phone numbers). It never reads a note. Hidden on that screen itself.
 */
export function HelpNowStrip({ children, background = colors.canvas }: { children: React.ReactNode; background?: string }) {
  const router = useRouter();
  const segments = useSegments() as string[];
  const insets = useSafeAreaInsets();
  const onHelp = segments[segments.length - 1] === 'help-now';
  const from = TAB_TITLES[segments[1] ?? ''] ?? 'Today';
  return (
    <View style={{ flex: 1 }}>
      {onHelp ? null : (
        <View style={[styles.strip, { paddingTop: insets.top, backgroundColor: background }]}>
          <Pressable
            onPress={() => router.push({ pathname: '/(tabs)/profile/help-now', params: { from } } as any)}
            accessibilityRole="link"
            accessibilityLabel="Help now"
            accessibilityHint="Opens phone numbers for urgent help"
            hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
            style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}
          >
            <Icon name="heart-pulse" size={16} color={colors.plum} />
            <Txt variant="caption" color={colors.plum} style={styles.text}>Help now</Txt>
          </Pressable>
        </View>
      )}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { alignItems: 'flex-end', paddingHorizontal: space.lg },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: space.xs },
  text: { fontWeight: '600', fontSize: 15 },
});
