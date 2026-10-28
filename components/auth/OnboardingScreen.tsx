import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, space } from '../../constants/atossaUI';
import { BackChevron, Txt } from '../atossa/kit';

export const ONBOARDING_STEPS = 5;

/**
 * One onboarding question per screen: optional BackChevron, a quiet "Step 2 of 3" caption
 * above three quiet segments (done = plum, rest = sunken; the caption carries the meaning), the question as the large title, helper text in ink2, then the controls.
 * Mirrors ScreenLarge's column (gutter 20, max 600) — ScreenLarge has no slot above the title.
 */
export function OnboardingScreen({
  step, title, helper, badge, back, children, scrollRef,
}: {
  step: number;
  title: string;
  helper?: string;
  /** Small outlined label above the title, e.g. the area a question is about. */
  badge?: string;
  back?: { label: string; onPress?: () => void };
  children: React.ReactNode;
  scrollRef?: React.RefObject<ScrollViewInstance | null>;
}) {
  // Under ~240 pt of layout width (200% text on a 320 phone) the 34 pt title broke words mid-letter.
  const narrow = useWindowDimensions().width < 240;
  return (
    <SafeAreaView role="main" edges={['top', 'bottom']} style={styles.screen}>
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
          <View style={styles.segments} aria-hidden>
            {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
              <View key={i} style={[styles.segment, i < step && styles.segmentDone]} />
            ))}
          </View>
          <Txt variant="caption" style={styles.step}>{`Step ${step} of ${ONBOARDING_STEPS}`}</Txt>
          {badge ? <View style={styles.badge}><Txt variant="caption" color={colors.ink}>{badge}</Txt></View> : null}
          <Txt variant={narrow ? 'title' : 'hero'} accessibilityRole="header">{title}</Txt>
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
  badge: {
    alignSelf: 'flex-start', marginTop: space.sm, marginBottom: space.xs, paddingHorizontal: space.md, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1, borderColor: colors.ink,
  },
  segments: { flexDirection: 'row', gap: 6, marginTop: space.xs },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.sunken },
  segmentDone: { backgroundColor: colors.plum },
});
