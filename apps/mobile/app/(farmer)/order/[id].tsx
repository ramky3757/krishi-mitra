import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useBookingsStore } from '@/stores/bookingsStore';
import { formatCurrency, formatWeight, formatDate } from '@/lib/formatters';
import { BOOKING_STATUS_LABELS } from '@/constants';
import { BookingStatus } from '@/types';

const NEXT_STATUS: Partial<Record<BookingStatus, { label: string; next: BookingStatus; confirm?: string }>> = {
  pending: { label: 'Confirm Order', next: 'confirmed' },
  confirmed: { label: 'Mark as In Progress', next: 'in_progress' },
  in_progress: { label: 'Mark as Harvested', next: 'harvested', confirm: 'Has the crop been fully harvested? This will notify the buyer to arrange final payment.' },
  harvested: { label: 'Mark as Shipped', next: 'shipped', confirm: 'Confirm that you have shipped the crop to the buyer.' },
};

export default function FarmerOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedBooking, fetchBookingById, isLoading, updateBookingStatus, refreshBooking } = useBookingsStore();

  useEffect(() => { fetchBookingById(id); }, [id]);

  const handleAction = (label: string, next: BookingStatus, confirm?: string) => {
    if (confirm) {
      Alert.alert(label, confirm, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => updateBookingStatus(id, next) },
      ]);
    } else {
      updateBookingStatus(id, next);
    }
  };

  if (isLoading || !selectedBooking) {
    return <View className="flex-1 items-center justify-center"><ActivityIndicator color="#1a6b3c" /></View>;
  }

  const booking = selectedBooking;
  const consumer = (booking as any).consumer?.user;
  const action = NEXT_STATUS[booking.status];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="bg-brand-700 px-5 pt-14 pb-6">
          <Pressable onPress={() => router.back()} className="mb-3"><Text className="text-brand-200">← Back</Text></Pressable>
          <Text className="text-white text-xl font-bold">Order Details</Text>
          <Text className="text-brand-300">{booking.listing?.crop_name} · {formatWeight(booking.qty_kg)}</Text>
        </View>

        <View className="px-5 -mt-4 gap-4">
          {/* Consumer */}
          <View className="bg-white rounded-3xl p-5">
            <Text className="font-bold text-gray-900 mb-3">Buyer</Text>
            <View className="flex-row items-center gap-3">
              <View className="w-14 h-14 rounded-full bg-brand-100 items-center justify-center">
                <Text className="text-2xl">🧑</Text>
              </View>
              <View>
                <Text className="font-semibold text-gray-900 text-base">{consumer?.full_name ?? 'Consumer'}</Text>
                <Text className="text-gray-500 text-sm">{consumer?.phone}</Text>
              </View>
            </View>
            {booking.delivery_address && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-400 text-xs mb-1">Delivery Address</Text>
                <Text className="text-gray-700">{booking.delivery_address}</Text>
              </View>
            )}
          </View>

          {/* Payment summary */}
          <View className="bg-white rounded-3xl p-5">
            <Text className="font-bold text-gray-900 mb-3">Payment</Text>
            <View className="gap-2">
              <Row label="Total Order Value" value={formatCurrency(booking.total_amount)} bold />
              <Row label="Advance Received" value={formatCurrency(booking.advance_amount)} highlight />
              <Row label="Remaining on Delivery" value={formatCurrency(booking.final_amount)} />
            </View>
          </View>

          {/* Order status */}
          <View className="bg-white rounded-3xl p-5">
            <Text className="font-bold text-gray-900 mb-3">Status History</Text>
            <View className="bg-brand-50 rounded-2xl px-4 py-3">
              <Text className="text-brand-700 font-semibold">{BOOKING_STATUS_LABELS[booking.status]}</Text>
            </View>
          </View>

          {/* Visits */}
          {(booking.visits ?? []).length > 0 && (
            <View className="bg-white rounded-3xl p-5">
              <Text className="font-bold text-gray-900 mb-3">Farm Visit Requests</Text>
              {(booking.visits ?? []).map((v: any) => (
                <View key={v.id} className="mb-2 bg-gray-50 rounded-2xl p-3.5">
                  <View className="flex-row justify-between items-center">
                    <Text className="font-medium text-gray-800">📅 {formatDate(v.requested_date)}</Text>
                    <Text className={`text-xs font-semibold capitalize ${v.status === 'approved' ? 'text-green-600' : v.status === 'rejected' ? 'text-red-500' : 'text-amber-600'}`}>
                      {v.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {action && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 pb-8">
          <Pressable
            onPress={() => handleAction(action.label, action.next, action.confirm)}
            className="bg-brand-700 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-bold text-base">{action.label}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <View className="flex-row justify-between">
      <Text className={`${highlight ? 'text-brand-600 font-semibold' : 'text-gray-500'} ${bold ? 'font-bold text-gray-900' : ''}`}>{label}</Text>
      <Text className={`font-semibold ${highlight ? 'text-brand-700' : 'text-gray-900'} ${bold ? 'text-lg' : ''}`}>{value}</Text>
    </View>
  );
}
