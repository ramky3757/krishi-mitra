import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import PhoneField from '@/components/PhoneField';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useDraft } from '@/lib/draftStorage';
import DraftBanner from '@/components/DraftBanner';
import TermsCheckbox from '@/components/TermsCheckbox';
import { TERMS_VERSION } from '@/lib/terms';

interface KYCData {
  fullName: string;
  phone: string;
  farmAddress: string;
  state: string;
  district: string;
  village: string;
  idDocUri: string;
  landDocUri: string;
  geoLat: number | null;
  geoLng: number | null;
}

export default function FarmerKYCScreen() {
  const { user, updateProfile, refreshProfile } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [termsAccepted, setTermsAccepted] = useState(false);

  const draftKey = `farmer-kyc:${user?.id ?? 'anon'}`;
  const initialData: KYCData = {
    fullName: user?.full_name ?? '',
    phone: user?.phone ?? '',
    farmAddress: '',
    state: '',
    district: '',
    village: '',
    idDocUri: '',
    landDocUri: '',
    geoLat: null,
    geoLng: null,
  };
  const [data, setData, draft] = useDraft<KYCData>(draftKey, initialData);

  // Ensure profile is loaded and pre-fill known fields
  useEffect(() => {
    if (!user?.id) {
      refreshProfile();
    }
  }, []);

  useEffect(() => {
    if (user) {
      setData((d) => ({
        ...d,
        fullName: d.fullName || user.full_name || '',
        phone: d.phone || user.phone || '',
      }));
    }
  }, [user?.id]);

  const pickDocument = async (field: 'idDocUri' | 'landDocUri') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setData((d) => ({ ...d, [field]: result.assets[0].uri }));
    }
  };

  const captureLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required to geo-tag your farm.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setData((d) => ({ ...d, geoLat: loc.coords.latitude, geoLng: loc.coords.longitude }));
    Alert.alert('Location captured', `Lat: ${loc.coords.latitude.toFixed(4)}, Lng: ${loc.coords.longitude.toFixed(4)}`);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setSubmitError(null);
    try {
      // Reuse cached session user — avoids a server round-trip
      const userId = user?.id;
      if (!userId) {
        setSubmitError('Session not found. Please sign out and sign in again.');
        setIsLoading(false);
        return;
      }

      // Upload both documents in PARALLEL (was sequential)
      const uploadDoc = async (uri: string | undefined, name: string): Promise<string> => {
        if (!uri) return '';
        try {
          const blob = await (await fetch(uri)).blob();
          const { data: up, error } = await supabase.storage
            .from('kyc-docs')
            .upload(`${userId}/${name}.jpg`, blob, { upsert: true });
          return error ? '' : (up?.path ?? '');
        } catch {
          return '';
        }
      };
      const [idDocUrl, landDocUrl] = await Promise.all([
        uploadDoc(data.idDocUri, 'id_doc'),
        uploadDoc(data.landDocUri, 'land_doc'),
      ]);

      // Run the user upsert + farmer_profile upsert in parallel
      const profileUpdates: Record<string, unknown> = { id: userId };
      if (data.fullName.trim()) profileUpdates.full_name = data.fullName.trim();
      if (data.phone.trim()) profileUpdates.phone = data.phone.trim();

      // Record terms acceptance on the user row
      profileUpdates.terms_version = TERMS_VERSION;
      profileUpdates.terms_accepted_at = new Date().toISOString();

      const [userRes, profileRes] = await Promise.all([
        supabase.from('users').upsert(profileUpdates),
        supabase.from('farmer_profiles').upsert({
          user_id: userId,
          kyc_status: 'pending',
          id_doc_url: idDocUrl || null,
          land_doc_url: landDocUrl || null,
          farm_geo_lat: data.geoLat,
          farm_geo_lng: data.geoLng,
          farm_address: data.farmAddress || null,
          state: data.state,
          district: data.district,
          village: data.village || null,
          verification_badges: [],
        }),
      ]);
      if (userRes.error) throw userRes.error;
      if (profileRes.error) throw profileRes.error;

      // Wipe the draft now that submission succeeded
      void draft.clear();

      // Navigate immediately — don't await profile refresh
      router.replace('/(farmer)/dashboard');
      void refreshProfile();
    } catch (e: any) {
      setSubmitError(e.message ?? 'Failed to submit KYC. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 px-6 pt-16 pb-8">
        {/* Progress */}
        <View className="flex-row gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-brand-600' : 'bg-gray-200'}`}
            />
          ))}
        </View>

        {/* Auto-resume banner */}
        <DraftBanner
          show={draft.resume}
          savedAt={draft.savedAt}
          onStartOver={() => {
            draft.clear();
            setData(initialData);
            setStep(1);
          }}
        />

        {step === 1 && <Step1 data={data} onChange={setData} onNext={() => setStep(2)} />}
        {step === 2 && <Step2 data={data} pickDocument={pickDocument} captureLocation={captureLocation} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && (
          <Step3
            data={data}
            isLoading={isLoading}
            error={submitError}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
            termsAccepted={termsAccepted}
            setTermsAccepted={setTermsAccepted}
          />
        )}
      </View>
    </ScrollView>
  );
}

