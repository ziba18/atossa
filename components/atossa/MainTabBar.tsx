import React, { useEffect, useState } from 'react';
import { View, Pressable, Keyboard, Platform, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, heights, type as typeScale } from '../../constants/atossaUI';
import { Icon, type IconName } from '../ui/Icon';
import { Txt } from './kit';

const TABS: Record<string, { label: string; icon: IconName }> = {
  today: { label: 'Today', icon: 'sun' },
  timeline: { label: 'Timeline', icon: 'list' },
  doctor: { label: 'For my doctor', icon: 'file-text' },
};
export const VISIBLE_TABS = ['today', 'timeline', 'doctor'];

/** Visible title → tab route ("from" params carry titles). */
const TAB_BY_TITLE: Record<string, string> = { Today: 'today', Timeline: 'timeline', 'For my doctor': 'doctor' };

type AnyRoute = { name: string; params?: any; state?: { key?: string; index?: number; routes?: AnyRoute[] } };

/** Profile (and its records) were opened from a tab: find which, via the `from` param. */
function profileOrigin(route: AnyRoute | undefined): string {
  const from = route?.params?.from ?? route?.params?.params?.from ?? route?.state?.routes?.[0]?.params?.from;
  return TAB_BY_TITLE[String(from ?? '')] ?? 'today';
}

/**
 * Three tabs: Lucide 24 / 1.75 stroke, 11/13 500 label. Unselected ink3, selected plum on a plumTint pill.
 * Near-opaque white bar with a hairline top. Hidden while the keyboard is up.
 */
export function MainTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [keyboard, setKeyboard] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboard(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (keyboard) return null;

  const active = state.routes[state.index] as AnyRoute | undefined;
  // On Profile (not a tab) keep the tab it came from tinted, so you are never "nowhere" (V18).
  const activeName = active && !VISIBLE_TABS.includes(active.name) ? profileOrigin(active) : active?.name;
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
    navigation.dispatch({ type: 'RESET', payload: { index: 0, routes: [{ name: 'index' }] }, target: route.state!.key } as any);
  };

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]} accessibilityRole="tablist">
      {routes.map((route) => {
        const focused = activeName === route.name;
        const isCurrent = active?.name === route.name;
        const tab = TABS[route.name];
        const tint = focused ? colors.plum : colors.ink3;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            aria-selected={focused}
            accessibilityLabel={tab.label}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }) as {
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
              if (!isCurrent) navigation.navigate(route.name);
            }}
            style={styles.tab}
          >
            <View style={[styles.pill, focused && styles.pillOn]}>
              <Icon name={tab.icon} size={24} color={tint} />
            </View>
            <Txt maxFontSizeMultiplier={1.6} style={[typeScale.tab, { color: tint }, focused && styles.labelOn]}>{tab.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: colors.tabBar, borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: colors.hairline,
  },
  // Selected = tinted pill + heavier label, so state never rests on colour alone (WCAG 1.4.1).
  pill: { width: 56, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: colors.plumTint },
  labelOn: { fontWeight: '700' },
  tab: { flex: 1, height: heights.tabBar, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 2 },
});
