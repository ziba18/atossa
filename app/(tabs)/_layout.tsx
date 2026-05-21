import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Icon, type IconName } from '../../components/ui/Icon';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/theme';
import { useColors } from '../../contexts/ThemeContext';

// ── Visible tabs (profile is hidden) ────────────────────────────────────────
const TAB_ICONS: Record<string, IconName> = {
  home:      'house',
  cycle:     'droplets',
  health:    'heart',
  education: 'book-open',
};
const TAB_LABELS: Record<string, string> = {
  home: 'Home', cycle: 'Cycle', health: 'Log', education: 'Learn',
};
const VISIBLE_ORDER = ['home', 'cycle', 'health', 'education'];

// ── Custom tab bar with sliding gradient pill ───────────────────────────────
function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useColors();
  // Each item's layout (x position + width) once measured.
  const layouts = useRef<Record<string, { x: number; width: number }>>({});

  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);

  const activeName = state.routes[state.index]?.name;

  // Build the visible-route list once per render (preserves order).
  const visibleRoutes = state.routes.filter((r) => VISIBLE_ORDER.includes(r.name));

  const onLayout = (name: string) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    layouts.current[name] = { x, width };
    if (name === activeName) {
      pillX.value = withSpring(x, { stiffness: 380, damping: 30 });
      pillW.value = withSpring(width, { stiffness: 380, damping: 30 });
    }
  };

  useEffect(() => {
    const l = layouts.current[activeName];
    if (l) {
      pillX.value = withSpring(l.x, { stiffness: 380, damping: 30 });
      pillW.value = withSpring(l.width, { stiffness: 380, damping: 30 });
    }
  }, [activeName]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
  }));

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.bar}>
        <BlurView intensity={36} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.barTint]} />

        {/* Sliding gradient pill behind the active tab */}
        <Animated.View style={[styles.pill, pillStyle]} pointerEvents="none">
          <LinearGradient
            colors={['#F2C5C9', '#C5DAE5']}  // rose → sky, mirroring Aura
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Glossy inner top highlight */}
          <View style={styles.pillHighlight} />
        </Animated.View>

        {/* Tabs */}
        {visibleRoutes.map((route) => {
          const focused = activeName === route.name;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name as never);
              }}
              onLayout={onLayout(route.name)}
              style={styles.tabBtn}
            >
              <Icon
                name={TAB_ICONS[route.name]}
                size={18}
                color={focused ? Colors.ink : Colors.textMuted}
                strokeWidth={focused ? 2.2 : 1.8}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: focused ? Colors.ink : Colors.textMuted },
                ]}
              >
                {TAB_LABELS[route.name]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Tabs declaration ────────────────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home"      options={{ title: 'Home' }} />
      <Tabs.Screen name="cycle"     options={{ title: 'Cycle' }} />
      <Tabs.Screen name="health"    options={{ title: 'Log' }} />
      <Tabs.Screen name="education" options={{ title: 'Learn' }} />
      <Tabs.Screen name="profile"   options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 32,
    paddingHorizontal: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    // Floating glass shadow
    shadowColor: '#3F2F4A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  barTint: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 32,
  },
  pill: {
    position: 'absolute',
    top: 6, bottom: 6,
    left: 0,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#3F2F4A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  pillHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: '55%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
    borderRadius: 26,
  },
  tabLabel: {
    fontFamily: FontFamily.displayItalic,
    fontSize: 15,
    letterSpacing: 0.1,
  },
});
