import { Tabs } from 'expo-router';
import { Activity, Settings, Car } from '@tamagui/lucide-icons';
import { useTheme } from 'tamagui';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.color?.val || '#000',
        tabBarInactiveTintColor: theme.colorPress?.val || '#666',
        tabBarStyle: {
          backgroundColor: theme.background?.val || '#fff',
          borderTopColor: theme.borderColor?.val || '#e5e5e5',
        },
        headerStyle: {
          backgroundColor: theme.background?.val || '#fff',
        },
        headerTintColor: theme.color?.val || '#000',
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