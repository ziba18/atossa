import { Stack } from 'expo-router';
import { colors } from '../../../constants/atossaUI';
import { HelpNowStrip } from '../../../components/atossa/HelpNowStrip';

/**
 * Timeline's stack. It always comes back to the list:
 * - re-tapping the Timeline tab pops to the list (the native stack hears MainTabBar's 'tabPress');
 * - switching tabs lands on the list (MainTabBar navigates to `{ screen: 'index' }`);
 * - when the Timeline tab loses focus (e.g. back from an entry opened from Today, a delete that
 *   returns to Today, or Profile → Clear sample data), any detail left in this stack is dropped,
 *   so a stale or deleted note can never reopen.
 */
export default function Layout() {
  // 'Help now' link on every screen of this tab (Safety C101)
  return (
    <HelpNowStrip>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}
        screenListeners={({ navigation }) => ({
          blur: () => {
            // A detail blurring because another detail was pushed on top keeps its place;
            // only reset when the whole tab went out of focus.
            requestAnimationFrame(() => {
              const tab = navigation.getParent?.();
              if (!tab || tab.isFocused()) return;
              const state = navigation.getState?.();
              if (!state) return;
              const atRoot = state.routes.length === 1 && state.routes[0]?.name === 'index';
              if (!atRoot) navigation.reset({ index: 0, routes: [{ name: 'index' }] });
            });
          },
        })}
      />
    </HelpNowStrip>
  );
}
