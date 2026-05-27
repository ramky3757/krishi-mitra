import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { COLORS } from '@/constants';
import RoleGuard from '@/components/RoleGuard';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function AdminLayout() {
  return (
    <RoleGuard allow={['admin']}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          paddingTop: 4,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="listings" options={{ title: 'Listings', tabBarIcon: ({ focused }) => <TabIcon emoji="🌾" focused={focused} /> }} />
      <Tabs.Screen name="kyc" options={{ title: 'KYC', tabBarIcon: ({ focused }) => <TabIcon emoji="🪪" focused={focused} /> }} />
      <Tabs.Screen name="users" options={{ title: 'Users', tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon emoji="🛡️" focused={focused} /> }} />
      <Tabs.Screen name="listing/[id]" options={{ href: null }} />
    </Tabs>
    </RoleGuard>
  );
}
