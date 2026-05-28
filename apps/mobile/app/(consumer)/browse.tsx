import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useListingsStore } from '@/stores/listingsStore';
import { CropListingCard } from '@/components/CropListingCard';
import { CROP_CATEGORIES, FARMING_METHODS } from '@/constants';
import { CropCategory, FarmingMethod } from '@/types';

export default function BrowseScreen() {
  const { listings, isLoading, hasMore, fetchListings, filters, setFilters, clearFilters } = useListingsStore();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CropCategory | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<FarmingMethod | null>(null);

  // Re-fetch whenever filters change (including the initial mount).
  useEffect(() => {
    fetchListings(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const applyFilters = () => {
    setFilters({
      ...filters,
      category: selectedCategory ?? undefined,
      farming_method: selectedMethod ?? undefined,
    });
    setShowFilters(false);
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedMethod(null);
    clearFilters();
    setShowFilters(false);
  };

  const [quickFilter, setQuickFilter] = useState<'all' | 'organic' | 'soon' | 'ready' | 'wishlist'>('all');

  let filteredListings = search
    ? listings.filter(
        (l) =>
          l.crop_name.toLowerCase().includes(search.toLowerCase()) ||
          l.district.toLowerCase().includes(search.toLowerCase()) ||
          l.state.toLowerCase().includes(search.toLowerCase())
      )
    : listings;

  // Apply quick filter
  if (quickFilter === 'organic') {
    filteredListings = filteredListings.filter((l) => l.farming_method === 'organic');
  } else if (quickFilter === 'soon') {
    filteredListings = filteredListings.filter((l) => {
      if (!l.harvest_date) return false;
      const days = Math.ceil((new Date(l.harvest_date).getTime() - Date.now()) / 86400000);
      return days <= 30 && days >= 0;
    });
  } else if (quickFilter === 'ready') {
    filteredListings = filteredListings.filter((l: any) => l.crop_stage === 'ready_now');
  }

  const counts = {
    all: listings.length,
    organic: listings.filter((l) => l.farming_method === 'organic').length,
    soon: listings.filter((l) => {
      if (!l.harvest_date) return false;
      const days = Math.ceil((new Date(l.harvest_date).getTime() - Date.now()) / 86400000);
      return days <= 30 && days >= 0;
    }).length,
    ready: listings.filter((l: any) => l.crop_stage === 'ready_now').length,
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search header */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900 mb-3">Browse Crops</Text>
        <View className="flex-row gap-3">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-2xl px-4 gap-2">
            <Text>🔍</Text>
            <TextInput
              className="flex-1 py-3 text-gray-900"
              placeholder="Search crops, location…"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <Pressable
            onPress={() => setShowFilters(!showFilters)}
            className={`w-12 items-center justify-center rounded-2xl ${Object.keys(filters).length > 0 ? 'bg-brand-700' : 'bg-gray-100'}`}
          >
            <Text className="text-lg">🎛️</Text>
          </Pressable>
        </View>
      </View>

      {/* Filter panel */}
      {showFilters && (
        <View className="bg-white border-b border-gray-100 px-5 py-4">
          <Text className="font-semibold text-gray-700 mb-3">Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {CROP_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  onPress={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)}
                  className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${selectedCategory === cat.value ? 'bg-brand-700' : 'bg-gray-100'}`}
                >
                  <Text>{cat.emoji}</Text>
                  <Text className={`text-sm font-medium ${selectedCategory === cat.value ? 'text-white' : 'text-gray-700'}`}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Text className="font-semibold text-gray-700 mb-3">Farming Method</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {FARMING_METHODS.map((m) => (
              <Pressable
                key={m.value}
                onPress={() => setSelectedMethod(selectedMethod === m.value ? null : m.value)}
                className={`rounded-full px-3 py-1.5 ${selectedMethod === m.value ? 'bg-brand-700' : 'bg-gray-100'}`}
              >
                <Text className={`text-sm font-medium ${selectedMethod === m.value ? 'text-white' : 'text-gray-700'}`}>{m.label}</Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row gap-3">
            <Pressable onPress={resetFilters} className="flex-1 border border-gray-300 rounded-xl py-2.5 items-center">
              <Text className="text-gray-700 font-medium">Reset</Text>
            </Pressable>
            <Pressable onPress={applyFilters} className="flex-1 bg-brand-700 rounded-xl py-2.5 items-center">
              <Text className="text-white font-medium">Apply</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Quick filter chips with counts */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        <QuickFilter active={quickFilter === 'all'} onPress={() => setQuickFilter('all')} label="All" count={counts.all} />
        <QuickFilter active={quickFilter === 'ready'} onPress={() => setQuickFilter('ready')} label="✅ Ready Now" count={counts.ready} />
        <QuickFilter active={quickFilter === 'soon'} onPress={() => setQuickFilter('soon')} label="⏳ Harvest <30d" count={counts.soon} />
        <QuickFilter active={quickFilter === 'organic'} onPress={() => setQuickFilter('organic')} label="🌿 Organic" count={counts.organic} />
      </ScrollView>

      {/* Results */}
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <CropListingCard
            listing={item}
            onPress={() => router.push(`/(consumer)/listing/${item.id}`)}
          />
        )}
        onEndReached={() => { if (hasMore && !isLoading) fetchListings(); }}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          filteredListings.length > 0 ? (
            <Text className="text-gray-500 text-sm mb-3">
              {filteredListings.length} crop{filteredListings.length !== 1 ? 's' : ''} found
            </Text>
          ) : null
        }
        ListFooterComponent={isLoading ? <ActivityIndicator color="#1a6b3c" className="py-6" /> : null}
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#1a6b3c" size="large" />
              <Text className="text-gray-400 text-sm mt-3">Loading crops…</Text>
            </View>
          ) : (
            <View className="items-center py-8 px-4">
              <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
                <Text className="text-3xl">🔍</Text>
              </View>
              <Text className="text-gray-700 font-semibold text-base">
                {quickFilter !== 'all' || Object.keys(filters).length > 0
                  ? 'No matches with this filter'
                  : 'No crops listed yet'}
              </Text>
              <Text className="text-gray-400 text-sm mt-1 text-center max-w-xs">
                {quickFilter !== 'all' || Object.keys(filters).length > 0
                  ? 'Try a different category or clear the active filter.'
                  : 'Farmers are preparing their crops. Check back soon!'}
              </Text>
              {(quickFilter !== 'all' || Object.keys(filters).length > 0) && (
                <View className="flex-row gap-2 mt-4">
                  <Pressable
                    onPress={() => setQuickFilter('all')}
                    className="bg-brand-700 rounded-xl px-4 py-2"
                  >
                    <Text className="text-white font-semibold text-sm">Show all crops</Text>
                  </Pressable>
                  {Object.keys(filters).length > 0 && (
                    <Pressable onPress={resetFilters} className="border border-gray-300 rounded-xl px-4 py-2">
                      <Text className="text-gray-700 font-semibold text-sm">Clear filters</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )
        }
      />
    </View>
  );
}

function QuickFilter({ active, onPress, label, count }: { active: boolean; onPress: () => void; label: string; count: number }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 border ${
        active ? 'bg-brand-700 border-brand-700' : 'bg-white border-gray-200'
      }`}
    >
      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>{label}</Text>
      <View className={`rounded-full px-1.5 py-0 ${active ? 'bg-white/25' : 'bg-gray-100'}`}>
        <Text className={`text-[10px] font-bold ${active ? 'text-white' : 'text-gray-600'}`}>{count}</Text>
      </View>
    </Pressable>
  );
}
