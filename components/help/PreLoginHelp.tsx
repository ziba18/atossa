import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, space } from '../../constants/atossaUI';
import { Txt } from '../atossa/kit';

/** Safety-ruled wording (C112, option B): do not edit the words without Safety. Static, no data, no account. */
export const PRE_LOGIN_HELP_LINE = 'Need help now? In an emergency call 999. For urgent advice call 111.';
export const PRE_LOGIN_HELP_LINK = 'More help (Samaritans, Shout)';

export function PreLoginHelp({ style }: { style?: object }) {
  const router = useRouter();
  return (
    <View style={[{ gap: 0, alignItems: 'flex-start' }, style]}>
      <Txt variant="caption" color={colors.ink}>{PRE_LOGIN_HELP_LINE}</Txt>
      {/* Own pressable (not Button): a wrapped label stays left-aligned with the line above it. 44 pt tall. */}
      <Pressable
        onPress={() => router.push('/(auth)/help-now')}
        accessibilityRole="link"
        accessibilityLabel={PRE_LOGIN_HELP_LINK}
        style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
      >
        <Txt variant="secondary" color={colors.plum} style={{ fontWeight: '600', textAlign: 'left' }}>{PRE_LOGIN_HELP_LINK}</Txt>
      </Pressable>
    </View>
  );
}
