import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { ChatWidget } from '../../components/chat/ChatWidget';
import { Icon, type IconName } from '../../components/ui/Icon';

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={focused ? styles.iconActive : styles.iconInactive}>
      <Icon
        name={name}
        size={focused ? 22 : 20}
        color={focused ? Colors.whiskey : 'rgba(224, 224, 224, 0.45)'}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.forestDark,
            borderTopColor: 'rgba(163, 133, 96, 0.2)',
            borderTopWidth: 1,
            height: 82,
            paddingBottom: 18,
            paddingTop: 8,
          },
          tabBarActiveTintColor: Colors.whiskey,
          tabBarInactiveTintColor: 'rgba(224, 224, 224, 0.45)',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.3,
            fontFamily: 'Jost_600SemiBold',
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
          name="track"
          options={{
            title: 'Track',
            tabBarIcon: ({ focused }) => <TabIcon name="droplets" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: 'Insights',
            tabBarIcon: ({ focused }) => <TabIcon name="bar-chart" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="education"
          options={{
            title: 'Learn',
            tabBarIcon: ({ focused }) => <TabIcon name="book-open" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => <TabIcon name="user" focused={focused} />,
          }}
        />
      </Tabs>

      {/* Global floating chat widget — overlays all tabs */}
      <ChatWidget />
    </View>
  );
}

const styles = StyleSheet.create({
  iconActive: {
    backgroundColor: 'rgba(163, 133, 96, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  iconInactive: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
