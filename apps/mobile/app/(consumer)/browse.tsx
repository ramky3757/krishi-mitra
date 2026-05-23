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

  const filteredListings = search
    ? listings.filter(
        (l) =>
          l.crop_name.toLowerCase().includes(search.toLowerCase()) ||
          l.district.toLowerCase().includes(search.toLowerCase()) ||
          l.state.toLowerCase().includes(search.toLowerCase())
      )
    : listings;

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
            <View className="items-center py-16">
              <ActivityIndicator color="#1a6b3c" size="large" />
              <Text className="text-gray-400 text-sm mt-3">Loading crops…</Text>
            </View>
          ) : (
            <View className="items-center py-16">
              <Text className="text-5xl mb-3">🌾</Text>
              <Text className="text-gray-600 font-semibold">No crops found</Text>
              <Text className="text-gray-400 text-sm mt-1 text-center">
                {Object.keys(filters).length > 0
                  ? 'Try adjusting your filters'
                  : 'Farmers are preparing their crops.\nCheck back soon!'}
              </Text>
              {Object.keys(filters).length > 0 && (
                <Pressable onPress={resetFilters} className="mt-4 bg-brand-100 rounded-xl px-5 py-2">
                  <Text className="text-brand-700 font-semibold">Clear Filters</Text>
                </Pressable>
              )}
            </View>
          )
        }
      />
    </View>
  );
}
