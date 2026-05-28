import { View, Text, Pressable, Image } from 'react-native';
import { CropListing } from '@/types';
import { formatCurrency, formatWeight } from '@/lib/formatters';
import { CROP_CATEGORIES, FARMING_METHODS } from '@/constants';
import { daysToHarvest } from '@/components/DateField';
import { STAGE_LABELS, type CropStage } from '@/lib/pricing';
import { useWishlist } from '@/lib/wishlist';

interface Props {
  listing: CropListing;
  onPress: () => void;
  compact?: boolean;
}

export function CropListingCard({ listing, onPress, compact = false }: Props) {
  const category = CROP_CATEGORIES.find((c) => c.value === listing.crop_category);
  const method = FARMING_METHODS.find((m) => m.value === listing.farming_method);
  const heroImage = listing.media?.[0]?.url;
  const totalAvail = listing.available_qty_kg ?? 0;
  const booked = listing.booked_qty_kg ?? 0;
  const remaining = Math.max(0, totalAvail - booked);
  const soldPct = totalAvail > 0 ? Math.round((booked / totalAvail) * 100) : 0;
  const stage = (((listing as any).crop_stage ?? 'pre_sowing') as CropStage);
  const stageInfo = STAGE_LABELS[stage];
  const harvestStr = daysToHarvest(listing.harvest_date);
  const isOrganic = listing.farming_method === 'organic';
  const isZeroPesticide = (listing as any).is_zero_pesticide;
  const isVerified = (listing as any).farmer?.farmer_profile?.kyc_status === 'approved';
  const lowStock = totalAvail > 0 && remaining / totalAvail < 0.2;

  const { saved, toggle } = useWishlist(listing.id);

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-3xl overflow-hidden mb-4 active:opacity-90"
      style={{
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
      }}
    >
      {/* Hero image */}
      <View className="h-44 bg-brand-100 items-center justify-center">
        {heroImage ? (
          <Image source={{ uri: heroImage }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Text className="text-6xl">{category?.emoji ?? '🌿'}</Text>
        )}

        {/* Top-left badges */}
        <View className="absolute top-3 left-3 flex-row gap-1.5">
          {isOrganic && (
            <View className="bg-brand-700 rounded-full px-2.5 py-1">
              <Text className="text-white text-[10px] font-bold">🌿 Organic</Text>
            </View>
          )}
          {isZeroPesticide && (
            <View className="bg-white/95 rounded-full px-2.5 py-1">
              <Text className="text-brand-700 text-[10px] font-bold">Zero Pesticide</Text>
            </View>
          )}
        </View>

        {/* Wishlist heart */}
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); toggle(); }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 items-center justify-center"
          style={{ elevation: 1 }}
        >
          <Text className="text-lg">{saved ? '❤️' : '🤍'}</Text>
        </Pressable>

        {/* Low stock urgency */}
        {lowStock && (
          <View className="absolute bottom-3 left-3 bg-red-600 rounded-full px-2.5 py-1">
            <Text className="text-white text-[10px] font-bold">🔥 Only {formatWeight(remaining)} left</Text>
          </View>
        )}

        {/* Stage chip */}
        <View className="absolute bottom-3 right-3 bg-white/95 rounded-full px-2.5 py-1 flex-row items-center gap-1">
          <Text className="text-xs">{stageInfo.emoji}</Text>
          <Text className="text-gray-800 text-[10px] font-bold">{stageInfo.label}</Text>
        </View>
      </View>

      {/* Content */}
      <View className="p-4">
        {/* Title row */}
        <View className="flex-row items-start justify-between mb-1">
          <Text className="text-gray-900 font-bold text-base flex-1 mr-2" numberOfLines={1}>
            {listing.crop_name}
            {listing.crop_variety ? ` · ${listing.crop_variety}` : ''}
          </Text>
          <Text className="text-brand-700 font-bold text-base">
            {formatCurrency(listing.price_per_kg_final)}/kg
          </Text>
        </View>

        <Text className="text-gray-500 text-xs mb-3">
          📍 {(listing as any).village ? `${(listing as any).village}, ` : ''}{listing.district}, {listing.state}
        </Text>

        {/* Farmer row */}
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-7 h-7 rounded-full bg-brand-200 items-center justify-center">
            <Text className="text-xs">🧑‍🌾</Text>
          </View>
          <Text className="text-gray-700 text-sm font-medium flex-1" numberOfLines={1}>
            {(listing as any).farmer?.full_name ?? 'Verified Farmer'}
          </Text>
          {isVerified && (
            <View className="bg-brand-50 border border-brand-200 rounded-full px-2 py-0.5 flex-row items-center gap-1">
              <Text className="text-brand-700 text-[10px] font-bold">✓ Verified</Text>
            </View>
          )}
        </View>

        {/* Info chips */}
        <View className="flex-row gap-1.5 mb-3 flex-wrap">
          <StatChip icon="⚖️" label={`${formatWeight(remaining)} left`} />
          {harvestStr && <StatChip icon="🗓️" label={harvestStr} />}
          {method && <StatChip icon="🌿" label={method.label} />}
        </View>

        {/* Social proof — booked count */}
        {booked > 0 && (
          <View className="mb-3">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-700 text-xs font-semibold">
                🔥 {formatWeight(booked)} already booked
              </Text>
              <Text className="text-gray-400 text-[10px]">{soldPct}% sold</Text>
            </View>
            <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full bg-brand-500 rounded-full"
                style={{ width: `${soldPct}%` }}
              />
            </View>
          </View>
        )}

        {/* CTA */}
        {!compact && (
          <View className="bg-brand-700 rounded-xl py-2.5 items-center">
            <Text className="text-white font-semibold text-sm">
              {(() => {
                const stagePct: Record<string, number> = {
                  pre_sowing: 20, sowed: 30, growing: 40, pre_harvest: 60, ready_now: 100,
                };
                const pct = stagePct[stage] ?? 30;
                const perKg = Math.ceil((listing.price_per_kg_final * pct) / 100);
                if (pct === 100) return `Buy now ${formatCurrency(listing.price_per_kg_final)}/kg →`;
                return `Pre-book with ${pct}% advance · ${formatCurrency(perKg)}/kg →`;
              })()}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function StatChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5">
      <Text className="text-[11px]">{icon}</Text>
      <Text className="text-gray-700 text-[11px] font-medium">{label}</Text>
    </View>
  );
}
