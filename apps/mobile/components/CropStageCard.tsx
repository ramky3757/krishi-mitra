import { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, Alert, Modal, ScrollView, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { STAGE_LABELS, advancePctForStage, type CropStage, type PlatformConfig } from '@/lib/pricing';
import { formatDate } from '@/lib/formatters';

const STAGE_ORDER: CropStage[] = ['pre_sowing', 'sowed', 'growing', 'pre_harvest', 'ready_now'];

export default function CropStageCard({
  listingId,
  currentStage,
  stageUpdatedAt,
  config,
  onStageUpdated,
}: {
  listingId: string;
  currentStage: CropStage;
  stageUpdatedAt: string | null;
  config: PlatformConfig | null;
  onStageUpdated: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState<CropStage | null>(null);
  const [photoUri, setPhotoUri] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const currentLabel = STAGE_LABELS[currentStage];
  const currentAdvancePct = config ? advancePctForStage(currentStage, config) : null;

  const openAdvanceModal = (stage: CropStage) => {
    setTargetStage(stage);
    setPhotoUri('');
    setNote('');
    setModalOpen(true);
  };

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  };

  const submitStageUpdate = async () => {
    if (!targetStage) return;
    if (!photoUri && targetStage !== 'pre_sowing') {
      Alert.alert('Photo required', 'Please attach a photo as proof of the stage update.');
      return;
    }
    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (photoUri) {
        const resp = await fetch(photoUri);
        const blob = await resp.blob();
        const path = `stage/${listingId}/${targetStage}-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from('listing-media')
          .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('listing-media').getPublicUrl(path);
        photoUrl = pub.publicUrl;
      }

      // Update the listing's stage
      const { error: updErr } = await supabase
        .from('crop_listings')
        .update({
          crop_stage: targetStage,
          stage_updated_at: new Date().toISOString(),
        })
        .eq('id', listingId);
      if (updErr) throw updErr;

      // Log a progress_update row so consumers see the change in the timeline
      if (photoUrl || note) {
        await supabase.from('progress_updates').insert({
          listing_id: listingId,
          milestone: targetStage,
          note: note || `Stage updated to ${STAGE_LABELS[targetStage].label}`,
          photo_url: photoUrl,
        });
      }

      // Also keep a record in listing_media so it shows in the gallery
      if (photoUrl) {
        await supabase.from('listing_media').insert({
          listing_id: listingId,
          url: photoUrl,
          type: 'photo',
        });
      }

      setModalOpen(false);
      onStageUpdated();

      Alert.alert(
        '✅ Stage updated',
        targetStage === 'sowed'
          ? 'Your buyers will be notified. Once Cashfree is live, this will also release the sowing payout.'
          : 'Your buyers will see the new stage and progress photo.'
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to update stage');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="bg-white rounded-3xl p-5">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="font-bold text-gray-900">Crop Stage</Text>
        {currentAdvancePct !== null && (
          <View className="bg-brand-50 rounded-full px-3 py-1">
            <Text className="text-brand-700 text-xs font-bold">{currentAdvancePct}% advance</Text>
          </View>
        )}
      </View>
      <Text className="text-gray-500 text-xs mb-4">
        New buyers pay {currentAdvancePct ?? 30}% advance at current stage
      </Text>

      {/* Stepper */}
      <View className="flex-row items-start justify-between mb-4">
        {STAGE_ORDER.map((s, i) => {
          const info = STAGE_LABELS[s];
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;
          return (
            <View key={s} className="items-center flex-1">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center mb-1 ${
                  isCurrent
                    ? 'bg-brand-700'
                    : isDone
                    ? 'bg-brand-300'
                    : 'bg-gray-100'
                }`}
              >
                <Text className={isFuture ? 'text-base opacity-40' : 'text-base'}>
                  {info.emoji}
                </Text>
              </View>
              <Text
                className={`text-[10px] text-center ${
                  isCurrent
                    ? 'text-brand-700 font-bold'
                    : isFuture
                    ? 'text-gray-400'
                    : 'text-gray-600'
                }`}
              >
                {info.label}
              </Text>
              {i < STAGE_ORDER.length - 1 && (
                <View
                  className={`absolute top-5 left-[60%] right-[-40%] h-0.5 ${
                    isDone ? 'bg-brand-300' : 'bg-gray-200'
                  }`}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Current stage detail */}
      <View className="flex-row items-center gap-3 p-3 bg-brand-50 rounded-2xl mb-3">
        <Text className="text-2xl">{currentLabel.emoji}</Text>
        <View className="flex-1">
          <Text className="font-bold text-gray-900">{currentLabel.label}</Text>
          <Text className="text-gray-600 text-xs">{currentLabel.description}</Text>
          {stageUpdatedAt && (
            <Text className="text-gray-400 text-[10px] mt-0.5">
              Updated {formatDate(stageUpdatedAt)}
            </Text>
          )}
        </View>
      </View>

      {/* Action buttons */}
      {currentIdx < STAGE_ORDER.length - 1 ? (
        <Pressable
          onPress={() => openAdvanceModal(STAGE_ORDER[currentIdx + 1])}
          className="bg-brand-700 rounded-2xl py-3 items-center"
        >
          <Text className="text-white font-bold">
            Advance to {STAGE_LABELS[STAGE_ORDER[currentIdx + 1]].emoji}{' '}
            {STAGE_LABELS[STAGE_ORDER[currentIdx + 1]].label} →
          </Text>
        </Pressable>
      ) : (
        <View className="bg-green-50 rounded-2xl py-3 items-center">
          <Text className="text-green-700 font-semibold text-sm">
            ✅ Crop ready — fulfill pending deliveries
          </Text>
        </View>
      )}

      {/* Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <ScrollView className="bg-white rounded-t-3xl" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            {targetStage && (
              <>
                <Text className="text-xl font-bold text-gray-900 mb-1">
                  Advance to {STAGE_LABELS[targetStage].emoji} {STAGE_LABELS[targetStage].label}
                </Text>
                <Text className="text-gray-500 text-sm mb-5">
                  {STAGE_LABELS[targetStage].description}
                </Text>

                <View className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-5">
                  <Text className="text-amber-800 text-xs">
                    📸 A photo is required as proof. New bookings from now on will pay{' '}
                    <Text className="font-bold">
                      {config ? advancePctForStage(targetStage, config) : '-'}%
                    </Text>{' '}
                    advance.
                  </Text>
                </View>

                <Text className="text-gray-700 font-semibold mb-2">Photo proof *</Text>
                <Pressable
                  onPress={pickPhoto}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-4 items-center mb-4"
                >
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} className="w-full h-48 rounded-xl" resizeMode="cover" />
                  ) : (
                    <>
                      <Text className="text-3xl mb-1">📷</Text>
                      <Text className="text-gray-500 text-sm">Tap to attach a farm photo</Text>
                    </>
                  )}
                </Pressable>

                <Text className="text-gray-700 font-semibold mb-2">Note (optional)</Text>
                <TextInput
                  className="border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-900 h-20 mb-5"
                  placeholder={
                    targetStage === 'sowed'
                      ? 'e.g. Sowed paddy on 15 acres, conditions look good'
                      : targetStage === 'ready_now'
                      ? 'e.g. Harvest complete, ready for dispatch'
                      : 'Describe the current state of the crop'
                  }
                  value={note}
                  onChangeText={setNote}
                  multiline
                />

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setModalOpen(false)}
                    className="flex-1 border border-gray-300 rounded-2xl py-3.5 items-center"
                  >
                    <Text className="text-gray-700 font-semibold">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={submitStageUpdate}
                    disabled={submitting}
                    className={`flex-1 rounded-2xl py-3.5 items-center ${
                      submitting ? 'bg-gray-300' : 'bg-brand-700'
                    }`}
                  >
                    {submitting ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold">Confirm Stage Update</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
