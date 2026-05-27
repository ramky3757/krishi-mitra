import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { session, user } = useAuthStore();

  // Not authenticated — go to welcome
  if (!session) return <Redirect href="/(auth)/welcome" />;

  // Authenticated but profile still hydrating after OTP/Google sign-in.
  // Show a brief spinner instead of flashing role-select.
  if (session && !user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1a6b3c" size="large" />
      </View>
    );
  }

  // Profile loaded but no role yet — go through role selection
  if (!user?.role) return <Redirect href="/(auth)/role-select" />;

  // Role-based routing
  if (user.role === 'farmer') return <Redirect href="/(farmer)/dashboard" />;
  if (user.role === 'admin') return <Redirect href="/(admin)/listings" />;
  return <Redirect href="/(consumer)/home" />;
}
