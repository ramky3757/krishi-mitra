import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { COLORS } from '@/constants';
import RoleGuard from '@/components/RoleGuard';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function ConsumerLayout() {
  return (
    <RoleGuard allow={['consumer']}>
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
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏡" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" label="Browse" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'My Orders',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Orders" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
        }}
      />
      <Tabs.Screen name="listing/[id]" options={{ href: null }} />
      <Tabs.Screen name="booking/[id]" options={{ href: null }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
    </Tabs>
    </RoleGuard>
  );
}
