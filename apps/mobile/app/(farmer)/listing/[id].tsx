import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Image, Alert, ActivityIndicator, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { formatWeight, formatCurrency, formatDate } from '@/lib/formatters';
import { CROP_MILESTONES } from '@/constants';
import { CropMilestone } from '@/types';
import CropStageCard from '@/components/CropStageCard';
import { getPlatformConfig, type PlatformConfig, type CropStage } from '@/lib/pricing';

export default function FarmerListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updateModal, setUpdateModal] = useState(false);
  const [milestone, setMilestone] = useState<CropMilestone>('sowing');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [config, setConfig] = useState<PlatformConfig | null>(null);

  const loadListing = async () => {
    const { data } = await supabase
      .from('crop_listings')
      .select('*, media:listing_media(*), progress_updates(*), bookings(*, consumer:consumer_profiles(*, user:users(*)))')
      .eq('id', id)
      .single();
    setListing(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadListing();
    getPlatformConfig().then(setConfig);
  }, [id]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const postUpdate = async () => {
    setIsPosting(true);
    try {
      let photoUrl = '';
      if (photoUri) {
        const blob = await (await fetch(photoUri)).blob();
        const { data: up } = await supabase.storage.from('listing-media').upload(`progress/${id}/${Date.now()}.jpg`, blob);
        photoUrl = up?.path ?? '';
      }
      await supabase.from('progress_updates').insert({ listing_id: id, milestone, note, photo_url: photoUrl || null });
      setUpdateModal(false);
      setNote('');
      setPhotoUri('');
      loadListing();
      Alert.alert('Update Posted', 'Your crop progress update has been shared with all buyers.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleVisitAction = async (visitId: string, action: 'approved' | 'rejected') => {
    await supabase.from('farm_visits').update({ status: action }).eq('id', visitId);
    loadListing();
  };

  if (isLoading || !listing) {
    return <View className="flex-1 items-center justify-center"><ActivityIndicator color="#1a6b3c" /></View>;
  }

  const pendingVisits = (listing.bookings ?? [])
    .flatMap((b: any) => b.visits ?? [])
    .filter((v: any) => v.status === 'requested');

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="bg-brand-700 px-5 pt-14 pb-6">
          <Pressable onPress={() => router.back()} className="mb-3">
            <Text className="text-brand-200">← Back</Text>
          </Pressable>
          <Text className="text-white text-xl font-bold">{listing.crop_name}</Text>
          <Text className="text-brand-300">Harvest: {formatDate(listing.harvest_date)}</Text>
        </View>

        <View className="px-5 -mt-4 gap-4">
          {/* Stats */}
          <View className="flex-row gap-3">
            <MiniStat icon="📦" label="Bookings" value={String(listing.bookings?.length ?? 0)} />
            <MiniStat icon="⚖️" label="Booked" value={formatWeight(listing.booked_qty_kg ?? 0)} />
            <MiniStat icon="💰" label="Revenue" value={formatCurrency(
              (listing.bookings ?? []).reduce((s: number, b: any) => s + (b.advance_amount ?? 0), 0)
            )} />
          </View>

          {/* Crop stage tracker */}
          <CropStageCard
            listingId={id as string}
            currentStage={(listing.crop_stage ?? 'pre_sowing') as CropStage}
            stageUpdatedAt={listing.stage_updated_at}
            config={config}
            onStageUpdated={loadListing}
          />

          {/* Post progress update */}
          <Pressable
            onPress={() => setUpdateModal(true)}
            className="bg-brand-700 rounded-3xl p-5 flex-row items-center gap-3"
          >
            <Text className="text-3xl">📸</Text>
            <View className="flex-1">
              <Text className="text-white font-bold">Post Progress Update</Text>
              <Text className="text-brand-300 text-sm">Share crop growth with your buyers</Text>
            </View>
            <Text className="text-white text-xl">+</Text>
          </Pressable>

          {/* Progress timeline */}
          {(listing.progress_updates ?? []).length > 0 && (
            <View className="bg-white rounded-3xl p-5">
              <Text className="font-bold text-gray-900 mb-4">Progress Updates</Text>
              {listing.progress_updates.map((u: any, i: number) => {
                const m = CROP_MILESTONES.find((ml) => ml.value === u.milestone);
                return (
                  <View key={u.id} className="flex-row gap-3 mb-4">
                    <View className="items-center">
                      <View className="w-8 h-8 rounded-full bg-brand-700 items-center justify-center">
                        <Text className="text-white text-xs font-bold">{i + 1}</Text>
                      </View>
                      {i < listing.progress_updates.length - 1 && <View className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                    </View>
                    <View className="flex-1 pb-2">
                      <Text className="font-semibold text-gray-900">{m?.label}</Text>
                      <Text className="text-gray-400 text-xs">{formatDate(u.created_at)}</Text>
                      {u.note && <Text className="text-gray-600 text-sm mt-1">{u.note}</Text>}
                      {u.photo_url && <Image source={{ uri: u.photo_url }} className="w-full h-40 rounded-xl mt-2" resizeMode="cover" />}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Pending visit requests */}
          {pendingVisits.length > 0 && (
            <View className="bg-white rounded-3xl p-5">
              <Text className="font-bold text-gray-900 mb-4">Visit Requests ({pendingVisits.length})</Text>
              {pendingVisits.map((visit: any) => (
                <View key={visit.id} className="mb-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <Text className="font-semibold text-gray-800">📅 {formatDate(visit.requested_date)}</Text>
                  {visit.notes && <Text className="text-gray-500 text-sm mt-0.5">{visit.notes}</Text>}
                  <View className="flex-row gap-2 mt-3">
                    <Pressable
                      onPress={() => handleVisitAction(visit.id, 'rejected')}
                      className="flex-1 border border-red-300 rounded-xl py-2 items-center"
                    >
                      <Text className="text-red-600 font-medium text-sm">Decline</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleVisitAction(visit.id, 'approved')}
                      className="flex-1 bg-brand-700 rounded-xl py-2 items-center"
                    >
                      <Text className="text-white font-medium text-sm">Approve</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Bookings list */}
          {(listing.bookings ?? []).length > 0 && (
            <View className="bg-white rounded-3xl p-5">
              <Text className="font-bold text-gray-900 mb-4">Bookings</Text>
              {listing.bookings.map((b: any) => (
                <View key={b.id} className="flex-row items-center gap-3 py-3 border-b border-gray-50">
                  <View className="w-10 h-10 rounded-full bg-brand-100 items-center justify-center">
                    <Text>🧑</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{b.consumer?.user?.full_name ?? 'Consumer'}</Text>
                    <Text className="text-gray-400 text-xs">{formatWeight(b.qty_kg)} · {b.status}</Text>
                  </View>
                  <Text className="text-brand-700 font-semibold">{formatCurrency(b.advance_amount)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Progress update modal */}
      <Modal visible={updateModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <Text className="text-xl font-bold text-gray-900 mb-5">Post Progress Update</Text>

            <Text className="text-gray-700 font-semibold mb-2">Milestone *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {CROP_MILESTONES.map((m) => (
                  <Pressable
                    key={m.value}
                    onPress={() => setMilestone(m.value as CropMilestone)}
                    className={`rounded-2xl px-4 py-2 border-2 ${milestone === m.value ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}
                  >
                    <Text className={`text-sm font-medium ${milestone === m.value ? 'text-brand-700' : 'text-gray-700'}`}>{m.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text className="text-gray-700 font-semibold mb-2">Note</Text>
            <TextInput
              className="border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-900 h-20 mb-4"
              placeholder="Describe the crop progress..."
              value={note}
              onChangeText={setNote}
              multiline
            />

            <Pressable onPress={pickPhoto} className="flex-row items-center gap-3 border-2 border-dashed border-gray-300 rounded-2xl p-4 mb-5">
              <Text className="text-2xl">{photoUri ? '✅' : '📷'}</Text>
              <Text className="text-gray-500">{photoUri ? 'Photo selected' : 'Attach a farm photo'}</Text>
            </Pressable>

            <View className="flex-row gap-3">
              <Pressable onPress={() => setUpdateModal(false)} className="flex-1 border border-gray-300 rounded-2xl py-3.5 items-center">
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable onPress={postUpdate} disabled={isPosting} className="flex-1 bg-brand-700 rounded-2xl py-3.5 items-center">
                {isPosting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Post Update</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 items-center">
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text className="text-gray-900 font-bold">{value}</Text>
      <Text className="text-gray-400 text-xs">{label}</Text>
    </View>
  );
}
