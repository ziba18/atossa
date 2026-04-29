import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Icon, type IconName } from '../../components/ui/Icon';
import { Colors } from '../../constants/colors';
import { useColors } from '../../contexts/ThemeContext';

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  const theme = useColors();
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Icon
        name={name}
        size={20}
        color={focused ? theme.cherry : theme.textMuted}
        strokeWidth={focused ? 2.2 : 1.8}
      />
    </View>
  );
}

export default function TabsLayout() {
  const theme = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: theme.surface + 'ED', borderColor: theme.border }],
        tabBarActiveTintColor: theme.cherry,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="house" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cycle"
        options={{
          title: 'Cycle',
          tabBarIcon: ({ focused }) => <TabIcon name="droplets" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Log',
          tabBarIcon: ({ focused }) => <TabIcon name="heart" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="education"
        options={{
          title: 'Learn',
          tabBarIcon: ({ focused }) => <TabIcon name="book-open" focused={focused} />,
        }}
      />
      <Tabs.Screen name="track"    options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen name="insights" options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen name="profile"  options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    height: 68,
    borderRadius: 28,
    borderTopWidth: 0,
    backgroundColor: 'rgba(250,248,242,0.93)',
    borderWidth: 1,
    borderColor: 'rgba(51,50,68,0.08)',
    // Shadow
    shadowColor: '#333244',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
    paddingTop: 8,
    paddingBottom: 10,
  } as any,
  tabLabel: {
    fontSize: 10,
    fontFamily: 'Jost_500Medium',
    letterSpacing: 0.2,
    marginTop: -2,
  },
  tabItem: {
    paddingTop: 4,
  },
  iconPill: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: 'rgba(78,158,90,0.14)',
  },
});
