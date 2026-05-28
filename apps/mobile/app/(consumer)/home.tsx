import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useListingsStore } from '@/stores/listingsStore';
import { CropListingCard } from '@/components/CropListingCard';
import { CROP_CATEGORIES } from '@/constants';

export default function HomeScreen() {
  const { user, consumerProfile } = useAuthStore();
  const { featuredListings, fetchFeaturedListings, isLoading, setFilters } = useListingsStore();
  const kycStatus = consumerProfile?.kyc_status ?? 'incomplete';
  const isKycIncomplete = kycStatus === 'incomplete' || kycStatus === 'rejected';

  useEffect(() => {
    fetchFeaturedListings();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="bg-brand-700 pt-14 pb-6 px-5">
        <Text className="text-brand-200 text-sm">{greeting()},</Text>
        <Text className="text-white text-2xl font-bold mt-0.5">
          {user?.full_name?.split(' ')[0] ?? 'Friend'} 👋
        </Text>
        <Text className="text-brand-300 text-sm mt-1">Discover fresh crops from verified farmers near you</Text>

        {/* Search bar */}
        <Pressable
          onPress={() => router.push('/(consumer)/browse')}
          className="mt-4 flex-row items-center bg-white/15 rounded-2xl px-4 py-3 gap-2"
        >
          <Text className="text-lg">🔍</Text>
          <Text className="text-white/70 flex-1">Search crops, farmers…</Text>
        </Pressable>
      </View>

      {/* KYC banner */}
      {isKycIncomplete && (
        <Pressable
          onPress={() => router.push('/(auth)/consumer-kyc')}
          className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex-row items-center justify-between"
        >
          <View className="flex-1">
            <Text className="text-amber-800 font-semibold text-sm">
              {kycStatus === 'rejected' ? '⚠️ Profile rejected' : '⚠️ Complete your profile'}
            </Text>
            <Text className="text-amber-700 text-xs mt-0.5">
              Address & ID verification needed before booking →
            </Text>
          </View>
          <Text className="text-amber-700 font-bold">→</Text>
        </Pressable>
      )}
      {kycStatus === 'pending' && (
        <View className="bg-blue-50 border-b border-blue-200 px-5 py-3">
          <Text className="text-blue-800 font-semibold text-sm">⏳ Profile under review</Text>
          <Text className="text-blue-700 text-xs mt-0.5">
            You can browse and book — full verification will be confirmed shortly.
          </Text>
        </View>
      )}

      {/* Trust strip */}
      <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row justify-around items-center">
        <TrustItem icon="✅" label="Verified Farms" sub="ID & GPS checked" />
        <View className="w-px h-8 bg-gray-100" />
        <TrustItem icon="🌾" label="Direct from Farm" sub="No middlemen" />
        <View className="w-px h-8 bg-gray-100" />
        <TrustItem icon="🔒" label="100% Safe Pay" sub="Refund protected" />
      </View>

      {/* Why pre-book? */}
      <View className="bg-brand-50 px-5 py-4 border-b border-brand-100">
        <Text className="text-brand-800 font-bold text-sm mb-2">💡 Why pre-book?</Text>
        <View className="gap-2">
          <WhyRow icon="💰" text="Lower price than supermarkets — buy direct from the farmer" />
          <WhyRow icon="🌱" text="Track your crop from seed to harvest with photo updates" />
          <WhyRow icon="🚜" text="Visit the farm anytime, meet the farmer who grew your food" />
        </View>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
      >
        <CategoryChip emoji="🌿" label="All" onPress={() => { setFilters({}); router.push('/(consumer)/browse'); }} />
        {CROP_CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.value}
            emoji={cat.emoji}
            label={cat.label}
            onPress={() => { setFilters({ category: cat.value }); router.push('/(consumer)/browse'); }}
          />
        ))}
      </ScrollView>

      {/* Featured listings */}
      <View className="px-5 pt-5 pb-3">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-900">Fresh This Season 🌱</Text>
          <Pressable onPress={() => router.push('/(consumer)/browse')}>
            <Text className="text-brand-600 text-sm font-medium">See all →</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#1a6b3c" size="large" className="py-10" />
        ) : featuredListings.length === 0 ? (
          <EmptyState />
        ) : (
          featuredListings.map((listing) => (
            <CropListingCard
              key={listing.id}
              listing={listing}
              onPress={() => router.push(`/(consumer)/listing/${listing.id}`)}
            />
          ))
        )}
      </View>

      {/* Trust banner */}
      <View className="mx-5 mb-8 bg-brand-50 border border-brand-200 rounded-3xl p-5">
        <Text className="text-brand-700 font-bold text-base mb-3">Why Krishi Mitra?</Text>
        <View className="gap-2">
          <TrustPoint icon="✅" text="Only verified farmers with confirmed land records" />
          <TrustPoint icon="📸" text="Real-time crop progress photos from the farm" />
          <TrustPoint icon="🚜" text="Visit the farm up to 2 times before harvest" />
          <TrustPoint icon="💰" text="Book early with just 20% advance — pay more closer to harvest" />
        </View>
      </View>
    </ScrollView>
  );
}

function CategoryChip({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1.5 bg-gray-100 rounded-full px-3.5 py-2 active:bg-brand-100"
    >
      <Text>{emoji}</Text>
      <Text className="text-gray-700 text-sm font-medium">{label}</Text>
    </Pressable>
  );
}

function TrustPoint({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row gap-2.5 items-start">
      <Text>{icon}</Text>
      <Text className="text-brand-800 text-sm flex-1">{text}</Text>
    </View>
  );
}

function TrustItem({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return (
    <View className="items-center flex-1">
      <Text className="text-lg mb-0.5">{icon}</Text>
      <Text className="text-gray-800 text-[11px] font-bold">{label}</Text>
      <Text className="text-gray-400 text-[10px]">{sub}</Text>
    </View>
  );
}

function WhyRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row items-start gap-2">
      <Text className="text-sm">{icon}</Text>
      <Text className="text-brand-700 text-xs flex-1 leading-5">{text}</Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View className="items-center py-12">
      <Text className="text-5xl mb-3">🌾</Text>
      <Text className="text-gray-600 font-semibold">No listings yet</Text>
      <Text className="text-gray-400 text-sm mt-1 text-center">
        Farmers are preparing their crops.{'\n'}Check back soon!
      </Text>
    </View>
  );
}
