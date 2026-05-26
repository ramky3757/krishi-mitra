import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useListingsStore } from '@/stores/listingsStore';
import { useBookingsStore } from '@/stores/bookingsStore';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatWeight } from '@/lib/formatters';
import { computePriceBreakdown, getPlatformConfig, advancePctForStage, STAGE_LABELS, type PlatformConfig } from '@/lib/pricing';

export default function CheckoutScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const { selectedListing, fetchListingById } = useListingsStore();
  const { createBooking } = useBookingsStore();
  const { consumerProfile } = useAuthStore();
  const kycComplete = consumerProfile?.kyc_status === 'approved' || consumerProfile?.kyc_status === 'pending';

  useEffect(() => {
    // Gate booking on profile completion
    if (consumerProfile !== null && !kycComplete) {
      router.replace('/(auth)/consumer-kyc');
    }
  }, [consumerProfile, kycComplete]);

  const [qty, setQty] = useState('10');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('delivery');
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (listingId) fetchListingById(listingId);
    getPlatformConfig().then(setConfig);
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

  const cropStage = (listing as any).crop_stage ?? 'pre_sowing';
  const advancePct = config ? advancePctForStage(cropStage, config) : 30;
  const stageInfo = STAGE_LABELS[cropStage as keyof typeof STAGE_LABELS] ?? STAGE_LABELS.pre_sowing;

  const breakdown = config
    ? computePriceBreakdown({
        qtyKg: qtyNum,
        pricePerKg: listing.price_per_kg_final,
        deliveryMethod,
        config,
        advancePct,
      })
    : null;

  const advanceAmount = breakdown?.advanceAmount ?? 0;
  const totalAmount = breakdown?.totalConsumerPays ?? 0;
  const finalAmount = breakdown?.balanceAmount ?? 0;

  const isValid =
    qtyNum >= 1 &&
    qtyNum <= remainingQty &&
    (deliveryMethod === 'pickup' || address.trim().length > 0) &&
    !!breakdown;

  const handleBook = async () => {
    if (!isValid || isLoading || !breakdown) return;
    setIsLoading(true);
    try {
      const booking = await createBooking({
        listing_id: listingId,
        qty_kg: qtyNum,
        delivery_address: deliveryMethod === 'pickup' ? '' : address,
        notes,
      });

      const { supabase } = await import('@/lib/supabase');

      // Persist commission + delivery breakdown on the booking
      await supabase.from('bookings').update({
        delivery_method: deliveryMethod,
        delivery_charge: breakdown.deliveryCharge,
        subtotal: breakdown.subtotal,
        platform_fee_farmer: breakdown.farmerFee,
        platform_fee_consumer: breakdown.consumerFee,
        farmer_payout: breakdown.farmerPayout,
        total_consumer_pays: breakdown.totalConsumerPays,
        advance_amount: breakdown.advanceAmount,
        final_amount: breakdown.balanceAmount,
        booked_at_stage: cropStage,
        advance_pct_applied: advancePct,
      }).eq('id', booking.id);

      // Simulate advance payment received (replace with Razorpay when ready)
      await supabase.from('payments').insert({
        booking_id: booking.id,
        type: 'advance',
        amount: advanceAmount,
        status: 'completed',
        gateway_ref: `MOCK-${Date.now()}`,
      });
      await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', booking.id);

      // Navigate immediately — don't wait for user to tap an alert button
      router.replace('/(consumer)/bookings');
      Alert.alert(
        'Booking Confirmed! 🎉',
        `Your booking for ${formatWeight(qtyNum)} of ${listing.crop_name} is confirmed. Advance payment of ${formatCurrency(advanceAmount)} has been received.`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Booking failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 200 }}>
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

          {/* Crop stage + advance payment info */}
          {breakdown && (
            <View className="bg-white rounded-3xl p-5 gap-3">
              <View className="flex-row items-center gap-3 pb-3 border-b border-gray-100">
                <Text className="text-2xl">{stageInfo.emoji}</Text>
                <View className="flex-1">
                  <Text className="font-bold text-gray-900">{stageInfo.label}</Text>
                  <Text className="text-gray-500 text-xs">{stageInfo.description}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-2xl bg-brand-50 items-center justify-center">
                  <Text className="text-xl">💰</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-900">{advancePct}% Advance Today</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    {cropStage === 'ready_now'
                      ? 'Full payment now, delivered in days'
                      : `Balance ${formatCurrency(breakdown.balanceAmount)} due on ${deliveryMethod === 'pickup' ? 'pickup' : 'delivery'}`}
                  </Text>
                </View>
                <Text className="font-bold text-brand-700 text-lg">{formatCurrency(breakdown.advanceAmount)}</Text>
              </View>
            </View>
          )}

          {/* Delivery method */}
          <View className="bg-white rounded-3xl p-5">
            <Text className="font-bold text-gray-900 mb-3">How will you receive it?</Text>
            <View className="gap-2">
              <Pressable
                onPress={() => setDeliveryMethod('pickup')}
                className={`flex-row items-center gap-3 p-4 rounded-2xl border-2 ${deliveryMethod === 'pickup' ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}
              >
                <Text className="text-2xl">🚜</Text>
                <View className="flex-1">
                  <Text className={`font-bold ${deliveryMethod === 'pickup' ? 'text-brand-700' : 'text-gray-900'}`}>
                    Farm Pickup
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    Free · Visit the farm at harvest time
                  </Text>
                </View>
                {deliveryMethod === 'pickup' && <Text className="text-brand-700 text-lg">✓</Text>}
              </Pressable>

              <Pressable
                onPress={() => setDeliveryMethod('delivery')}
                className={`flex-row items-center gap-3 p-4 rounded-2xl border-2 ${deliveryMethod === 'delivery' ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}
              >
                <Text className="text-2xl">📦</Text>
                <View className="flex-1">
                  <Text className={`font-bold ${deliveryMethod === 'delivery' ? 'text-brand-700' : 'text-gray-900'}`}>
                    Home Delivery
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {config ? `₹${config.default_delivery_charge_per_kg}/kg · Delivered after harvest` : 'Calculating…'}
                  </Text>
                </View>
                {deliveryMethod === 'delivery' && <Text className="text-brand-700 text-lg">✓</Text>}
              </Pressable>
            </View>
          </View>

          {/* Delivery address — only when delivery selected */}
          {deliveryMethod === 'delivery' && (
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
          )}

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
          {breakdown && (
            <View className="bg-brand-50 border border-brand-200 rounded-3xl p-5">
              <Text className="font-bold text-gray-900 mb-4">Price Breakdown</Text>
              <View className="gap-2">
                <PriceRow label={`${formatWeight(qtyNum)} × ${formatCurrency(listing.price_per_kg_final)}/kg`} value={formatCurrency(breakdown.subtotal)} />
                {breakdown.deliveryCharge > 0 && (
                  <PriceRow label="Delivery charge" value={formatCurrency(breakdown.deliveryCharge)} />
                )}
                <PriceRow label={`Platform fee (${config?.consumer_fee_pct ?? 3}%)`} value={formatCurrency(breakdown.consumerFee)} />
                <View className="h-px bg-brand-200 my-1" />
                <PriceRow label="Total" value={formatCurrency(breakdown.totalConsumerPays)} bold />
                <View className="h-px bg-brand-200 my-1" />
                <PriceRow label={`Pay now (${advancePct}% advance)`} value={formatCurrency(breakdown.advanceAmount)} highlight />
                <PriceRow label={`Balance on ${deliveryMethod === 'pickup' ? 'pickup' : 'delivery'}`} value={formatCurrency(breakdown.balanceAmount)} />
              </View>
            </View>
          )}

          {/* Cancellation policy */}
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <Text className="font-semibold text-amber-800 mb-2">⚠️ Cancellation & Refund Policy</Text>
            <View className="gap-1.5">
              <PolicyRow stage="Within 48 hours of booking" refund="100%" />
              <PolicyRow stage="After 48 hours, before sowing" refund="80%" />
              <PolicyRow stage="After sowing, before flowering" refund="50%" />
              <PolicyRow stage="After flowering, before harvest" refund="25%" />
              <PolicyRow stage="After harvest" refund="0%" />
            </View>
            <Text className="text-amber-600 text-xs mt-2 italic">
              Refunds protect both sides: lower percentages cover the farmer's investment in your crop.
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

function PolicyRow({ stage, refund }: { stage: string; refund: string }) {
  const isFull = refund === '100%';
  const isNone = refund === '0%';
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-amber-800 text-sm flex-1 pr-2">{stage}</Text>
      <Text
        className={`text-sm font-bold ${
          isFull ? 'text-green-700' : isNone ? 'text-red-600' : 'text-amber-700'
        }`}
      >
        {refund}
      </Text>
    </View>
  );
}
