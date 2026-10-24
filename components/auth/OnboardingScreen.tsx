import React from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, space } from '../../constants/atossaUI';
import { BackChevron, Txt } from '../atossa/kit';

export const ONBOARDING_STEPS = 4;

/**
 * One onboarding question per screen: optional BackChevron, a quiet "Step 2 of 4" caption
 * (no progress bar), the question as the large title, helper text in ink2, then the controls.
 * Mirrors ScreenLarge's column (gutter 20, max 600) — ScreenLarge has no slot above the title.
 */
export function OnboardingScreen({
  step, title, helper, back, children, scrollRef,
}: {
  step: number;
  title: string;
  helper?: string;
  back?: { label: string; onPress?: () => void };
  children: React.ReactNode;
  scrollRef?: React.RefObject<ScrollViewInstance | null>;
}) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <ScrollView
        ref={scrollRef as React.RefObject<ScrollViewInstance>}
        contentContainerStyle={styles.column}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.head}>
          {back ? <BackChevron label={back.label} onPress={back.onPress} /> : <View style={styles.noBack} />}
          <Txt variant="caption" style={styles.step}>{`Step ${step} of ${ONBOARDING_STEPS}`}</Txt>
          <Txt variant="largeTitle" accessibilityRole="header">{title}</Txt>
          {helper ? <Txt variant="body" color={colors.ink2} style={{ marginTop: space.xs }}>{helper}</Txt> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  column: {
    width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center',
    paddingHorizontal: layout.gutter, paddingBottom: space.xxxl,
  },
  head: { paddingTop: space.sm, marginBottom: space.xxl },
  noBack: { height: 44 },
  step: { marginTop: space.xs, marginBottom: space.xs },
});
