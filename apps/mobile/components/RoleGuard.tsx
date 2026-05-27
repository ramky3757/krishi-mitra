import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

/**
 * Wrap a route layout/screen to enforce that only users with one of the
 * allowed roles can access it. Anyone else gets bounced to their
 * role-appropriate home, NOT shown the page even briefly.
 *
 * This is the last line of defense against role-mixing: even if a stale URL,
 * a copy-pasted link, or a routing glitch sends an admin into /(farmer), this
 * guard immediately redirects them away.
 */
export default function RoleGuard({
  allow,
  children,
}: {
  allow: Array<'farmer' | 'consumer' | 'admin'>;
  children: React.ReactNode;
}) {
  const { user, session } = useAuthStore();

  useEffect(() => {
    if (!session) {
      router.replace('/(auth)/welcome');
      return;
    }
    if (!user) return; // still hydrating — index spinner will handle it
    if (!user.role) {
      router.replace('/(auth)/role-select');
      return;
    }
    if (!allow.includes(user.role as any)) {
      // Send user to where they belong
      if (user.role === 'admin') router.replace('/(admin)/listings');
      else if (user.role === 'farmer') router.replace('/(farmer)/dashboard');
      else router.replace('/(consumer)/home');
    }
  }, [user?.role, session, allow]);

  // Show spinner until role is resolved + verified
  if (!session || !user || !user.role || !allow.includes(user.role as any)) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1a6b3c" size="large" />
        <Text className="text-gray-400 text-xs mt-3">Checking access…</Text>
      </View>
    );
  }

  return <>{children}</>;
}
