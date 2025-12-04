import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../src/components/CustomTabBar';
import { THEME } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: THEME.colors.background,
        },
        headerTintColor: THEME.colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profiles"
        options={{
          title: 'Profiles',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
