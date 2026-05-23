import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useBookingsStore } from '@/stores/bookingsStore';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatWeight, formatDate } from '@/lib/formatters';
import { BOOKING_STATUS_LABELS, CROP_MILESTONES } from '@/constants';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedBooking, fetchBookingById, isLoading } = useBookingsStore();
  const [visitModalVisible, setVisitModalVisible] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitNote, setVisitNote] = useState('');
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);

  useEffect(() => {
    fetchBookingById(id);
  }, [id]);

  const handleRequestVisit = async () => {
    if (!visitDate) return;
    setIsSubmittingVisit(true);
    try {
      await supabase.from('farm_visits').insert({
        booking_id: id,
        requested_date: visitDate,
        notes: visitNote,
        status: 'requested',
      });
      setVisitModalVisible(false);
      Alert.alert('Visit Requested', 'Your farm visit request has been sent. The farmer will confirm shortly.');
      fetchBookingById(id);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSubmittingVisit(false);
    }
  };

  if (isLoading || !selectedBooking) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1a6b3c" size="large" />
      </View>
    );
  }

  const booking = selectedBooking;
  const listing = booking.listing;
  const visits = booking.visits ?? [];
  const usedVisits = visits.filter((v: any) => ['approved', 'completed'].includes(v.status)).length;
  const pendingVisit = visits.find((v: any) => v.status === 'requested');

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="bg-brand-700 px-5 pt-14 pb-8">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="text-brand-200">← Back</Text>
          </Pressable>
          <Text className="text-white text-2xl font-bold">{listing?.crop_name}</Text>
          <Text className="text-brand-300 mt-1">📍 {listing?.district}, {listing?.state}</Text>

          {/* Status badge */}
          <View className="mt-3 self-start bg-white/20 rounded-full px-4 py-1.5">
            <Text className="text-white font-semibold text-sm">
              {BOOKING_STATUS_LABELS[booking.status]}
            </Text>
          </View>
        </View>

        <View className="px-5 -mt-4 gap-4">
          {/* Summary card */}
          <View className="bg-white rounded-3xl p-5 shadow-sm">
            <Text className="font-bold text-gray-900 mb-4">Booking Summary</Text>
            <View className="gap-2.5">
              <SummaryRow icon="⚖️" label="Quantity" value={formatWeight(booking.qty_kg)} />
              <SummaryRow icon="💰" label="Total Value" value={formatCurrency(booking.total_amount)} />
              <SummaryRow icon="✅" label="Advance Paid" value={formatCurrency(booking.advance_amount)} />
              <SummaryRow icon="⏳" label="Remaining" value={formatCurrency(booking.final_amount)} />
              <SummaryRow icon="📅" label="Booked On" value={formatDate(booking.created_at)} />
              {listing?.harvest_date && (
                <SummaryRow icon="🌾" label="Expected Harvest" value={formatDate(listing.harvest_date)} />
              )}
            </View>
          </View>

          {/* Crop Progress */}
          {listing?.progress_updates && listing.progress_updates.length > 0 && (
            <View className="bg-white rounded-3xl p-5">
              <Text className="font-bold text-gray-900 mb-4">Crop Progress</Text>
              <View className="gap-3">
                {listing.progress_updates.map((update: any, i: number) => {
                  const milestone = CROP_MILESTONES.find((m) => m.value === update.milestone);
                  return (
                    <View key={update.id} className="flex-row gap-3 items-start">
                      <View className="w-7 h-7 rounded-full bg-brand-700 items-center justify-center mt-0.5">
                        <Text className="text-white text-xs font-bold">{i + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-800">{milestone?.label}</Text>
                        <Text className="text-gray-400 text-xs">{formatDate(update.created_at)}</Text>
                        {update.note && <Text className="text-gray-600 text-sm mt-1">{update.note}</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Farm Visits */}
          <View className="bg-white rounded-3xl p-5">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="font-bold text-gray-900">Farm Visits</Text>
                <Text className="text-gray-400 text-xs mt-0.5">{usedVisits}/2 visits used</Text>
              </View>
              {usedVisits < 2 && !pendingVisit && booking.status !== 'delivered' && (
                <Pressable
                  onPress={() => setVisitModalVisible(true)}
                  className="bg-brand-700 rounded-xl px-4 py-2"
                >
                  <Text className="text-white text-sm font-semibold">Request Visit</Text>
                </Pressable>
              )}
            </View>

            {visits.length === 0 ? (
              <Text className="text-gray-400 text-sm">No visits scheduled yet.</Text>
            ) : (
              <View className="gap-3">
                {visits.map((visit: any) => (
                  <VisitCard key={visit.id} visit={visit} />
                ))}
              </View>
            )}
          </View>

          {/* Delivery address */}
          {booking.delivery_address && (
            <View className="bg-white rounded-3xl p-5">
              <Text className="font-bold text-gray-900 mb-2">Delivery Address</Text>
              <Text className="text-gray-600">{booking.delivery_address}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Visit request modal */}
      <Modal visible={visitModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <Text className="text-xl font-bold text-gray-900 mb-1">Request Farm Visit</Text>
            <Text className="text-gray-500 text-sm mb-5">Farmer will confirm your visit date and time.</Text>

            <Text className="text-gray-700 font-semibold mb-2">Preferred Date (YYYY-MM-DD)</Text>
            <TextInput
              className="border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-900 mb-4"
              placeholder="e.g. 2025-08-20"
              value={visitDate}
              onChangeText={setVisitDate}
            />

            <Text className="text-gray-700 font-semibold mb-2">Notes (optional)</Text>
            <TextInput
              className="border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-900 mb-5"
              placeholder="Number of people, special requests..."
              value={visitNote}
              onChangeText={setVisitNote}
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setVisitModalVisible(false)}
                className="flex-1 border border-gray-300 rounded-2xl py-3.5 items-center"
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleRequestVisit}
                disabled={!visitDate || isSubmittingVisit}
                className={`flex-1 rounded-2xl py-3.5 items-center ${!visitDate ? 'bg-gray-200' : 'bg-brand-700'}`}
              >
                {isSubmittingVisit ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className={`font-bold ${!visitDate ? 'text-gray-400' : 'text-white'}`}>Send Request</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <Text className="text-lg w-7">{icon}</Text>
      <Text className="text-gray-500 flex-1">{label}</Text>
      <Text className="text-gray-900 font-semibold">{value}</Text>
    </View>
  );
}

const VISIT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  requested: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  approved: { bg: 'bg-green-50', text: 'text-green-700' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700' },
  completed: { bg: 'bg-brand-50', text: 'text-brand-700' },
  cancelled: { bg: 'bg-gray-50', text: 'text-gray-500' },
};

function VisitCard({ visit }: { visit: any }) {
  const colors = VISIT_STATUS_COLORS[visit.status] ?? VISIT_STATUS_COLORS.requested;
  return (
    <View className={`${colors.bg} rounded-2xl p-3.5`}>
      <View className="flex-row justify-between items-center">
        <Text className="font-semibold text-gray-800">
          📅 {visit.confirmed_date ? formatDate(visit.confirmed_date) : formatDate(visit.requested_date)}
        </Text>
        <View className="bg-white rounded-full px-2.5 py-1">
          <Text className={`${colors.text} text-xs font-semibold capitalize`}>{visit.status}</Text>
        </View>
      </View>
      {visit.notes && <Text className="text-gray-500 text-sm mt-1">{visit.notes}</Text>}
    </View>
  );
}
