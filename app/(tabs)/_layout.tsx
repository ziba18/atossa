import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, type IconName } from '../../components/ui/Icon';

let BlurView: React.ComponentType<any>;
try {
  BlurView = require('expo-blur').BlurView;
} catch {
  BlurView = ({ style, children }: any) => (
    <View style={[style, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>{children}</View>
  );
}

const LIGHT_BG = 'rgba(247,243,235,0.92)';
const EMERALD = '#3a4d39';
const EMERALD_SOFT = '#e6ede4';
const CREAM = '#f7f3eb';
const INK = '#1c1e1c';
const MUTED = '#7a6e60';

const TAB_ICONS: Record<string, IconName> = {
  chat:      'crow',
  analysis:  'brain',
  dashboard: 'activity',
  report:    'file-text',
  community: 'users',
};
const TAB_LABELS: Record<string, string> = {
  chat: 'Chat', analysis: 'Analyse', dashboard: 'Data', report: 'Report', community: 'People',
};
const VISIBLE_ORDER = ['chat', 'analysis', 'dashboard', 'report', 'community'];

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const layouts = useRef<Record<string, { x: number; width: number }>>({});
  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);
  const activeName = state.routes[state.index]?.name;
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
        <BlurView intensity={24} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: LIGHT_BG, borderRadius: 32 }]} />

        <Animated.View style={[styles.pill, pillStyle]} pointerEvents="none">
          <LinearGradient
            colors={['#4d6b4c', '#3a4d39']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.pillHighlight} />
        </Animated.View>

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
                size={16}
                color={focused ? CREAM : EMERALD}
                strokeWidth={focused ? 2.2 : 1.8}
              />
              <Text style={[styles.tabLabel, { color: focused ? CREAM : INK }]}>
                {TAB_LABELS[route.name]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="chat"      options={{ title: 'Chat' }} />
      <Tabs.Screen name="analysis"  options={{ title: 'Analyse' }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Data' }} />
      <Tabs.Screen name="report"    options={{ title: 'Report' }} />
      <Tabs.Screen name="community" options={{ title: 'People' }} />
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
    borderColor: 'rgba(58,77,57,0.35)',
    shadowColor: '#3a4d39',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  pill: {
    position: 'absolute',
    top: 6, bottom: 6,
    left: 0,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#3a4d39',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pillHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: '55%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    gap: 3,
    borderRadius: 26,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
