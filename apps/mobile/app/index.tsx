import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { session, user } = useAuthStore();

  if (!session) return <Redirect href="/(auth)/welcome" />;
  if (!user?.role) return <Redirect href="/(auth)/role-select" />;
  if (user.role === 'farmer') return <Redirect href="/(farmer)/dashboard" />;
  if (user.role === 'admin') return <Redirect href="/(admin)/listings" />;
  return <Redirect href="/(consumer)/home" />;
}
