import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatWeight } from '@/lib/formatters';

interface DashboardStats {
  activeListings: number;
  pendingListings: number;
  pendingBookings: number;
  totalEarned: number;
  advanceEarned: number;
  totalKgBooked: number;
}

export default function FarmerDashboard() {
  const { user, farmerProfile } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    activeListings: 0,
    pendingListings: 0,
    pendingBookings: 0,
    totalEarned: 0,
    advanceEarned: 0,
    totalKgBooked: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) loadDashboard();
  }, [user?.id]);

  const loadDashboard = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // Step 1: get this farmer's listings
      const { data: listings } = await supabase
        .from('crop_listings')
        .select('id, status, available_qty_kg, booked_qty_kg')
        .eq('farmer_id', user.id);

      const listingIds = (listings ?? []).map((l) => l.id);

      // Step 2: get bookings for those listings (RLS also enforces this)
      const { data: bookings } = listingIds.length > 0
        ? await supabase
            .from('bookings')
            .select('id, qty_kg, advance_amount, total_amount, farmer_payout, platform_fee_farmer, status, created_at, consumer:users!consumer_id(full_name)')
            .in('listing_id', listingIds)
            .order('created_at', { ascending: false })
            .limit(5)
        : { data: [] };

      const activeListings = (listings ?? []).filter((l) => l.status === 'active').length;
      const pendingListings = (listings ?? []).filter((l) => l.status === 'pending_approval').length;
      const pendingBookings = (bookings ?? []).filter((b: any) => b.status === 'pending').length;

      // Advance received: confirmed + in_progress + harvested + shipped + delivered
      const advanceEarned = (bookings ?? [])
        .filter((b: any) => ['confirmed', 'in_progress', 'harvested', 'shipped', 'delivered'].includes(b.status))
        .reduce((sum: number, b: any) => sum + (b.advance_amount ?? 0), 0);
      // Net payout (after platform fee): shipped + delivered only
      const totalEarned = (bookings ?? [])
        .filter((b: any) => ['shipped', 'delivered'].includes(b.status))
        .reduce((sum: number, b: any) => sum + (b.farmer_payout ?? b.total_amount ?? 0), 0);

      const totalKgBooked = (bookings ?? []).reduce((sum: number, b: any) => sum + (b.qty_kg ?? 0), 0);

      setStats({ activeListings, pendingListings, pendingBookings, totalEarned, advanceEarned, totalKgBooked });
      setRecentBookings((bookings ?? []).slice(0, 5));
    } finally {
      setIsLoading(false);
    }
  };

  const kycStatus = farmerProfile?.kyc_status;
  const isKycApproved = kycStatus === 'approved';

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="bg-brand-700 pt-14 pb-8 px-5">
        <Text className="text-brand-200 text-sm">Welcome back,</Text>
        <Text className="text-white text-2xl font-bold mt-0.5">
          {user?.full_name?.split(' ')[0] ?? 'Farmer'} 🧑‍🌾
        </Text>
        {farmerProfile?.state ? (
          <Text className="text-brand-300 text-sm mt-1">
            {farmerProfile.village ? `${farmerProfile.village}, ` : ''}
            {farmerProfile.district}, {farmerProfile.state}
          </Text>
        ) : null}
      </View>

      <View className="px-5 -mt-4 gap-4">
        {/* KYC status banner */}
        {!isKycApproved && (() => {
          const isPending = kycStatus === 'pending' || kycStatus === 'under_review';
          return (
            <View className={`rounded-3xl p-4 border ${isPending ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
              <Text className={`font-bold ${isPending ? 'text-amber-800' : 'text-red-700'}`}>
                {isPending ? '⏳ KYC Under Review' : '⚠️ KYC Not Approved'}
              </Text>
              <Text className={`text-sm mt-1 ${isPending ? 'text-amber-700' : 'text-red-600'}`}>
                {isPending
                  ? "Your documents are being verified. You'll be notified within 24–48 hours."
                  : 'Complete your KYC verification to start listing crops.'}
              </Text>
              {!isPending && (
                <Pressable
                  onPress={() => router.push('/(auth)/farmer-kyc')}
                  className="mt-3 bg-red-700 rounded-xl py-2 px-4 self-start"
                >
                  <Text className="text-white text-sm font-semibold">Complete KYC →</Text>
                </Pressable>
              )}
            </View>
          );
        })()}

        {/* Stats grid */}
        {isLoading ? (
          <ActivityIndicator color="#1a6b3c" size="large" className="py-8" />
        ) : (
          <View className="flex-row flex-wrap gap-3">
            <StatCard icon="🌾" label="Active Listings" value={String(stats.activeListings)} color="green" />
            <StatCard icon="⏳" label="Pending Approval" value={String(stats.pendingListings)} color="amber" />
            <StatCard icon="📬" label="Pending Orders" value={String(stats.pendingBookings)} color="blue" />
            <StatCard icon="💵" label="Advance Received" value={formatCurrency(stats.advanceEarned)} color="blue" />
            <StatCard icon="💰" label="Total Earned" value={formatCurrency(stats.totalEarned)} color="teal" />
          </View>
        )}

        {/* Quick actions */}
        <View className="bg-white rounded-3xl p-5">
          <Text className="font-bold text-gray-900 mb-4">Quick Actions</Text>
          <View className="flex-row gap-3">
            <ActionButton
              emoji="➕"
              label="Post Crop"
              disabled={!isKycApproved}
              onPress={() => router.push('/(farmer)/create-listing')}
            />
            <ActionButton emoji="📦" label="Orders" onPress={() => router.push('/(farmer)/orders')} />
            <ActionButton emoji="🌾" label="My Crops" onPress={() => router.push('/(farmer)/listings')} />
          </View>
          {!isKycApproved && (
            <Text className="text-gray-400 text-xs text-center mt-3">
              KYC approval required to post crops
            </Text>
          )}
        </View>

        {/* Recent bookings */}
        {recentBookings.length > 0 && (
          <View className="bg-white rounded-3xl p-5">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-bold text-gray-900">Recent Bookings</Text>
              <Pressable onPress={() => router.push('/(farmer)/orders')}>
                <Text className="text-brand-600 text-sm font-medium">See all →</Text>
              </Pressable>
            </View>
            <View className="gap-3">
              {recentBookings.map((b) => (
                <Pressable
                  key={b.id}
                  onPress={() => router.push(`/(farmer)/order/${b.id}`)}
                  className="flex-row items-center gap-3 py-2 border-b border-gray-50 active:opacity-70"
                >
                  <View className="w-10 h-10 rounded-full bg-brand-100 items-center justify-center">
                    <Text className="text-lg">🧑</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800" numberOfLines={1}>
                      {b.consumer?.full_name ?? 'Consumer'}
                    </Text>
                    <Text className="text-gray-400 text-xs">{formatWeight(b.qty_kg)} · {b.status}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-brand-700 font-semibold text-sm">
                      {['shipped', 'delivered'].includes(b.status)
                        ? formatCurrency(b.total_amount)
                        : formatCurrency(b.advance_amount)}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {['shipped', 'delivered'].includes(b.status) ? 'total' : 'advance'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Empty state */}
        {!isLoading && stats.activeListings === 0 && stats.pendingListings === 0 && (
          <View className="bg-white rounded-3xl p-6 items-center">
            <Text className="text-5xl mb-3">🌱</Text>
            <Text className="font-bold text-gray-900 text-base mb-1">No crops listed yet</Text>
            <Text className="text-gray-400 text-sm text-center mb-4">
              Post your first crop listing to start receiving pre-bookings from consumers.
            </Text>
            {isKycApproved && (
              <Pressable
                onPress={() => router.push('/(farmer)/create-listing')}
                className="bg-brand-700 rounded-2xl px-6 py-3"
              >
                <Text className="text-white font-bold">Post Your First Crop</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-brand-50 border-brand-200',
    amber: 'bg-amber-50 border-amber-200',
    blue: 'bg-blue-50 border-blue-200',
    teal: 'bg-teal-50 border-teal-200',
  };
  return (
    <View className={`flex-1 min-w-[45%] border rounded-2xl p-4 ${colors[color] ?? colors.green}`}>
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text className="text-gray-900 font-bold text-lg">{value}</Text>
      <Text className="text-gray-500 text-xs mt-0.5">{label}</Text>
    </View>
  );
}

function ActionButton({ emoji, label, onPress, disabled }: { emoji: string; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-1 items-center py-4 rounded-2xl ${disabled ? 'bg-gray-100' : 'bg-brand-50'} active:opacity-70`}
    >
      <Text className="text-2xl mb-1.5">{emoji}</Text>
      <Text className={`text-xs font-semibold ${disabled ? 'text-gray-400' : 'text-brand-700'}`}>{label}</Text>
    </Pressable>
  );
}