function Step1({ data, onChange, onNext }: any) {
  // Accept both old format ("9876543210") and new format ("+919876543210") —
  // takes the last 10 digits and checks they form a valid Indian mobile.
  const phoneDigits = (data.phone ?? '').replace(/\D/g, '').slice(-10);
  const isPhoneValid = /^[6-9]\d{9}$/.test(phoneDigits);
  const isValid = data.fullName && isPhoneValid && data.state && data.district;
  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-1">Basic Details</Text>
      <Text className="text-gray-500 mb-8">Tell us about yourself and your farm location.</Text>

      <View className="gap-4">
        <LabeledInput label="Full Name *" placeholder="Your legal name" value={data.fullName} onChange={(v: string) => onChange((d: any) => ({ ...d, fullName: v }))} />
        <PhoneField label="Mobile Number" required value={data.phone} onChange={(v: string) => onChange((d: any) => ({ ...d, phone: v }))} />
        <LabeledInput label="Farm Address" placeholder="Village / Town, District" value={data.farmAddress} onChange={(v: string) => onChange((d: any) => ({ ...d, farmAddress: v }))} />
        <LabeledInput label="State *" placeholder="e.g. Telangana" value={data.state} onChange={(v: string) => onChange((d: any) => ({ ...d, state: v }))} />
        <LabeledInput label="District *" placeholder="e.g. Nalgonda" value={data.district} onChange={(v: string) => onChange((d: any) => ({ ...d, district: v }))} />
        <LabeledInput label="Village" placeholder="Your village name" value={data.village} onChange={(v: string) => onChange((d: any) => ({ ...d, village: v }))} />
      </View>

      <View className="flex-1" />
      <Pressable
        onPress={onNext}
        disabled={!isValid}
        className={`rounded-2xl py-4 items-center mt-8 ${!isValid ? 'bg-gray-200' : 'bg-brand-700'}`}
      >
        <Text className={`font-bold text-base ${!isValid ? 'text-gray-400' : 'text-white'}`}>Next →</Text>
      </Pressable>
    </View>
  );
}

