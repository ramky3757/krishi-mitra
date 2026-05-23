import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useListingsStore } from '@/stores/listingsStore';
import { useBookingsStore } from '@/stores/bookingsStore';
import { formatCurrency, formatWeight, calculateAdvanceAmount, calculateFinalAmount } from '@/lib/formatters';
import { ADVANCE_PERCENTAGE_OPTIONS } from '@/constants';

export default function CheckoutScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const { selectedListing, fetchListingById } = useListingsStore();
  const { createBooking } = useBookingsStore();

  const [qty, setQty] = useState('10');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [advancePct, setAdvancePct] = useState(25);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (listingId) fetchListingById(listingId);
  }, [listingId]);

  const listing = selectedListing;
  if (!listing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1a6b3c" />
      </View>
    );
  }

  const qtyNum = parseFloat(qty) || 0;
  const remainingQty = listing.available_qty_kg - (listing.booked_qty_kg ?? 0);
  const totalAmount = qtyNum * listing.price_per_kg_final;
  const advanceAmount = calculateAdvanceAmount(totalAmount, advancePct);
  const finalAmount = calculateFinalAmount(totalAmount, advanceAmount);

  const isValid = qtyNum >= 1 && qtyNum <= remainingQty && address.trim();

  const handleBook = async () => {
    if (!isValid) return;
    setIsLoading(true);
    try {
      const booking = await createBooking({
        listing_id: listingId,
        qty_kg: qtyNum,
        delivery_address: address,
        notes,
      });
      // In real app, integrate Razorpay here for advance payment
      Alert.alert(
        'Booking Confirmed! 🎉',
        `Your booking for ${formatWeight(qtyNum)} of ${listing.crop_name} is confirmed.\n\nAdvance payment of ${formatCurrency(advanceAmount)} is due to secure your booking.`,
        [{ text: 'View Booking', onPress: () => router.replace(`/(consumer)/booking/${booking.id}`) }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Booking failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View className="bg-white px-5 pt-14 pb-5 border-b border-gray-100">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="text-brand-700">← Back</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-gray-900">Pre-Book Crop</Text>
          <Text className="text-gray-500 mt-1">{listing.crop_name} · {listing.district}, {listing.state}</Text>
        </View>

        <View className="px-5 pt-5 gap-5">
          {/* Quantity selector */}
          <View className="bg-white rounded-3xl p-5">
            <Text className="font-bold text-gray-900 mb-1">Quantity (kg)</Text>
            <Text className="text-gray-400 text-sm mb-3">
              Min: 1 kg · Max available: {formatWeight(remainingQty)}
            </Text>
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => setQty(String(Math.max(1, qtyNum - 5)))}
                className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center"
              >
                <Text className="text-xl font-bold text-gray-700">−</Text>
              </Pressable>
              <TextInput
                className="flex-1 border-2 border-brand-200 rounded-2xl text-center py-3 text-xl font-bold text-gray-900"
                keyboardType="numeric"
                value={qty}
                onChangeText={setQty}
              />
              <Pressable
                onPress={() => setQty(String(Math.min(remainingQty, qtyNum + 5)))}
                className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center"
              >
                <Text className="text-xl font-bold text-gray-700">+</Text>
              </Pressable>
            </View>
            {qtyNum > remainingQty && (
              <Text className="text-red-500 text-sm mt-2">
                Only {formatWeight(remainingQty)} available
              </Text>
            )}
          </View>

          {/* Advance percentage */}
          <View className="bg-white rounded-3xl p-5">
            <Text className="font-bold text-gray-900 mb-3">Advance Payment</Text>
            <View className="flex-row gap-3">
              {ADVANCE_PERCENTAGE_OPTIONS.map((pct) => (
                <Pressable
                  key={pct}
                  onPress={() => setAdvancePct(pct)}
                  className={`flex-1 py-3 rounded-2xl items-center border-2 ${advancePct === pct ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}
                >
                  <Text className={`font-bold text-lg ${advancePct === pct ? 'text-brand-700' : 'text-gray-500'}`}>{pct}%</Text>
                  <Text className={`text-xs mt-0.5 ${advancePct === pct ? 'text-brand-500' : 'text-gray-400'}`}>
                    {formatCurrency(calculateAdvanceAmount(qtyNum * listing.price_per_kg_final, pct))}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Delivery address */}
          <View className="bg-white rounded-3xl p-5">
            <Text className="font-bold text-gray-900 mb-3">Delivery Address *</Text>
            <TextInput
              className="border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-900 h-24"
              placeholder="Enter your full delivery address"
              multiline
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* Notes */}
          <View className="bg-white rounded-3xl p-5">
            <Text className="font-bold text-gray-900 mb-3">Notes for Farmer (optional)</Text>
            <TextInput
              className="border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-900"
              placeholder="e.g. Prefer basmati variety, no broken grains..."
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Price breakdown */}
          <View className="bg-brand-50 border border-brand-200 rounded-3xl p-5">
            <Text className="font-bold text-gray-900 mb-4">Price Breakdown</Text>
            <View className="gap-2">
              <PriceRow label="Quantity" value={formatWeight(qtyNum)} />
              <PriceRow label="Price per kg" value={formatCurrency(listing.price_per_kg_final)} />
              <PriceRow label="Total crop value" value={formatCurrency(totalAmount)} bold />
              <View className="h-px bg-brand-200 my-1" />
              <PriceRow label={`Advance now (${advancePct}%)`} value={formatCurrency(advanceAmount)} highlight />
              <PriceRow label="Remaining on delivery" value={formatCurrency(finalAmount)} />
            </View>
          </View>

          {/* Cancellation policy */}
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <Text className="font-semibold text-amber-800 mb-1">⚠️ Cancellation Policy</Text>
            <Text className="text-amber-700 text-sm leading-5">
              Cancellations before sowing: 100% advance refund.{'\n'}
              After sowing and before harvest: 50% advance refund.{'\n'}
              After harvest: No refund.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Book button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 pb-8">
        <Pressable
          onPress={handleBook}
          disabled={!isValid || isLoading}
          className={`rounded-2xl py-4 items-center ${!isValid || isLoading ? 'bg-gray-200' : 'bg-brand-700'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`font-bold text-base ${!isValid ? 'text-gray-400' : 'text-white'}`}>
              Pay Advance {isValid ? formatCurrency(advanceAmount) : ''} →
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function PriceRow({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className={`${highlight ? 'text-brand-700 font-semibold' : 'text-gray-600'} ${bold ? 'font-bold text-gray-900' : ''}`}>
        {label}
      </Text>
      <Text className={`font-semibold ${highlight ? 'text-brand-700 text-lg' : 'text-gray-900'} ${bold ? 'text-lg' : ''}`}>
        {value}
      </Text>
    </View>
  );
}
