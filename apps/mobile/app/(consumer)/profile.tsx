import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function ConsumerProfileScreen() {
  const { user, consumerProfile, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-brand-700 pt-14 pb-8 px-5 items-center">
        <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-3">
          <Text className="text-4xl">👤</Text>
        </View>
        <Text className="text-white text-xl font-bold">{user?.full_name}</Text>
        <Text className="text-brand-300 mt-0.5">{user?.phone}</Text>
        {consumerProfile?.state && (
          <Text className="text-brand-300 text-sm mt-1">
            📍 {consumerProfile.district ? `${consumerProfile.district}, ` : ''}{consumerProfile.state}
          </Text>
        )}
      </View>

      <View className="px-5 pt-5 gap-4">
        {/* Quick stats */}
        <View className="flex-row gap-3">
          <StatBox icon="📦" label="Bookings" value="—" />
          <StatBox icon="🚜" label="Farm Visits" value="—" />
          <StatBox icon="⭐" label="Reviews" value="—" />
        </View>

        {/* Menu items */}
        <View className="bg-white rounded-3xl overflow-hidden">
          <MenuItem icon="📦" label="My Bookings" onPress={() => router.push('/(consumer)/bookings')} />
          <MenuItem icon="🔔" label="Notifications" onPress={() => {}} />
          <MenuItem icon="📍" label="Delivery Addresses" onPress={() => {}} />
          <MenuItem icon="💬" label="Support" onPress={() => {}} />
          <MenuItem icon="⚙️" label="Account Settings" onPress={() => {}} />
        </View>

        <View className="bg-white rounded-3xl overflow-hidden">
          <MenuItem icon="📜" label="Terms of Service" onPress={() => {}} />
          <MenuItem icon="🔒" label="Privacy Policy" onPress={() => {}} />
        </View>

        <Pressable
          onPress={handleSignOut}
          className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center"
        >
          <Text className="text-red-600 font-semibold">Sign Out</Text>
        </Pressable>

        <Text className="text-center text-gray-400 text-xs pb-4">HarvestBond v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

function StatBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 items-center">
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text className="text-gray-900 font-bold text-lg">{value}</Text>
      <Text className="text-gray-400 text-xs">{label}</Text>
    </View>
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
