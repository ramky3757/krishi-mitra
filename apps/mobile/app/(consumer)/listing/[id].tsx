import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useListingsStore } from '@/stores/listingsStore';
import { formatCurrency, formatWeight, formatDate, formatRelativeDate } from '@/lib/formatters';
import { CROP_CATEGORIES, FARMING_METHODS, CROP_MILESTONES, VERIFICATION_BADGES } from '@/constants';
import { CropMilestone } from '@/types';

const { width } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedListing, fetchListingById, isLoading } = useListingsStore();
  const [activeTab, setActiveTab] = useState<'details' | 'farmer' | 'progress'>('details');

  useEffect(() => {
    fetchListingById(id);
  }, [id]);

  if (isLoading || !selectedListing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1a6b3c" size="large" />
      </View>
    );
  }

  const listing = selectedListing;
  const category = CROP_CATEGORIES.find((c) => c.value === listing.crop_category);
  const method = FARMING_METHODS.find((m) => m.value === listing.farming_method);
  const remainingQty = listing.available_qty_kg - (listing.booked_qty_kg ?? 0);
  const advancePerKg = listing.price_per_kg_advance;

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View className="relative">
          <View className="h-72 bg-brand-100 items-center justify-center">
            {listing.media?.[0]?.url ? (
              <Image source={{ uri: listing.media[0].url }} style={{ width, height: 288 }} resizeMode="cover" />
            ) : (
              <Text className="text-8xl">{category?.emoji}</Text>
            )}
          </View>
          <Pressable
            onPress={() => router.back()}
            className="absolute top-12 left-4 w-10 h-10 bg-black/40 rounded-full items-center justify-center"
          >
            <Text className="text-white text-lg">←</Text>
          </Pressable>
        </View>

        {/* Title section */}
        <View className="px-5 pt-5">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-3">
              <Text className="text-2xl font-bold text-gray-900">
                {listing.crop_name}
                {listing.crop_variety ? ` · ${listing.crop_variety}` : ''}
              </Text>
              <Text className="text-gray-500 mt-1">
                📍 {listing.village ? `${listing.village}, ` : ''}{listing.district}, {listing.state}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-brand-700">
                {formatCurrency(listing.price_per_kg_final)}
              </Text>
              <Text className="text-gray-400 text-sm">per kg</Text>
            </View>
          </View>

          {/* Tags */}
          <View className="flex-row flex-wrap gap-2 mt-3">
            <Tag emoji={category?.emoji ?? '🌿'} label={category?.label ?? 'Crop'} color="green" />
            <Tag emoji="🌿" label={method?.label ?? listing.farming_method} color="teal" />
            {listing.is_zero_pesticide && <Tag emoji="✅" label="Zero Pesticide" color="green" />}
            {listing.farming_method === 'organic' && <Tag emoji="🏅" label="Organic" color="green" />}
          </View>

          {/* Stock bar */}
          <View className="mt-4 bg-gray-50 rounded-2xl p-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 text-sm">Availability</Text>
              <Text className="font-semibold text-gray-900">{formatWeight(remainingQty)} left</Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full">
              <View
                className="h-full bg-brand-500 rounded-full"
                style={{ width: `${(remainingQty / listing.available_qty_kg) * 100}%` }}
              />
            </View>
            <Text className="text-gray-400 text-xs mt-1">
              of {formatWeight(listing.available_qty_kg)} available
            </Text>
          </View>

          {/* Key info grid */}
          <View className="flex-row flex-wrap mt-4 gap-3">
            <InfoCard icon="📅" label="Harvest" value={formatDate(listing.harvest_date)} />
            <InfoCard icon="🌱" label="Sown" value={formatDate(listing.sowing_date)} />
            <InfoCard icon="📐" label="Farm Size" value={`${listing.farm_size_acres} acres`} />
            <InfoCard icon="💧" label="Water" value={listing.water_source ?? 'Rain-fed'} />
          </View>
        </View>

        {/* Tab navigation */}
        <View className="flex-row mx-5 mt-5 bg-gray-100 rounded-2xl p-1">
          {(['details', 'farmer', 'progress'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl items-center ${activeTab === tab ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-sm font-semibold capitalize ${activeTab === tab ? 'text-brand-700' : 'text-gray-500'}`}>
                {tab === 'details' ? 'Details' : tab === 'farmer' ? 'Farmer' : 'Progress'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab content */}
        <View className="px-5 pt-4 pb-32">
          {activeTab === 'details' && <DetailsTab listing={listing} method={method} />}
          {activeTab === 'farmer' && <FarmerTab farmer={listing.farmer} />}
          {activeTab === 'progress' && <ProgressTab updates={listing.progress_updates ?? []} />}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 pb-8">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-gray-500 text-xs">Advance payment (25–30%)</Text>
            <Text className="text-brand-700 font-bold text-lg">{formatCurrency(advancePerKg)}/kg</Text>
          </View>
          <View className="items-end">
            <Text className="text-gray-500 text-xs">Final on delivery</Text>
            <Text className="text-gray-700 font-semibold">{formatCurrency(listing.price_per_kg_final - advancePerKg)}/kg</Text>
          </View>
        </View>
        {remainingQty > 0 ? (
          <Pressable
            onPress={() => router.push({ pathname: '/(consumer)/checkout', params: { listingId: listing.id } })}
            className="bg-brand-700 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-bold text-base">Pre-Book Now 🌾</Text>
          </Pressable>
        ) : (
          <View className="bg-gray-200 rounded-2xl py-4 items-center">
            <Text className="text-gray-500 font-bold text-base">Fully Booked</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function DetailsTab({ listing, method }: any) {
  return (
    <View className="gap-4">
      {listing.description && (
        <View>
          <Text className="font-semibold text-gray-800 mb-1.5">About this crop</Text>
          <Text className="text-gray-600 leading-6">{listing.description}</Text>
        </View>
      )}
      <View>
        <Text className="font-semibold text-gray-800 mb-1.5">Farming Method</Text>
        <Text className="text-gray-600">{method?.description}</Text>
      </View>
      {listing.pesticides_info && (
        <View>
          <Text className="font-semibold text-gray-800 mb-1.5">Pesticides / Inputs</Text>
          <Text className="text-gray-600">{listing.pesticides_info}</Text>
        </View>
      )}
      <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <Text className="font-semibold text-amber-800 mb-2">🚜 Farm Visit Included</Text>
        <Text className="text-amber-700 text-sm">
          You can visit this farm up to 2 times during the crop cycle. Schedule your visit through the app after booking.
        </Text>
      </View>
    </View>
  );
}

function FarmerTab({ farmer }: any) {
  if (!farmer) return <Text className="text-gray-500">Farmer info not available</Text>;
  return (
    <View className="gap-4">
      {/* Profile */}
      <View className="flex-row items-center gap-3">
        <View className="w-16 h-16 rounded-full bg-brand-200 items-center justify-center">
          <Text className="text-3xl">🧑‍🌾</Text>
        </View>
        <View className="flex-1">
          <Text className="font-bold text-gray-900 text-lg">{farmer.user?.full_name}</Text>
          <Text className="text-gray-500 text-sm">📍 {farmer.district}, {farmer.state}</Text>
          {farmer.avg_rating > 0 && (
            <View className="flex-row items-center gap-1 mt-1">
              <Text className="text-yellow-500">⭐</Text>
              <Text className="text-gray-700 font-semibold">{farmer.avg_rating.toFixed(1)}</Text>
              <Text className="text-gray-400 text-sm">({farmer.completed_orders} orders)</Text>
            </View>
          )}
        </View>
      </View>

      {/* Badges */}
      {farmer.verification_badges?.length > 0 && (
        <View>
          <Text className="font-semibold text-gray-800 mb-2">Verification</Text>
          <View className="flex-row flex-wrap gap-2">
            {farmer.verification_badges.map((badge: string) => {
              const b = VERIFICATION_BADGES.find((vb) => vb.key === badge);
              return b ? (
                <View key={badge} className="flex-row items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                  <Text className="text-green-600 text-xs">✓</Text>
                  <Text className="text-green-700 text-xs font-semibold">{b.label}</Text>
                </View>
              ) : null;
            })}
          </View>
        </View>
      )}

      {farmer.bio && (
        <View>
          <Text className="font-semibold text-gray-800 mb-1.5">About the Farmer</Text>
          <Text className="text-gray-600 leading-6">{farmer.bio}</Text>
        </View>
      )}
    </View>
  );
}

function ProgressTab({ updates }: { updates: any[] }) {
  if (updates.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-4xl mb-2">🌱</Text>
        <Text className="text-gray-500">No progress updates yet</Text>
        <Text className="text-gray-400 text-sm mt-1">The farmer will post updates as the crop grows</Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {updates.map((update, i) => {
        const milestone = CROP_MILESTONES.find((m) => m.value === update.milestone);
        return (
          <View key={update.id} className="flex-row gap-3">
            <View className="items-center">
              <View className="w-8 h-8 rounded-full bg-brand-700 items-center justify-center">
                <Text className="text-white text-xs font-bold">{i + 1}</Text>
              </View>
              {i < updates.length - 1 && <View className="w-0.5 flex-1 bg-brand-200 mt-1" />}
            </View>
            <View className="flex-1 pb-4">
              <Text className="font-semibold text-gray-900">{milestone?.label ?? update.milestone}</Text>
              <Text className="text-gray-400 text-xs mt-0.5">{formatDate(update.created_at)}</Text>
              {update.note && <Text className="text-gray-600 mt-1.5 leading-5">{update.note}</Text>}
              {update.photo_url && (
                <Image source={{ uri: update.photo_url }} className="w-full h-40 rounded-xl mt-2" resizeMode="cover" />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Tag({ emoji, label, color }: { emoji: string; label: string; color: string }) {
  return (
    <View className="flex-row items-center gap-1.5 bg-brand-50 rounded-full px-3 py-1">
      <Text className="text-xs">{emoji}</Text>
      <Text className="text-brand-700 text-xs font-semibold">{label}</Text>
    </View>
  );
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="bg-gray-50 rounded-2xl p-3 min-w-[40%] flex-1">
      <Text className="text-lg mb-0.5">{icon}</Text>
      <Text className="text-gray-400 text-xs">{label}</Text>
      <Text className="text-gray-900 font-semibold text-sm mt-0.5">{value}</Text>
    </View>
  );
}
