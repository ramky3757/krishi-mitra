import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import SignOutDialog from '@/components/SignOutDialog';

export default function AdminProfileScreen() {
  const { user, signOut } = useAuthStore();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const doSignOut = () => {
    router.replace('/(auth)/welcome');
    void signOut();
  };

  return (
    <>
      <ScrollView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-brand-700 pt-14 pb-8 px-5 items-center">
          <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-3">
            <Text className="text-5xl">🛡️</Text>
          </View>
          <Text className="text-white text-xl font-bold">{user?.full_name}</Text>
          <Text className="text-brand-300 mt-0.5">{user?.email ?? user?.phone}</Text>
          <View className="mt-3 rounded-full bg-white/20 px-4 py-1.5">
            <Text className="text-white text-sm font-semibold">⚙️ Platform Administrator</Text>
          </View>
        </View>

        <View className="px-5 pt-5 gap-4">
          {/* Quick nav */}
          <View className="bg-white rounded-3xl overflow-hidden">
            <MenuItem icon="🌾" label="Listing Approvals" onPress={() => router.push('/(admin)/listings')} />
            <MenuItem icon="🪪" label="KYC Review" onPress={() => router.push('/(admin)/kyc')} />
            <MenuItem icon="👥" label="Users" onPress={() => router.push('/(admin)/users')} />
          </View>

          <View className="bg-white rounded-3xl overflow-hidden">
            <MenuItem icon="📜" label="Terms of Service" onPress={() => {}} />
            <MenuItem icon="🔒" label="Privacy Policy" onPress={() => {}} />
          </View>

          <Pressable
            onPress={() => setConfirmOpen(true)}
            className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center"
          >
            <Text className="text-red-600 font-semibold">Sign Out</Text>
          </Pressable>

          <Text className="text-center text-gray-400 text-xs pb-4">Krishi Mitra v1.0.0 · Admin</Text>
        </View>
      </ScrollView>

      <SignOutDialog
        visible={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={doSignOut}
      />
    </>
  );
}

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-5 py-4 border-b border-gray-50 active:bg-gray-50"
    >
      <Text className="text-xl w-7">{icon}</Text>
      <Text className="text-gray-800 flex-1">{label}</Text>
      <Text className="text-gray-300">›</Text>
    </Pressable>
  );
}
