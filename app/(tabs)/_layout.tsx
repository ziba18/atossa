import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Icon, type IconName } from '../../components/ui/Icon';

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={styles.iconWrapper}>
      <View style={focused ? styles.iconActive : styles.iconInactive}>
        <Icon
          name={name}
          size={focused ? 22 : 20}
          color={focused ? Colors.cherry : 'rgba(160, 144, 128, 0.55)'}
        />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: 'rgba(180, 150, 140, 0.18)',
            borderTopWidth: 1,
            height: 82,
            paddingBottom: 18,
            paddingTop: 8,
          },
          tabBarActiveTintColor: Colors.cherry,
          tabBarInactiveTintColor: 'rgba(160, 144, 128, 0.55)',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.3,
            fontFamily: 'Jost_600SemiBold',
          },
          tabBarIconStyle: {
            alignItems: 'center',
            justifyContent: 'center',
          },
          tabBarItemStyle: {
            alignItems: 'center',
            justifyContent: 'center',
          },
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
            title: 'Health Log',
            tabBarIcon: ({ focused }) => <TabIcon name="clipboard-list" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="education"
          options={{
            title: 'Learn',
            tabBarIcon: ({ focused }) => <TabIcon name="book-open" focused={focused} />,
          }}
        />
        {/* Hidden routes — display:none removes them from tab bar layout entirely */}
        <Tabs.Screen name="track"    options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tabs.Screen name="insights" options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        <Tabs.Screen name="profile"  options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: {
    backgroundColor: 'rgba(199, 110, 114, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInactive: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
