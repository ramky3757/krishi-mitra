import { useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { useBookingsStore } from '@/stores/bookingsStore';
import { formatCurrency, formatWeight, formatDate } from '@/lib/formatters';
import { BOOKING_STATUS_LABELS, CROP_CATEGORIES } from '@/constants';
import { Booking, BookingStatus } from '@/types';

const STATUS_COLORS: Record<BookingStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-700' },
  in_progress: { bg: 'bg-brand-100', text: 'text-brand-700' },
  harvested: { bg: 'bg-teal-100', text: 'text-teal-700' },
  shipped: { bg: 'bg-purple-100', text: 'text-purple-700' },
  delivered: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-600' },
  disputed: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function BookingsScreen() {
  const { bookings, fetchMyBookings, isLoading } = useBookingsStore();

  useEffect(() => {
    fetchMyBookings();
  }, []);

  if (isLoading && bookings.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator color="#1a6b3c" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">My Orders</Text>
        <Text className="text-gray-500 text-sm mt-1">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshing={isLoading}
        onRefresh={fetchMyBookings}
        renderItem={({ item }) => <BookingCard booking={item} />}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-5xl mb-3">📦</Text>
            <Text className="text-gray-700 font-semibold text-lg">No bookings yet</Text>
            <Text className="text-gray-400 text-sm mt-1 text-center">
              Browse crops and pre-book your first harvest!
            </Text>
            <Pressable
              onPress={() => router.push('/(consumer)/browse')}
              className="mt-5 bg-brand-700 rounded-2xl px-6 py-3"
            >
              <Text className="text-white font-bold">Browse Crops</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const status = booking.status;
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  const category = CROP_CATEGORIES.find((c) => c.value === booking.listing?.crop_category);
  const heroImage = booking.listing?.media?.[0]?.url;

  return (
    <Pressable
      onPress={() => router.push(`/(consumer)/booking/${booking.id}`)}
      className="bg-white rounded-3xl overflow-hidden mb-4 active:opacity-90"
      style={{ elevation: 1 }}
    >
      {/* Hero */}
      <View className="flex-row">
        <View className="w-24 h-24 bg-brand-100 items-center justify-center">
          {heroImage ? (
            <Image source={{ uri: heroImage }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Text className="text-4xl">{category?.emoji ?? '🌾'}</Text>
          )}
        </View>
        <View className="flex-1 p-4">
          <View className="flex-row justify-between items-start">
            <Text className="font-bold text-gray-900 flex-1 mr-2" numberOfLines={1}>
              {booking.listing?.crop_name ?? 'Crop'}
            </Text>
            <View className={`${colors.bg} rounded-full px-2.5 py-1`}>
              <Text className={`${colors.text} text-xs font-semibold`}>
                {BOOKING_STATUS_LABELS[status]}
              </Text>
            </View>
          </View>
          <Text className="text-gray-500 text-sm mt-0.5">
            {booking.listing?.district}, {booking.listing?.state}
          </Text>
          <View className="flex-row gap-4 mt-2">
            <Text className="text-gray-600 text-sm">⚖️ {formatWeight(booking.qty_kg)}</Text>
            <Text className="text-brand-700 font-semibold text-sm">
              ₹ {formatCurrency(booking.total_amount)}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="px-4 pb-4 pt-1 flex-row justify-between border-t border-gray-50">
        <Text className="text-gray-400 text-xs">Booked {formatDate(booking.created_at)}</Text>
        <Text className="text-brand-600 text-xs font-medium">View Details →</Text>
      </View>
    </Pressable>
  );
}
