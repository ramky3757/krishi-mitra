import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatWeight, formatDate } from '@/lib/formatters';
import { CROP_CATEGORIES } from '@/constants';
import { CropListing } from '@/types';

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600' },
  pending_approval: { label: 'Under Review', bg: 'bg-amber-100', text: 'text-amber-700' },
  active: { label: 'Active', bg: 'bg-brand-100', text: 'text-brand-700' },
  fully_booked: { label: 'Fully Booked', bg: 'bg-blue-100', text: 'text-blue-700' },
  harvested: { label: 'Harvested', bg: 'bg-teal-100', text: 'text-teal-700' },
  completed: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-600' },
};

export default function FarmerListingsScreen() {
  const { user } = useAuthStore();
  const [listings, setListings] = useState<CropListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadListings = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('crop_listings')
      .select('*, media:listing_media(*)')
      .eq('farmer_id', user.id)
      .order('created_at', { ascending: false });
    setListings(data ?? []);
    setIsLoading(false);
  };

  useEffect(() => { if (user?.id) loadListings(); }, [user?.id]);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-gray-900">My Crops</Text>
          <Text className="text-gray-500 text-sm">{listings.length} listing{listings.length !== 1 ? 's' : ''}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(farmer)/create-listing')}
          className="bg-brand-700 rounded-2xl px-4 py-2.5"
        >
          <Text className="text-white font-semibold text-sm">+ New Listing</Text>
        </Pressable>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshing={isLoading}
        onRefresh={loadListings}
        renderItem={({ item }) => <FarmerListingCard listing={item} onPress={() => router.push(`/(farmer)/listing/${item.id}`)} />}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-16">
              <Text className="text-5xl mb-3">🌾</Text>
              <Text className="text-gray-700 font-semibold text-lg">No listings yet</Text>
              <Text className="text-gray-400 text-sm mt-1 text-center">Post your first crop to start receiving bookings</Text>
              <Pressable
                onPress={() => router.push('/(farmer)/create-listing')}
                className="mt-5 bg-brand-700 rounded-2xl px-6 py-3"
              >
                <Text className="text-white font-bold">Post a Crop</Text>
              </Pressable>
            </View>
          ) : <ActivityIndicator color="#1a6b3c" size="large" className="py-10" />
        }
      />
    </View>
  );
}

function FarmerListingCard({ listing, onPress }: { listing: CropListing; onPress: () => void }) {
  const category = CROP_CATEGORIES.find((c) => c.value === listing.crop_category);
  const statusInfo = STATUS_LABELS[listing.status] ?? STATUS_LABELS.draft;
  const soldPct = listing.available_qty_kg > 0
    ? Math.round(((listing.booked_qty_kg ?? 0) / listing.available_qty_kg) * 100)
    : 0;

  return (
    <Pressable onPress={onPress} className="bg-white rounded-3xl p-5 mb-4 active:opacity-90" style={{ elevation: 1 }}>
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center gap-2 flex-1">
          <Text className="text-3xl">{category?.emoji ?? '🌿'}</Text>
          <View className="flex-1">
            <Text className="font-bold text-gray-900 text-base">{listing.crop_name}</Text>
            <Text className="text-gray-500 text-sm">{listing.district}, {listing.state}</Text>
          </View>
        </View>
        <View className={`${statusInfo.bg} rounded-full px-3 py-1`}>
          <Text className={`${statusInfo.text} text-xs font-semibold`}>{statusInfo.label}</Text>
        </View>
      </View>

      <View className="flex-row gap-4 mb-3">
        <InfoPill icon="⚖️" text={`${formatWeight(listing.available_qty_kg)} available`} />
        <InfoPill icon="💰" text={`${formatCurrency(listing.price_per_kg_final)}/kg`} />
        <InfoPill icon="🗓️" text={formatDate(listing.harvest_date)} />
      </View>

      {/* Booking progress */}
      <View>
        <View className="flex-row justify-between mb-1">
          <Text className="text-gray-500 text-xs">{soldPct}% booked</Text>
          <Text className="text-gray-500 text-xs">{formatWeight(listing.booked_qty_kg ?? 0)} / {formatWeight(listing.available_qty_kg)}</Text>
        </View>
        <View className="h-2 bg-gray-100 rounded-full">
          <View className="h-full bg-brand-500 rounded-full" style={{ width: `${soldPct}%` }} />
        </View>
      </View>
    </Pressable>
  );
}

function InfoPill({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row items-center gap-1 bg-gray-50 rounded-full px-2.5 py-1">
      <Text className="text-xs">{icon}</Text>
      <Text className="text-gray-600 text-xs">{text}</Text>
    </View>
  );
}
