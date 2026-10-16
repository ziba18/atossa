import React from 'react';
import { Linking, View } from 'react-native';
import { space } from '../../constants/atossaUI';
import { LegalUrls } from '../../constants/config';
import { Button, Txt } from '../atossa/kit';

export const openLegal = (page: keyof typeof LegalUrls) => Linking.openURL(LegalUrls[page]).catch(() => {});

/** The sign-up agreement line, with the two pages as real (44pt) text buttons beneath it. */
export function LegalLinks() {
  return (
    <View style={{ alignItems: 'center', marginTop: space.xxs }}>
      <Txt variant="caption" style={{ textAlign: 'center' }}>
        By creating an account, you agree to our terms of use and privacy policy.
      </Txt>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.md }}>
        <Button label="Terms of use" variant="text" small onPress={() => openLegal('terms')} />
        <Button label="Privacy policy" variant="text" small onPress={() => openLegal('privacy')} />
      </View>
    </View>
  );
}
