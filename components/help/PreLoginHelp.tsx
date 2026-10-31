import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, space } from '../../constants/atossaUI';
import { Button, Txt } from '../atossa/kit';

/** Safety-ruled wording (C112, option B): do not edit the words without Safety. Static, no data, no account. */
export const PRE_LOGIN_HELP_LINE = 'Need help now? In an emergency call 999. For urgent advice call 111.';
export const PRE_LOGIN_HELP_LINK = 'More help (Samaritans, Shout)';

export function PreLoginHelp({ style }: { style?: object }) {
  const router = useRouter();
  return (
    <View style={[{ gap: 0, alignItems: 'flex-start' }, style]}>
      <Txt variant="caption" color={colors.ink}>{PRE_LOGIN_HELP_LINE}</Txt>
      <Button label={PRE_LOGIN_HELP_LINK} variant="text" small align="start" onPress={() => router.push('/(auth)/help-now')} />
    </View>
  );
}
