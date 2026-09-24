import React, { useEffect, useState } from 'react';
import { View, Pressable, Keyboard, Platform, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UI } from '../../constants/atossaUI';
import { Icon, type IconName } from '../ui/Icon';
import { Txt } from './kit';

const C = UI.colors;

const TABS: Record<string, { label: string; icon: IconName }> = {
  chat: { label: 'Chat', icon: 'message-circle' },
  dashboard: { label: 'Dashboard', icon: 'bar-chart' },
  report: { label: 'For my doctor', icon: 'file-text' },
};
export const VISIBLE_TABS = ['chat', 'dashboard', 'report'];

/** Three large, labelled tabs. Hidden while the keyboard is up so typing has room. */
export function MainTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [keyboard, setKeyboard] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboard(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (keyboard) return null;

  const activeName = state.routes[state.index]?.name;
  const routes = state.routes.filter((r) => VISIBLE_TABS.includes(r.name));

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
      {routes.map((route) => {
        const focused = activeName === route.name;
        const tab = TABS[route.name];
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name as never);
            }}
            style={[styles.tab, focused && { backgroundColor: C.secondary }]}
          >
            <Icon name={tab.icon} size={24} color={focused ? C.secondaryForeground : C.mutedForeground} strokeWidth={focused ? 2.3 : 1.9} />
            <Txt variant="smallBold" color={focused ? C.secondaryForeground : C.mutedForeground} style={{ fontSize: 14, lineHeight: 18, textAlign: 'center' }}>
              {tab.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingTop: 8,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  tab: { flex: 1, minHeight: 64, borderRadius: UI.radius, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 2 },
});
