import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Switch, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { CROP_CATEGORIES, FARMING_METHODS } from '@/constants';
import { CropCategory, FarmingMethod } from '@/types';

interface ListingForm {
  cropCategory: CropCategory | '';
  cropName: string;
  cropVariety: string;
  farmSizeAcres: string;
  totalYieldKg: string;
  availableQtyKg: string;
  pricePerKgAdvance: string;
  pricePerKgFinal: string;
  advancePercentage: string;
  sowingDate: string;
  harvestDate: string;
  farmingMethod: FarmingMethod | '';
  pesticidesInfo: string;
  isZeroPesticide: boolean;
  waterSource: string;
  soilType: string;
  description: string;
  photos: string[];
}

const STEPS = ['Crop Info', 'Pricing', 'Farm Details', 'Photos', 'Review'];

export default function CreateListingScreen() {
  const { user, farmerProfile } = useAuthStore();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState<ListingForm>({
    cropCategory: '',
    cropName: '',
    cropVariety: '',
    farmSizeAcres: '',
    totalYieldKg: '',
    availableQtyKg: '',
    pricePerKgAdvance: '',
    pricePerKgFinal: '',
    advancePercentage: '25',
    sowingDate: '',
    harvestDate: '',
    farmingMethod: '',
    pesticidesInfo: '',
    isZeroPesticide: false,
    waterSource: '',
    soilType: '',
    description: '',
    photos: [],
  });

  const update = (key: keyof ListingForm, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const pickPhoto = async () => {
    if (form.photos.length >= 5) { setToast('Maximum 5 photos allowed'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      update('photos', [...form.photos, ...uris].slice(0, 5));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Upload photos
      const mediaUrls: string[] = [];
      for (const uri of form.photos) {
        const blob = await (await fetch(uri)).blob();
        const filename = `${user?.id}/${Date.now()}.jpg`;
        const { data: up } = await supabase.storage.from('listing-media').upload(filename, blob);
        if (up) mediaUrls.push(up.path);
      }

      // Create listing
      const { data: listing, error } = await supabase.from('crop_listings').insert({
        farmer_id: user?.id,
        crop_category: form.cropCategory,
        crop_name: form.cropName,
        crop_variety: form.cropVariety || null,
        farm_size_acres: parseFloat(form.farmSizeAcres),
        total_yield_kg: parseFloat(form.totalYieldKg),
        available_qty_kg: parseFloat(form.availableQtyKg),
        booked_qty_kg: 0,
        price_per_kg_advance: parseFloat(form.pricePerKgAdvance),
        price_per_kg_final: parseFloat(form.pricePerKgFinal),
        advance_percentage: parseFloat(form.advancePercentage),
        sowing_date: form.sowingDate,
        harvest_date: form.harvestDate,
        farming_method: form.farmingMethod,
        pesticides_info: form.pesticidesInfo || null,
        is_zero_pesticide: form.isZeroPesticide,
        water_source: form.waterSource || null,
        soil_type: form.soilType || null,
        description: form.description || null,
        state: farmerProfile?.state ?? '',
        district: farmerProfile?.district ?? '',
        village: farmerProfile?.village ?? null,
        geo_lat: farmerProfile?.farm_geo_lat ?? null,
        geo_lng: farmerProfile?.farm_geo_lng ?? null,
        status: 'pending_approval',
      }).select().single();

      if (error) throw error;

      // Insert media records
      if (mediaUrls.length > 0) {
        await supabase.from('listing_media').insert(
          mediaUrls.map((url) => ({ listing_id: listing.id, url, type: 'photo' }))
        );
      }

      setToast('Listing submitted! Pending admin approval.');
      setTimeout(() => router.replace('/(farmer)/listings'), 1200);
    } catch (e: any) {
      setToast(e.message ?? 'Failed to create listing');
    } finally {
      setIsLoading(false);
    }
  };

  // Build a list of missing required fields for the current step so the user
  // can see exactly what's blocking the Next button.
  const isFilled = (v: string) => !!v && v.trim().length > 0;
  const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v.trim());
  const isPositiveNumber = (v: string) => {
    const n = parseFloat(v);
    return !Number.isNaN(n) && n > 0;
  };

  const missingByStep: Record<number, string[]> = {
    0: [
      !form.cropCategory && 'Category',
      !isFilled(form.cropName) && 'Crop Name',
      !isDate(form.sowingDate) && 'Sowing Date (YYYY-MM-DD)',
      !isDate(form.harvestDate) && 'Harvest Date (YYYY-MM-DD)',
    ].filter(Boolean) as string[],
    1: [
      !isPositiveNumber(form.totalYieldKg) && 'Total Yield (kg)',
      !isPositiveNumber(form.availableQtyKg) && 'Available Quantity (kg)',
      !isPositiveNumber(form.pricePerKgFinal) && 'Final Price (₹/kg)',
      !isPositiveNumber(form.pricePerKgAdvance) && 'Advance Price (₹/kg)',
    ].filter(Boolean) as string[],
    2: [
      !isPositiveNumber(form.farmSizeAcres) && 'Farm Size (acres)',
      !form.farmingMethod && 'Farming Method',
    ].filter(Boolean) as string[],
    3: [],
    4: [],
  };

  const missing = missingByStep[step];
  const canNext = missing.length === 0;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Pressable onPress={() => (step > 0 ? setStep(step - 1) : router.back())} className="mb-3">
          <Text className="text-brand-700">← {step > 0 ? 'Back' : 'Cancel'}</Text>
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Post Your Crop</Text>

        {/* Step indicator */}
        <View className="flex-row gap-1.5 mt-3">
          {STEPS.map((s, i) => (
            <View key={s} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-brand-600' : 'bg-gray-200'}`} />
          ))}
        </View>
        <Text className="text-gray-500 text-xs mt-1.5">Step {step + 1} of {STEPS.length}: {STEPS[step]}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {step === 0 && <Step0 form={form} update={update} />}
        {step === 1 && <Step1 form={form} update={update} />}
        {step === 2 && <Step2 form={form} update={update} />}
        {step === 3 && <Step3 form={form} pickPhoto={pickPhoto} update={update} />}
        {step === 4 && <Step4 form={form} />}
      </ScrollView>

      {/* Footer nav */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-3 pb-6">
        {missing.length > 0 && (
          <View className="mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <Text className="text-amber-800 text-xs font-semibold mb-0.5">
              Fill these to continue:
            </Text>
            <Text className="text-amber-700 text-xs">{missing.join(' · ')}</Text>
          </View>
        )}
        <Pressable
          onPress={() => step < 4 ? setStep(step + 1) : handleSubmit()}
          disabled={!canNext || isLoading}
          className={`rounded-2xl py-4 items-center ${!canNext || isLoading ? 'bg-gray-200' : 'bg-brand-700'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`font-bold text-base ${!canNext ? 'text-gray-400' : 'text-white'}`}>
              {step < 4 ? 'Next →' : 'Submit for Approval'}
            </Text>
          )}
        </Pressable>
      </View>

      <Snackbar
        visible={!!toast}
        onDismiss={() => setToast(null)}
        duration={4000}
        action={{ label: 'OK', onPress: () => setToast(null) }}
      >
        {toast ?? ''}
      </Snackbar>
    </View>
  );
}

// Step 0: Crop info
function Step0({ form, update }: any) {
  return (
    <View className="gap-5">
      <SectionTitle>What crop are you selling?</SectionTitle>

      <View>
        <Label>Category *</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pb-1">
            {CROP_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                onPress={() => update('cropCategory', cat.value)}
                className={`flex-row items-center gap-2 rounded-2xl px-4 py-2.5 border-2 ${form.cropCategory === cat.value ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}
              >
                <Text>{cat.emoji}</Text>
                <Text className={`text-sm font-medium ${form.cropCategory === cat.value ? 'text-brand-700' : 'text-gray-700'}`}>{cat.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <LabeledInput label="Crop Name *" placeholder="e.g. Sona Masuri Rice" value={form.cropName} onChange={(v: string) => update('cropName', v)} />
      <LabeledInput label="Variety (optional)" placeholder="e.g. Basmati, HMT..." value={form.cropVariety} onChange={(v: string) => update('cropVariety', v)} />
      <LabeledInput label="Sowing Date *" placeholder="YYYY-MM-DD" value={form.sowingDate} onChange={(v: string) => update('sowingDate', v)} />
      <LabeledInput label="Expected Harvest Date *" placeholder="YYYY-MM-DD" value={form.harvestDate} onChange={(v: string) => update('harvestDate', v)} />
    </View>
  );
}

// Step 1: Pricing & quantity
function Step1({ form, update }: any) {
  return (
    <View className="gap-5">
      <SectionTitle>Quantity & Pricing</SectionTitle>
      <LabeledInput label="Total Expected Yield (kg) *" placeholder="e.g. 1000" value={form.totalYieldKg} onChange={(v: string) => update('totalYieldKg', v)} keyboardType="numeric" />
      <LabeledInput label="Quantity Available to Pre-sell (kg) *" placeholder="e.g. 500" value={form.availableQtyKg} onChange={(v: string) => update('availableQtyKg', v)} keyboardType="numeric" />

      <View className="bg-brand-50 rounded-2xl p-4">
        <Text className="font-semibold text-brand-800 mb-1">💡 Pricing Tip</Text>
        <Text className="text-brand-700 text-sm">Set a lower advance price to attract buyers, and the full price on delivery. Consumers pay 25–30% upfront.</Text>
      </View>

      <LabeledInput label="Final Price per kg (₹) *" placeholder="Price on delivery" value={form.pricePerKgFinal} onChange={(v: string) => update('pricePerKgFinal', v)} keyboardType="numeric" />
      <LabeledInput label="Advance Price per kg (₹) *" placeholder="Price collected upfront" value={form.pricePerKgAdvance} onChange={(v: string) => update('pricePerKgAdvance', v)} keyboardType="numeric" />

      <View>
        <Label>Advance % from consumer</Label>
        <View className="flex-row gap-3">
          {['25', '30'].map((pct) => (
            <Pressable
              key={pct}
              onPress={() => update('advancePercentage', pct)}
              className={`flex-1 py-3 rounded-2xl border-2 items-center ${form.advancePercentage === pct ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}
            >
              <Text className={`font-bold ${form.advancePercentage === pct ? 'text-brand-700' : 'text-gray-500'}`}>{pct}%</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

// Step 2: Farm details
function Step2({ form, update }: any) {
  return (
    <View className="gap-5">
      <SectionTitle>Farm Details</SectionTitle>
      <LabeledInput label="Farm Size (acres) *" placeholder="e.g. 2.5" value={form.farmSizeAcres} onChange={(v: string) => update('farmSizeAcres', v)} keyboardType="numeric" />

      <View>
        <Label>Farming Method *</Label>
        <View className="gap-2">
          {FARMING_METHODS.map((m) => (
            <Pressable
              key={m.value}
              onPress={() => update('farmingMethod', m.value)}
              className={`flex-row items-start gap-3 p-4 rounded-2xl border-2 ${form.farmingMethod === m.value ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}
            >
              <View className={`w-5 h-5 rounded-full border-2 mt-0.5 items-center justify-center ${form.farmingMethod === m.value ? 'border-brand-600 bg-brand-600' : 'border-gray-400'}`}>
                {form.farmingMethod === m.value && <View className="w-2 h-2 rounded-full bg-white" />}
              </View>
              <View className="flex-1">
                <Text className={`font-semibold ${form.farmingMethod === m.value ? 'text-brand-700' : 'text-gray-800'}`}>{m.label}</Text>
                <Text className="text-gray-500 text-sm mt-0.5">{m.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="flex-row items-center justify-between bg-white border-2 border-gray-200 rounded-2xl px-4 py-3.5">
        <View className="flex-1">
          <Text className="font-semibold text-gray-800">Zero Pesticide</Text>
          <Text className="text-gray-400 text-sm">No pesticides used at all</Text>
        </View>
        <Switch
          value={form.isZeroPesticide}
          onValueChange={(v) => update('isZeroPesticide', v)}
          trackColor={{ true: '#1a6b3c' }}
        />
      </View>

      {!form.isZeroPesticide && (
        <LabeledInput label="Pesticides / Inputs Used" placeholder="List chemicals/dosages or 'None'" value={form.pesticidesInfo} onChange={(v: string) => update('pesticidesInfo', v)} multiline />
      )}

      <LabeledInput label="Water Source" placeholder="e.g. Rain-fed, Borewell, Canal" value={form.waterSource} onChange={(v: string) => update('waterSource', v)} />
      <LabeledInput label="Soil Type" placeholder="e.g. Black cotton, Red loamy" value={form.soilType} onChange={(v: string) => update('soilType', v)} />
      <LabeledInput label="Description" placeholder="Describe your crop, practices, quality..." value={form.description} onChange={(v: string) => update('description', v)} multiline />
    </View>
  );
}

// Step 3: Photos
function Step3({ form, pickPhoto, update }: any) {
  return (
    <View className="gap-5">
      <SectionTitle>Farm Photos</SectionTitle>
      <Text className="text-gray-500 -mt-3">Add up to 5 photos of your farm and crop. Good photos get more bookings!</Text>

      <View className="flex-row flex-wrap gap-3">
        {form.photos.map((uri: string, i: number) => (
          <View key={i} className="relative">
            <Image source={{ uri }} className="w-28 h-28 rounded-2xl" />
            <Pressable
              onPress={() => update('photos', form.photos.filter((_: string, j: number) => j !== i))}
              className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full items-center justify-center"
            >
              <Text className="text-white text-xs">✕</Text>
            </Pressable>
          </View>
        ))}
        {form.photos.length < 5 && (
          <Pressable
            onPress={pickPhoto}
            className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 items-center justify-center"
          >
            <Text className="text-3xl text-gray-400">+</Text>
            <Text className="text-gray-400 text-xs mt-1">Add Photo</Text>
          </Pressable>
        )}
      </View>

      <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <Text className="text-amber-700 text-sm">
          📸 Tips: Take clear photos of the field, crop plants, soil, and any organic certification. Natural light works best.
        </Text>
      </View>
    </View>
  );
}

// Step 4: Review summary
function Step4({ form }: any) {
  const category = CROP_CATEGORIES.find((c) => c.value === form.cropCategory);
  const method = FARMING_METHODS.find((m) => m.value === form.farmingMethod);
  return (
    <View className="gap-4">
      <SectionTitle>Review Your Listing</SectionTitle>
      <View className="bg-white rounded-3xl p-5 gap-3">
        <ReviewRow label="Crop" value={`${category?.emoji} ${form.cropName}${form.cropVariety ? ` (${form.cropVariety})` : ''}`} />
        <ReviewRow label="Category" value={category?.label ?? ''} />
        <ReviewRow label="Total Yield" value={`${form.totalYieldKg} kg`} />
        <ReviewRow label="Available to sell" value={`${form.availableQtyKg} kg`} />
        <ReviewRow label="Final Price" value={`₹${form.pricePerKgFinal}/kg`} />
        <ReviewRow label="Advance Price" value={`₹${form.pricePerKgAdvance}/kg (${form.advancePercentage}%)`} />
        <ReviewRow label="Sowing Date" value={form.sowingDate} />
        <ReviewRow label="Harvest Date" value={form.harvestDate} />
        <ReviewRow label="Farm Size" value={`${form.farmSizeAcres} acres`} />
        <ReviewRow label="Farming Method" value={method?.label ?? form.farmingMethod} />
        <ReviewRow label="Zero Pesticide" value={form.isZeroPesticide ? 'Yes ✅' : 'No'} />
        <ReviewRow label="Photos" value={`${form.photos.length} uploaded`} />
      </View>
      <View className="bg-brand-50 border border-brand-200 rounded-2xl p-4">
        <Text className="text-brand-700 text-sm">
          ℹ️ Your listing will be reviewed by our team before going live. This usually takes 2–4 hours. You'll be notified via SMS.
        </Text>
      </View>
    </View>
  );
}

// Reusable components
function SectionTitle({ children }: { children: string }) {
  return <Text className="text-xl font-bold text-gray-900">{children}</Text>;
}
function Label({ children }: { children: string }) {
  return <Text className="text-gray-700 font-semibold mb-2">{children}</Text>;
}
function LabeledInput({ label, placeholder, value, onChange, keyboardType, multiline }: any) {
  return (
    <View>
      <Label>{label}</Label>
      <TextInput
        className={`border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 ${multiline ? 'h-24' : ''}`}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center">
      <Text className="text-gray-500 w-36">{label}</Text>
      <Text className="text-gray-900 font-medium flex-1">{value}</Text>
    </View>
  );
}
