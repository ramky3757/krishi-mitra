import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useListingsStore } from '@/stores/listingsStore';
import { formatCurrency, formatWeight, formatDate, formatRelativeDate } from '@/lib/formatters';
import { CROP_CATEGORIES, FARMING_METHODS, CROP_MILESTONES, VERIFICATION_BADGES } from '@/constants';
import { CropMilestone } from '@/types';
import { STAGE_LABELS, advancePctForStage, getPlatformConfig, type PlatformConfig, type CropStage } from '@/lib/pricing';

const { width } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedListing, fetchListingById, isLoading } = useListingsStore();
  const [activeTab, setActiveTab] = useState<'details' | 'farmer' | 'progress'>('details');
  const [config, setConfig] = useState<PlatformConfig | null>(null);

  useEffect(() => {
    fetchListingById(id);
    getPlatformConfig().then(setConfig);
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
  const cropStage = ((listing as any).crop_stage ?? 'pre_sowing') as CropStage;
  const stageInfo = STAGE_LABELS[cropStage];
  const advancePct = config ? advancePctForStage(cropStage, config) : 30;
  const advancePerKg = Math.ceil((listing.price_per_kg_final * advancePct) / 100);
  const remainingPerKg = listing.price_per_kg_final - advancePerKg;

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 220 }}>
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
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-base">{stageInfo.emoji}</Text>
            <Text className="text-gray-600 text-xs font-semibold">{stageInfo.label}</Text>
          </View>
          <View className="bg-brand-50 rounded-full px-2.5 py-0.5">
            <Text className="text-brand-700 text-[11px] font-bold">{advancePct}% advance</Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-gray-500 text-xs">Pay now</Text>
            <Text className="text-brand-700 font-bold text-lg">{formatCurrency(advancePerKg)}/kg</Text>
          </View>
          <View className="items-end">
            <Text className="text-gray-500 text-xs">{cropStage === 'ready_now' ? 'Already paid' : 'On delivery'}</Text>
            <Text className="text-gray-700 font-semibold">{cropStage === 'ready_now' ? '—' : `${formatCurrency(remainingPerKg)}/kg`}</Text>
          </View>
        </View>
        {((listing as any).status === 'fully_booked' || remainingQty <= 0) ? (
          <View className="bg-gray-100 border border-gray-200 rounded-2xl py-4 items-center">
            <Text className="text-gray-700 font-bold text-base">📦 Fully Booked</Text>
            <Text className="text-gray-400 text-xs mt-0.5">All quantity reserved by other consumers</Text>
          </View>
        ) : (
          <Pressable
            onPress={() => router.push({ pathname: '/(consumer)/checkout', params: { listingId: listing.id } })}
            className="bg-brand-700 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-bold text-base">Pre-Book Now 🌾</Text>
          </Pressable>
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

const CERT_LABELS: Record<string, string> = {
  organic: '🌿 Organic',
  natural: '🌱 Natural farming',
  pgs_india: '🏛️ PGS India',
  fair_trade: '🤝 Fair Trade',
  msme: '🏭 MSME',
};
const LANG_LABELS: Record<string, string> = {
  hindi: 'हिन्दी', telugu: 'తెలుగు', tamil: 'தமிழ்', kannada: 'ಕನ್ನಡ',
  marathi: 'मराठी', malayalam: 'മലയാളം', gujarati: 'ગુજરાતી',
  punjabi: 'ਪੰਜਾਬੀ', bengali: 'বাংলা', english: 'English',
};

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function FarmerTab({ farmer }: any) {
  if (!farmer) return <Text className="text-gray-500">Farmer info not available</Text>;
  const profile = farmer.farmer_profile ?? {};
  const photo = profile.profile_photo_url;
  const years = profile.years_of_experience;
  const generations = profile.family_lineage_generations;
  const land = profile.land_size_acres;
  const varieties: string[] = profile.crop_varieties ?? [];
  const certs: string[] = profile.farming_certifications ?? [];
  const langs: string[] = profile.languages ?? [];

  return (
    <View className="gap-5">
      {/* Profile header */}
      <View className="flex-row items-center gap-3">
        {photo ? (
          <Image source={{ uri: photo }} className="w-16 h-16 rounded-full" />
        ) : (
          <View className="w-16 h-16 rounded-full bg-brand-200 items-center justify-center">
            <Text className="text-3xl">🧑‍🌾</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="font-bold text-gray-900 text-lg">{farmer.full_name ?? 'Verified Farmer'}</Text>
          <Text className="text-gray-500 text-sm">📍 {profile?.district}, {profile?.state}</Text>
          {generations >= 2 && (
            <Text className="text-brand-700 text-xs font-semibold mt-0.5">{ordinal(generations)} generation farmer</Text>
          )}
        </View>
      </View>

      {/* Quick stats grid */}
      {(years || land || varieties.length > 0) && (
        <View className="flex-row gap-2">
          {years > 0 && <StatTile icon="🗓️" value={`${years}+ yrs`} label="Experience" />}
          {land > 0 && <StatTile icon="🌾" value={`${land} ac`} label="Farm size" />}
          {varieties.length > 0 && <StatTile icon="🌿" value={String(varieties.length)} label="Crop variety" plural={varieties.length > 1 ? 'Crop varieties' : undefined} />}
        </View>
      )}

      {/* Verification badges */}
      {profile?.verification_badges?.length > 0 && (
        <View>
          <Text className="font-semibold text-gray-800 mb-2">Verified by Krishi Mitra</Text>
          <View className="flex-row flex-wrap gap-2">
            {profile.verification_badges.map((badge: string) => {
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

      {/* About / bio */}
      {profile?.bio && (
        <View className="bg-brand-50 border border-brand-200 rounded-2xl p-4">
          <Text className="font-bold text-brand-800 mb-1.5">🗣️ From the farmer</Text>
          <Text className="text-brand-700 leading-6 italic">"{profile.bio}"</Text>
        </View>
      )}

      {/* Crops grown */}
      {varieties.length > 0 && (
        <View>
          <Text className="font-semibold text-gray-800 mb-2">Crops grown</Text>
          <View className="flex-row flex-wrap gap-2">
            {varieties.map((c) => (
              <View key={c} className="bg-gray-100 rounded-full px-3 py-1">
                <Text className="text-gray-700 text-xs font-medium">{c}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Certifications */}
      {certs.length > 0 && (
        <View>
          <Text className="font-semibold text-gray-800 mb-2">Certifications</Text>
          <View className="flex-row flex-wrap gap-2">
            {certs.map((c) => (
              <View key={c} className="bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                <Text className="text-amber-700 text-xs font-semibold">{CERT_LABELS[c] ?? c}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Languages */}
      {langs.length > 0 && (
        <View>
          <Text className="font-semibold text-gray-800 mb-2">Speaks</Text>
          <View className="flex-row flex-wrap gap-2">
            {langs.map((l) => (
              <View key={l} className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                <Text className="text-blue-700 text-xs font-semibold">{LANG_LABELS[l] ?? l}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {(!years && !land && varieties.length === 0 && !profile?.bio) && (
        <View className="bg-gray-50 rounded-2xl p-4">
          <Text className="text-gray-500 text-sm">
            This farmer hasn't added their full story yet. The basic verification is still complete (ID, land records, GPS).
          </Text>
        </View>
      )}
    </View>
  );
}

function StatTile({ icon, value, label, plural }: { icon: string; value: string; label: string; plural?: string }) {
  return (
    <View className="flex-1 bg-white border border-gray-100 rounded-2xl py-3 items-center">
      <Text className="text-xl">{icon}</Text>
      <Text className="font-bold text-gray-900 text-sm mt-1">{value}</Text>
      <Text className="text-gray-400 text-[10px]">{plural ?? label}</Text>
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
