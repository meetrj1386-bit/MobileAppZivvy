import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

// Your theme colors
const ACTIVE_COLOR = '#6b5b95';
const INACTIVE_COLOR = 'rgba(62, 56, 88, 0.5)';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: 'rgba(107, 91, 149, 0.1)',
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          height: Platform.OS === 'ios' ? 85 : 70,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
  
  <Tabs.Screen
  name="schedule"
  options={{
    title: 'Schedule',  // This should show "Schedule"
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="calendar" size={22} color={color} />
    ),
  }}
/>

<Tabs.Screen
  name="progress"
  options={{
    title: 'Progress',  // This should show "Progress"
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="trending-up" size={22} color={color} />
    ),
  }}
/>

<Tabs.Screen
  name="reminders"
  options={{
    title: 'Reminders',  // Make sure this says "Reminders"
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="notifications-outline" size={22} color={color} />
    ),
  }}
/>

<Tabs.Screen
  name="settings"
  options={{
    title: 'Settings',  // Make sure this says "Settings"
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="settings-outline" size={22} color={color} />
    ),
  }}
/>

    </Tabs>
  );
}