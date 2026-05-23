import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Image, Alert, Modal, ScrollView } from 'react-native';
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

function getRefundPolicy(status: BookingStatus): { pct: number; label: string } {
  if (status === 'confirmed') return { pct: 100, label: 'Before sowing — 100% advance refund' };
  if (status === 'in_progress') return { pct: 50, label: 'After sowing — 50% advance refund' };
  return { pct: 0, label: 'After harvest — No refund applicable' };
}

const CANCELLABLE: BookingStatus[] = ['confirmed', 'in_progress', 'harvested'];
const DELETABLE: BookingStatus[] = ['pending'];

type ActionSheet = { booking: Booking; type: 'delete' | 'cancel' };

export default function BookingsScreen() {
  const { bookings, fetchMyBookings, isLoading, deleteBooking, cancelBooking } = useBookingsStore();
  const [actionSheet, setActionSheet] = useState<ActionSheet | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => { fetchMyBookings(); }, []);

  const handleDelete = async () => {
    if (!actionSheet) return;
    setIsBusy(true);
    try {
      await deleteBooking(actionSheet.booking.id);
      setActionSheet(null);
    } catch (e: any) {
      setActionSheet(null);
      Alert.alert('Error', e.message ?? 'Could not remove order.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!actionSheet) return;
    setIsBusy(true);
    try {
      await cancelBooking(actionSheet.booking.id);
      setActionSheet(null);
      const { pct } = getRefundPolicy(actionSheet.booking.status);
      const refundAmount = (actionSheet.booking.advance_amount ?? 0) * (pct / 100);
      if (pct > 0) {
        Alert.alert('Order Cancelled', `Refund of ${formatCurrency(refundAmount)} will be processed within 5–7 business days.`);
      } else {
        Alert.alert('Order Cancelled', 'Your order has been cancelled. No refund is applicable.');
      }
    } catch (e: any) {
      setActionSheet(null);
      Alert.alert('Error', e.message ?? 'Could not cancel order.');
    } finally {
      setIsBusy(false);
    }
  };

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
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onDelete={() => setActionSheet({ booking: item, type: 'delete' })}
            onCancel={() => setActionSheet({ booking: item, type: 'cancel' })}
          />
        )}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-5xl mb-3">📦</Text>
            <Text className="text-gray-700 font-semibold text-lg">No bookings yet</Text>
            <Text className="text-gray-400 text-sm mt-1 text-center">Browse crops and pre-book your first harvest!</Text>
            <Pressable onPress={() => router.push('/(consumer)/browse')} className="mt-5 bg-brand-700 rounded-2xl px-6 py-3">
              <Text className="text-white font-bold">Browse Crops</Text>
            </Pressable>
          </View>
        }
      />

      {/* Confirmation bottom sheet */}
      <Modal visible={!!actionSheet} transparent animationType="slide" onRequestClose={() => setActionSheet(null)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setActionSheet(null)} />
        {actionSheet && (
          <View className="bg-white rounded-t-3xl px-5 pt-5 pb-10">
            {actionSheet.type === 'delete' ? (
              <>
                <Text className="text-lg font-bold text-gray-900 mb-2">Remove Unpaid Order?</Text>
                <Text className="text-gray-500 mb-6">
                  This booking was never paid. Removing it will free up the reserved quantity on the listing.
                </Text>
                <Pressable
                  onPress={handleDelete}
                  disabled={isBusy}
                  className="bg-red-500 rounded-2xl py-4 items-center mb-3"
                >
                  {isBusy ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Yes, Remove Order</Text>}
                </Pressable>
              </>
            ) : (
              <>
                <Text className="text-lg font-bold text-gray-900 mb-2">Cancel Order?</Text>
                {(() => {
                  const { pct, label } = getRefundPolicy(actionSheet.booking.status);
                  const refund = (actionSheet.booking.advance_amount ?? 0) * (pct / 100);
                  return (
                    <>
                      <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                        <Text className="text-amber-800 font-semibold text-sm mb-1">⚠️ Cancellation Policy</Text>
                        <Text className="text-amber-700 text-sm">{label}</Text>
                      </View>
                      <View className="bg-gray-50 rounded-2xl p-4 mb-6 gap-2">
                        <Row label="Advance paid" value={formatCurrency(actionSheet.booking.advance_amount ?? 0)} />
                        <Row label="Refund amount" value={formatCurrency(refund)} highlight={pct > 0} />
                        <Row label="Quantity restored" value={`${actionSheet.booking.qty_kg} kg`} />
                      </View>
                    </>
                  );
                })()}
                <Pressable
                  onPress={handleCancel}
                  disabled={isBusy}
                  className="bg-red-500 rounded-2xl py-4 items-center mb-3"
                >
                  {isBusy ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Confirm Cancellation</Text>}
                </Pressable>
              </>
            )}
            <Pressable onPress={() => setActionSheet(null)} disabled={isBusy} className="py-3 items-center">
              <Text className="text-gray-500 font-medium">Keep Order</Text>
            </Pressable>
          </View>
        )}
      </Modal>
    </View>
  );
}

function BookingCard({ booking, onDelete, onCancel }: { booking: Booking; onDelete: () => void; onCancel: () => void }) {
  const status = booking.status;
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  const category = CROP_CATEGORIES.find((c) => c.value === booking.listing?.crop_category);
  const heroImage = booking.listing?.media?.[0]?.url;

  return (
    <View className="bg-white rounded-3xl overflow-hidden mb-4" style={{ elevation: 1 }}>
      <Pressable onPress={() => router.push(`/(consumer)/booking/${booking.id}`)} className="active:opacity-90">
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
                <Text className={`${colors.text} text-xs font-semibold`}>{BOOKING_STATUS_LABELS[status]}</Text>
              </View>
            </View>
            <Text className="text-gray-500 text-sm mt-0.5">{booking.listing?.district}, {booking.listing?.state}</Text>
            <View className="flex-row gap-4 mt-2">
              <Text className="text-gray-600 text-sm">⚖️ {formatWeight(booking.qty_kg)}</Text>
              <Text className="text-brand-700 font-semibold text-sm">₹ {formatCurrency(booking.total_amount)}</Text>
            </View>
          </View>
        </View>
        <View className="px-4 pt-2 pb-3 flex-row justify-between border-t border-gray-50">
          <Text className="text-gray-400 text-xs">Booked {formatDate(booking.created_at)}</Text>
          <Text className="text-brand-600 text-xs font-medium">View Details →</Text>
        </View>
      </Pressable>

      {DELETABLE.includes(status) && (
        <Pressable onPress={onDelete} className="mx-4 mb-4 border border-red-200 rounded-2xl py-2.5 items-center">
          <Text className="text-red-500 text-sm font-semibold">🗑 Remove Unpaid Order</Text>
        </Pressable>
      )}
      {CANCELLABLE.includes(status) && (
        <Pressable onPress={onCancel} className="mx-4 mb-4 border border-red-200 rounded-2xl py-2.5 items-center">
          <Text className="text-red-500 text-sm font-semibold">
            ✕ Cancel Order · {getRefundPolicy(status).pct}% Refund
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-gray-500 text-sm">{label}</Text>
      <Text className={`text-sm font-semibold ${highlight ? 'text-brand-700' : 'text-gray-900'}`}>{value}</Text>
    </View>
  );
}