function Step2({ data, pickDocument, captureLocation, onBack, onNext }: any) {
  const isValid = data.idDocUri;
  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-1">Verification Documents</Text>
      <Text className="text-gray-500 mb-8">Upload documents to get verified. Admin reviews within 24–48 hours.</Text>

      <View className="gap-5">
        <DocUpload
          label="Government ID *"
          hint="Aadhaar / Voter ID / Driving License"
          uploaded={!!data.idDocUri}
          onPress={() => pickDocument('idDocUri')}
        />
        <DocUpload
          label="Land Record"
          hint="Khasra / Patta / Lease agreement"
          uploaded={!!data.landDocUri}
          onPress={() => pickDocument('landDocUri')}
        />
        <Pressable
          onPress={captureLocation}
          className={`border-2 rounded-2xl p-4 flex-row items-center gap-3 ${data.geoLat ? 'border-brand-600 bg-brand-50' : 'border-dashed border-gray-300'}`}
        >
          <Text className="text-2xl">{data.geoLat ? '✅' : '📍'}</Text>
          <View className="flex-1">
            <Text className="font-semibold text-gray-800">Farm Location (GPS)</Text>
            <Text className="text-sm text-gray-500">
              {data.geoLat ? `${data.geoLat.toFixed(4)}, ${data.geoLng?.toFixed(4)}` : 'Tap to capture your farm GPS coordinates'}
            </Text>
          </View>
        </Pressable>
      </View>

      <View className="flex-1" />
      <View className="flex-row gap-3 mt-8">
        <Pressable onPress={onBack} className="flex-1 border-2 border-gray-200 rounded-2xl py-4 items-center">
          <Text className="font-semibold text-gray-700">← Back</Text>
        </Pressable>
        <Pressable onPress={onNext} disabled={!isValid} className={`flex-1 rounded-2xl py-4 items-center ${!isValid ? 'bg-gray-200' : 'bg-brand-700'}`}>
          <Text className={`font-bold ${!isValid ? 'text-gray-400' : 'text-white'}`}>Next →</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Step3({ data, isLoading, error, onBack, onSubmit, termsAccepted, setTermsAccepted }: any) {
  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-1">Review & Submit</Text>
      <Text className="text-gray-500 mb-8">Your KYC will be reviewed within 24–48 hours. You can still explore the app while waiting.</Text>

      {error && (
        <View className="mb-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <Text className="text-red-700 text-sm font-medium">⚠️ {error}</Text>
        </View>
      )}

      <View className="bg-brand-50 border border-brand-200 rounded-2xl p-5 gap-3">
        <ReviewRow icon="👤" label="Name" value={data.fullName} />
        <ReviewRow icon="📱" label="Mobile" value={data.phone} />
        <ReviewRow icon="📍" label="Location" value={`${data.district}, ${data.state}`} />
        <ReviewRow icon="🪪" label="Govt ID" value={data.idDocUri ? 'Uploaded ✓' : 'Not uploaded'} />
        <ReviewRow icon="📄" label="Land Record" value={data.landDocUri ? 'Uploaded ✓' : 'Not uploaded'} />
        <ReviewRow icon="🗺️" label="GPS" value={data.geoLat ? 'Captured ✓' : 'Not captured'} />
      </View>

      <View className="mt-5 bg-harvest-100 border border-harvest-200 rounded-2xl p-4">
        <Text className="text-sm text-soil-500 font-medium">
          ℹ️ After submission, our team will verify your documents. You'll be notified via SMS once approved. Listing crops requires KYC approval.
        </Text>
      </View>

      {/* Terms acceptance */}
      <View className="mt-5">
        <TermsCheckbox accepted={termsAccepted} onToggle={() => setTermsAccepted(!termsAccepted)} role="farmer" />
      </View>

      <View className="flex-1" />
      <View className="flex-row gap-3 mt-8">
        <Pressable onPress={onBack} className="flex-1 border-2 border-gray-200 rounded-2xl py-4 items-center">
          <Text className="font-semibold text-gray-700">← Back</Text>
        </Pressable>
        <Pressable
          onPress={onSubmit}
          disabled={isLoading || !termsAccepted}
          className={`flex-2 flex-1 rounded-2xl py-4 items-center ${isLoading || !termsAccepted ? 'bg-gray-200' : 'bg-brand-700'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`font-bold ${!termsAccepted ? 'text-gray-400' : 'text-white'}`}>
              Submit KYC
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function LabeledInput({ label, placeholder, value, onChange, keyboardType }: any) {
  return (
    <View>
      <Text className="text-gray-700 font-semibold mb-1.5">{label}</Text>
      <TextInput
        className="border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-base text-gray-900"
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

function DocUpload({ label, hint, uploaded, onPress }: any) {
  return (
    <Pressable
      onPress={onPress}
      className={`border-2 rounded-2xl p-4 flex-row items-center gap-3 ${uploaded ? 'border-brand-600 bg-brand-50' : 'border-dashed border-gray-300'}`}
    >
      <Text className="text-2xl">{uploaded ? '✅' : '📤'}</Text>
      <View className="flex-1">
        <Text className="font-semibold text-gray-800">{label}</Text>
        <Text className="text-sm text-gray-500">{uploaded ? 'Document uploaded successfully' : hint}</Text>
      </View>
    </Pressable>
  );
}

function ReviewRow({ icon, label, value }: any) {
  return (
    <View className="flex-row items-center gap-3">
      <Text className="text-lg w-7">{icon}</Text>
      <Text className="text-gray-500 w-24">{label}</Text>
      <Text className="text-gray-900 font-medium flex-1">{value}</Text>
    </View>
  );
}
