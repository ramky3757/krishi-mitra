import { useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useBookingsStore } from '@/stores/bookingsStore';
import { formatCurrency, formatWeight, formatDate } from '@/lib/formatters';
import { BOOKING_STATUS_LABELS } from '@/constants';
import { Booking, BookingStatus } from '@/types';

const FARMER_STATUS_ACTIONS: Partial<Record<BookingStatus, { label: string; next: BookingStatus }>> = {
  pending: { label: 'Confirm Order', next: 'confirmed' },
  confirmed: { label: 'Mark In Progress', next: 'in_progress' },
  in_progress: { label: 'Mark Harvested', next: 'harvested' },
  harvested: { label: 'Mark Shipped', next: 'shipped' },
};

export default function FarmerOrdersScreen() {
  const { bookings, fetchFarmerBookings, isLoading, updateBookingStatus } = useBookingsStore();

  useEffect(() => { fetchFarmerBookings(); }, []);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Orders</Text>
        <Text className="text-gray-500 text-sm">{bookings.length} total order{bookings.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshing={isLoading}
        onRefresh={fetchFarmerBookings}
        renderItem={({ item }) => (
          <OrderCard
            booking={item}
            onPress={() => router.push(`/(farmer)/order/${item.id}`)}
            onAction={(next) => updateBookingStatus(item.id, next)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-16">
              <Text className="text-5xl mb-3">📬</Text>
              <Text className="text-gray-700 font-semibold text-lg">No orders yet</Text>
              <Text className="text-gray-400 text-sm mt-1 text-center">Post crop listings to start receiving bookings</Text>
            </View>
          ) : <ActivityIndicator color="#1a6b3c" size="large" className="py-10" />
        }
      />
    </View>
  );
}

function OrderCard({ booking, onPress, onAction }: { booking: Booking; onPress: () => void; onAction: (next: BookingStatus) => void }) {
  const action = FARMER_STATUS_ACTIONS[booking.status];
  const consumer = (booking as any).consumer;

  return (
    <Pressable onPress={onPress} className="bg-white rounded-3xl p-5 mb-4 active:opacity-90" style={{ elevation: 1 }}>
      <View className="flex-row items-center gap-3 mb-3">
        <View className="w-12 h-12 rounded-full bg-brand-100 items-center justify-center">
          <Text className="text-2xl">🧑</Text>
        </View>
        <View className="flex-1">
          <Text className="font-bold text-gray-900">{consumer?.full_name ?? 'Consumer'}</Text>
          <Text className="text-gray-500 text-sm">{booking.listing?.crop_name} · {formatWeight(booking.qty_kg)}</Text>
        </View>
        <View>
          <Text className="text-brand-700 font-bold">{formatCurrency(booking.total_amount)}</Text>
          <Text className="text-gray-400 text-xs text-right">total</Text>
        </View>
      </View>

      <View className="flex-row gap-3 mb-3">
        <InfoPill icon="✅" text={`₹${formatCurrency(booking.advance_amount)} received`} />
        <InfoPill icon="📅" text={formatDate(booking.created_at)} />
      </View>

      <View className="flex-row items-center justify-between">
        <View className="bg-brand-50 rounded-full px-3 py-1">
          <Text className="text-brand-700 text-xs font-semibold">{BOOKING_STATUS_LABELS[booking.status]}</Text>
        </View>
        {action && (
          <Pressable
            onPress={() => onAction(action.next)}
            className="bg-brand-700 rounded-xl px-4 py-2"
          >
            <Text className="text-white text-xs font-bold">{action.label}</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

function InfoPill({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1">
      <Text className="text-xs">{icon}</Text>
      <Text className="text-gray-600 text-xs">{text}</Text>
    </View>
  );
}
