import { View, Text, Pressable, Image } from 'react-native';
import { CropListing } from '@/types';
import { formatCurrency, formatWeight, formatRelativeDate } from '@/lib/formatters';
import { CROP_CATEGORIES, FARMING_METHODS, VERIFICATION_BADGES } from '@/constants';

interface Props {
  listing: CropListing;
  onPress: () => void;
  compact?: boolean;
}

export function CropListingCard({ listing, onPress, compact = false }: Props) {
  const category = CROP_CATEGORIES.find((c) => c.value === listing.crop_category);
  const method = FARMING_METHODS.find((m) => m.value === listing.farming_method);
  const availablePct = Math.round(((listing.available_qty_kg - (listing.booked_qty_kg ?? 0)) / listing.available_qty_kg) * 100);
  const heroImage = listing.media?.[0]?.url;

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-3xl overflow-hidden mb-4 shadow-sm active:opacity-90"
      style={{ elevation: 2 }}
    >
      {/* Hero image */}
      <View className="h-44 bg-brand-100 items-center justify-center">
        {heroImage ? (
          <Image source={{ uri: heroImage }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Text className="text-6xl">{category?.emoji ?? '🌿'}</Text>
        )}

        {/* Organic badge */}
        {listing.farming_method === 'organic' && (
          <View className="absolute top-3 left-3 bg-brand-700 rounded-full px-3 py-1">
            <Text className="text-white text-xs font-bold">🌿 Organic</Text>
          </View>
        )}
        {listing.is_zero_pesticide && (
          <View className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 shadow-sm">
            <Text className="text-brand-700 text-xs font-bold">Zero Pesticide</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="p-4">
        {/* Title & location */}
        <View className="flex-row items-start justify-between mb-1">
          <Text className="text-gray-900 font-bold text-base flex-1 mr-2" numberOfLines={1}>
            {listing.crop_name}
            {listing.crop_variety ? ` (${listing.crop_variety})` : ''}
          </Text>
          <Text className="text-brand-700 font-bold text-base">
            {formatCurrency(listing.price_per_kg_final)}/kg
          </Text>
        </View>

        <Text className="text-gray-500 text-sm mb-3">
          📍 {listing.village ? `${listing.village}, ` : ''}{listing.district}, {listing.state}
        </Text>

        {/* Farmer row */}
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-7 h-7 rounded-full bg-brand-200 items-center justify-center">
            <Text className="text-xs">🧑‍🌾</Text>
          </View>
          <Text className="text-gray-700 text-sm font-medium">
            {listing.farmer?.full_name ?? 'Verified Farmer'}
          </Text>
          {listing.farmer?.farmer_profile?.verification_badges?.includes('id_verified') && (
            <View className="bg-brand-100 rounded-full px-2 py-0.5">
              <Text className="text-brand-700 text-xs font-semibold">✓ Verified</Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3 mb-3">
          <StatChip icon="⚖️" label={formatWeight(listing.available_qty_kg)} />
          <StatChip icon="🗓️" label={`Harvest: ${formatRelativeDate(listing.harvest_date)}`} />
          <StatChip icon="🌿" label={method?.label ?? listing.farming_method} />
        </View>

        {/* Availability bar */}
        <View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-500 text-xs">
              {formatWeight(listing.booked_qty_kg ?? 0)} booked
            </Text>
            <Text className="text-gray-500 text-xs">
              {availablePct}% available
            </Text>
          </View>
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-brand-500 rounded-full"
              style={{ width: `${100 - availablePct}%` }}
            />
          </View>
        </View>

        {/* CTA */}
        {!compact && (
          <View className="mt-4 bg-brand-700 rounded-xl py-2.5 items-center">
            <Text className="text-white font-semibold text-sm">
              Pre-book from {formatCurrency(listing.price_per_kg_advance * listing.advance_percentage / 100)}/kg advance
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function StatChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1 bg-gray-100 rounded-full px-2.5 py-1">
      <Text className="text-xs">{icon}</Text>
      <Text className="text-gray-600 text-xs">{label}</Text>
    </View>
  );
}
