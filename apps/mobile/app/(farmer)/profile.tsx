import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { VERIFICATION_BADGES } from '@/constants';
import SignOutDialog from '@/components/SignOutDialog';

export default function FarmerProfileScreen() {
  const { user, farmerProfile, signOut } = useAuthStore();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const doSignOut = () => {
    // Navigate FIRST so the screen unmounts (taking the dialog with it) — no animation lag
    router.replace('/(auth)/welcome');
    void signOut();
  };

  return (
    <>
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-brand-700 pt-14 pb-8 px-5 items-center">
        <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-3">
          <Text className="text-5xl">🧑‍🌾</Text>
        </View>
        <Text className="text-white text-xl font-bold">{user?.full_name}</Text>
        <View className="bg-white/15 rounded-full px-3 py-1 mt-1.5">
          <Text className="text-white text-xs font-bold">🧑‍🌾 Farmer Account</Text>
        </View>
        {user?.email && <Text className="text-brand-300 text-xs mt-2">{user.email}</Text>}
        <Text className="text-brand-300 mt-1">{user?.phone}</Text>
        {farmerProfile?.state && (
          <Text className="text-brand-300 text-sm mt-1">
            📍 {farmerProfile.village ? `${farmerProfile.village}, ` : ''}{farmerProfile.district}, {farmerProfile.state}
          </Text>
        )}

        {/* KYC status */}
        <View className={`mt-3 rounded-full px-4 py-1.5 ${farmerProfile?.kyc_status === 'approved' ? 'bg-white/20' : 'bg-amber-500/30'}`}>
          <Text className="text-white text-sm font-semibold">
            {farmerProfile?.kyc_status === 'approved' ? '✅ KYC Verified' :
             farmerProfile?.kyc_status === 'under_review' ? '⏳ KYC Under Review' : '⚠️ KYC Pending'}
          </Text>
        </View>
      </View>

      <View className="px-5 pt-5 gap-4">
        {/* Badges */}
        {(farmerProfile?.verification_badges ?? []).length > 0 && (
          <View className="bg-white rounded-3xl p-5">
            <Text className="font-bold text-gray-900 mb-3">Verification Badges</Text>
            <View className="flex-row flex-wrap gap-2">
              {farmerProfile?.verification_badges?.map((key) => {
                const badge = VERIFICATION_BADGES.find((b) => b.key === key);
                return badge ? (
                  <View key={key} className="flex-row items-center gap-1.5 bg-brand-50 border border-brand-200 rounded-full px-3 py-1.5">
                    <Text className="text-brand-600 text-xs">✓</Text>
                    <Text className="text-brand-700 text-xs font-semibold">{badge.label}</Text>
                  </View>
                ) : null;
              })}
            </View>
          </View>
        )}

        {/* Stats */}
        <View className="flex-row gap-3">
          <StatBox icon="🌾" label="Completed" value={String(farmerProfile?.completed_orders ?? 0)} />
          <StatBox icon="⭐" label="Rating" value={farmerProfile?.avg_rating ? farmerProfile.avg_rating.toFixed(1) : '—'} />
          <StatBox icon="📦" label="Listings" value={String(farmerProfile?.total_listings ?? 0)} />
        </View>

        {/* Menu */}
        <View className="bg-white rounded-3xl overflow-hidden">
          <MenuItem icon="🌾" label="My Crops" onPress={() => router.push('/(farmer)/listings')} />
          <MenuItem icon="📦" label="Orders" onPress={() => router.push('/(farmer)/orders')} />
          <MenuItem icon="🪪" label="Update KYC Documents" onPress={() => router.push('/(auth)/farmer-kyc')} />
          <MenuItem icon="🔔" label="Notifications" onPress={() => {}} />
          <MenuItem icon="💬" label="Support" onPress={() => {}} />
        </View>

        <View className="bg-white rounded-3xl overflow-hidden">
          <MenuItem icon="📜" label="Terms of Service" onPress={() => {}} />
          <MenuItem icon="🔒" label="Privacy Policy" onPress={() => {}} />
        </View>

        <Pressable onPress={() => setConfirmOpen(true)} className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center">
          <Text className="text-red-600 font-semibold">Sign Out</Text>
        </Pressable>

        <Text className="text-center text-gray-400 text-xs pb-4">Krishi Mitra v1.0.0</Text>
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
    <Pressable onPress={onPress} className="flex-row items-center gap-3 px-5 py-4 border-b border-gray-50 active:bg-gray-50">
      <Text className="text-xl w-7">{icon}</Text>
      <Text className="text-gray-800 flex-1">{label}</Text>
      <Text className="text-gray-300">›</Text>
    </Pressable>
  );
}
