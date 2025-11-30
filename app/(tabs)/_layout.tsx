import { Tabs } from 'expo-router';
import { Activity, Settings, Car } from 'lucide-react-native';
import { Platform } from 'react-native';
import { BlurView } from 'expo-blur';

// Charcoal + Electric Blue theme colors
const THEME = {
  background: '#0a0a0f',
  surface: 'rgba(17, 17, 23, 0.85)',
  primary: '#3b82f6',
  text: '#fafafa',
  textMuted: '#737373',
  border: 'rgba(59, 130, 246, 0.2)',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: THEME.primary,
        tabBarInactiveTintColor: THEME.textMuted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'web' ? THEME.surface : 'transparent',
          borderTopColor: THEME.border,
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS !== 'web' ? (
            <BlurView
              intensity={40}
              tint="dark"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(10, 10, 15, 0.7)',
              }}
            />
          ) : null,
        headerStyle: {
          backgroundColor: THEME.background,
        },
        headerTintColor: THEME.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Level',
          tabBarIcon: ({ color, size }) => <Activity size={size} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profiles"
        options={{
          title: 'Profiles',
          tabBarIcon: ({ color, size }) => <Car size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}