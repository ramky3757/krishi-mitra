import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatWeight } from '@/lib/formatters';

interface DashboardStats {
  activeListings: number;
  pendingBookings: number;
  totalEarned: number;
  totalKgBooked: number;
}

export default function FarmerDashboard() {
  const { user, farmerProfile } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({ activeListings: 0, pendingBookings: 0, totalEarned: 0, totalKgBooked: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [listingsRes, bookingsRes] = await Promise.all([
        supabase.from('crop_listings').select('id, status').eq('farmer_id', user.id),
        supabase.from('bookings')
          .select('*, listing:crop_listings!inner(farmer_id), consumer:consumer_profiles(*, user:users(*))')
          .eq('listing.farmer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const listings = listingsRes.data ?? [];
      const bookings = bookingsRes.data ?? [];

      const activeListings = listings.filter((l) => l.status === 'active').length;
      const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;
      const totalEarned = bookings
        .filter((b: any) => ['delivered'].includes(b.status))
        .reduce((sum: number, b: any) => sum + (b.total_amount ?? 0), 0);
      const totalKgBooked = bookings.reduce((sum: number, b: any) => sum + (b.qty_kg ?? 0), 0);

      setStats({ activeListings, pendingBookings, totalEarned, totalKgBooked });
      setRecentBookings(bookings.slice(0, 5));
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
        <Text className="text-brand-300 text-sm mt-1">
          {farmerProfile?.village ? `${farmerProfile.village}, ` : ''}
          {farmerProfile?.district}, {farmerProfile?.state}
        </Text>
      </View>

      <View className="px-5 -mt-4 gap-4">
        {/* KYC status banner */}
        {!isKycApproved && (
          <View className={`rounded-3xl p-4 border ${kycStatus === 'under_review' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <Text className={`font-bold ${kycStatus === 'under_review' ? 'text-amber-800' : 'text-red-700'}`}>
              {kycStatus === 'under_review' ? '⏳ KYC Under Review' : '⚠️ KYC Not Approved'}
            </Text>
            <Text className={`text-sm mt-1 ${kycStatus === 'under_review' ? 'text-amber-700' : 'text-red-600'}`}>
              {kycStatus === 'under_review'
                ? 'Your documents are being verified. You\'ll be notified within 24–48 hours.'
                : 'Please complete your KYC verification to start listing crops.'}
            </Text>
          </View>
        )}

        {/* Stats grid */}
        {isLoading ? (
          <ActivityIndicator color="#1a6b3c" size="large" className="py-8" />
        ) : (
          <View className="flex-row flex-wrap gap-3">
            <StatCard icon="🌾" label="Active Listings" value={String(stats.activeListings)} color="green" />
            <StatCard icon="📬" label="Pending Orders" value={String(stats.pendingBookings)} color="amber" />
            <StatCard icon="📦" label="Total Booked" value={formatWeight(stats.totalKgBooked)} color="blue" />
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
            <ActionButton emoji="📦" label="View Orders" onPress={() => router.push('/(farmer)/orders')} />
            <ActionButton emoji="🌾" label="My Crops" onPress={() => router.push('/(farmer)/listings')} />
          </View>
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
                      {b.consumer?.user?.full_name ?? 'Consumer'}
                    </Text>
                    <Text className="text-gray-400 text-xs">{formatWeight(b.qty_kg)} · {b.status}</Text>
                  </View>
                  <Text className="text-brand-700 font-semibold text-sm">{formatCurrency(b.advance_amount)}</Text>
                </Pressable>
              ))}
            </View>
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
