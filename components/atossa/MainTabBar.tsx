import React, { useEffect, useState } from 'react';
import { View, Pressable, Keyboard, Platform, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, heights, type as typeScale } from '../../constants/atossaUI';
import { Txt } from './kit';

const TABS: Record<string, { label: string }> = {
  today: { label: 'Today' },
  timeline: { label: 'Timeline' },
  doctor: { label: 'For my doctor' },
};
export const VISIBLE_TABS = ['today', 'timeline', 'doctor'];

type AnyRoute = { key?: string; name: string; params?: any; state?: { key?: string; index?: number; routes?: AnyRoute[] } };

/**
 * Three tabs as a floating white pill: text labels, unselected ink2, selected white on an ink pill.
 * Hidden while the keyboard is up.
 */
export function MainTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [keyboard, setKeyboard] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboard(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (keyboard) return null;

  const active = state.routes[state.index] as AnyRoute | undefined;
  // Profile and its records (opened from the avatar) are not a tab: no tab is active there (PM rule, blueprint §4); Back returns to where the avatar was tapped.
  const activeName = active && VISIBLE_TABS.includes(active.name) ? active.name : undefined;
  const routes = state.routes.filter((r) => VISIBLE_TABS.includes(r.name));

  /**
   * Land on the tab's ROOT, always (UX #6). A detail pushed into a tab from elsewhere (Today →
   * Timeline entry) can be the only route in that tab's stack, so popToTop can't remove it and
   * a later tap reopened a stale "This note isn't here any more". Reset the nested stack instead.
   * Returns false when the stack is already at its root (nothing to do).
   */
  const needsReset = (route: AnyRoute) => {
    const nested = route.state;
    if (!nested?.key || !nested.routes) return false;
    const top = nested.routes[nested.index ?? 0];
    return !(nested.routes.length === 1 && top?.name === 'index');
  };
  const resetToRoot = (route: AnyRoute) => {
    // = CommonActions.reset(...) aimed at the tab's own stack (expo-router vendors react-navigation).
    descriptors[route.key!].navigation.dispatch({ type: 'RESET', payload: { index: 0, routes: [{ name: 'index' }] }, target: route.state!.key } as any);
  };

  return (
    <View role="navigation" aria-label="Main">
    <View style={[styles.bar, { paddingBottom: insets.bottom }, active?.name === 'doctor' && { backgroundColor: colors.surface }]}>
    <View style={styles.pillBar} accessibilityRole="tablist">
      {routes.map((route) => {
        const focused = activeName === route.name;
        const isCurrent = active?.name === route.name;
        const tab = TABS[route.name];
        const tint = focused ? colors.white : colors.ink2;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            aria-selected={focused}
            accessibilityLabel={tab.label}
            onPress={() => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }) as {
                defaultPrevented: boolean; preventDefault?: () => void;
              };
              if (event.defaultPrevented) return;
              const r = route as AnyRoute;
              // Exactly ONE mechanism moves the stack (review 2, N2). The nested native stack also
              // hears 'tabPress' and, on the next frame, pops to top when it is focused and deeper
              // than its root. Running our RESET as well left that POP_TO_TOP with nothing to pop
              // ("not handled by any navigator" → dev LogBox eating taps). So when we reset, we
              // first preventDefault the event, which the stack checks before popping.
              if (needsReset(r)) {
                event.preventDefault?.();
                resetToRoot(r);
              }
              if (!isCurrent) navigateToTab(route.key);
            }}
            style={styles.tab}
          >
            <View style={[styles.pill, focused && styles.pillOn]}>
              <Txt maxFontSizeMultiplier={1.4} numberOfLines={1} style={[typeScale.tab, { color: tint }, focused && styles.labelOn]}>{tab.label}</Txt>
            </View>
          </Pressable>
        );
      })}
    </View>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Floating pill (Iris round 3): the bar itself stays in flow so screens never sit under it.
  bar: { alignItems: 'center', paddingTop: 5, backgroundColor: colors.canvas },
  pillBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 30, padding: 5,
    boxShadow: '0 8px 22px rgba(90,60,160,0.16)', minHeight: heights.tabBar - 10,
    // Very narrow screens (large text on a small phone): wrap to a second row instead of clipping labels.
    flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%',
  },
  // Selected = ink pill + heavier label, so state never rests on colour alone (WCAG 1.4.1).
  pill: { minHeight: 44, paddingHorizontal: 14, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: colors.ink },
  labelOn: { fontWeight: '700' },
  tab: { minHeight: 44, justifyContent: 'center' },
});
