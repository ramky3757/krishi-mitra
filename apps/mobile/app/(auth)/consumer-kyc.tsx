import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import PhoneField from '@/components/PhoneField';
import { supabase } from '@/lib/supabase';
import { useDraft } from '@/lib/draftStorage';
import DraftBanner from '@/components/DraftBanner';

const ID_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'passport', label: 'Passport' },
];

type ConsumerKYCForm = {
  fullName: string;
  phone: string;
  profession: string;
  addressLine: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  idType: string;
  idNumber: string;
  idImage: string | null;
};

const INITIAL_FORM: ConsumerKYCForm = {
  fullName: '',
  phone: '',
  profession: '',
  addressLine: '',
  city: '',
  district: '',
  state: '',
  pincode: '',
  idType: 'aadhaar',
  idNumber: '',
  idImage: null,
};

export default function ConsumerKYCScreen() {
  const { user, refreshProfile } = useAuthStore();

  const draftKey = `consumer-kyc:${user?.id ?? 'anon'}`;
  const [form, setForm, draft] = useDraft<ConsumerKYCForm>(draftKey, INITIAL_FORM);

  // Per-field setters that update the form object
  const set = <K extends keyof ConsumerKYCForm>(key: K) =>
    (value: ConsumerKYCForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const { fullName, phone, profession, addressLine, city, district, state, pincode, idType, idNumber, idImage } = form;
  const setFullName = set('fullName');
  const setPhone = set('phone');
  const setProfession = set('profession');
  const setAddressLine = set('addressLine');
  const setCity = set('city');
  const setDistrict = set('district');
  const setState = set('state');
  const setPincode = set('pincode');
  const setIdType = set('idType');
  const setIdNumber = set('idNumber');
  const setIdImage = (v: string | null) => setForm((f) => ({ ...f, idImage: v }));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill from existing profile — but ONLY if draft hasn't already populated
  // these fields (don't overwrite the user's in-progress edits).
  useEffect(() => {
    if (!user?.id || !draft.hydrated) return;
    (async () => {
      const [uRes, cpRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('consumer_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      ]);
      setForm((f) => {
        const u = uRes.data;
        const cp = cpRes.data;
        return {
          ...f,
          fullName: f.fullName || u?.full_name || '',
          phone: f.phone || u?.phone || '',
          profession: f.profession || cp?.profession || '',
          addressLine: f.addressLine || cp?.address_line || '',
          city: f.city || cp?.city || '',
          district: f.district || cp?.district || '',
          state: f.state || cp?.state || '',
          pincode: f.pincode || cp?.pincode || '',
          idType: f.idType || cp?.government_id_type || 'aadhaar',
          idNumber: f.idNumber || cp?.government_id_number || '',
          idImage: f.idImage || cp?.government_id_url || null,
        };
      });
    })();
  }, [user?.id, draft.hydrated]);

  const pickIdImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: false,
    });
    if (!res.canceled && res.assets[0]) setIdImage(res.assets[0].uri);
  };

  const uploadIdImage = async (uri: string): Promise<string | null> => {
    try {
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const ext = uri.split('.').pop() || 'jpg';
      const path = `${user!.id}/government-id.${ext}`;
      const { error: upErr } = await supabase.storage.from('kyc-documents').upload(path, blob, {
        upsert: true,
        contentType: blob.type || 'image/jpeg',
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('kyc-documents').getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      console.error('upload failed', e);
      return null;
    }
  };

  const isValid =
    fullName.trim() &&
    /^\+91[6-9]\d{9}$/.test(phone) &&
    addressLine.trim() &&
    city.trim() &&
    state.trim() &&
    pincode.trim() &&
    idType &&
    idNumber.trim();

  const handleSubmit = async () => {
    setError('');
    if (!isValid) {
      setError('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      // Use cached session user — no extra round-trip
      const userId = user?.id;
      if (!userId) {
        setError('Session not found. Please sign in again.');
        setSubmitting(false);
        return;
      }

      // Upload ID image first (only if local); skip otherwise
      let idUrl = idImage;
      if (idImage && idImage.startsWith('file:')) {
        idUrl = await uploadIdImage(idImage);
      }

      // Both upserts in parallel
      const [userRes, cpRes] = await Promise.all([
        supabase.from('users').upsert({
          id: userId,
          full_name: fullName.trim(),
          phone: phone.trim(),
        }),
        supabase.from('consumer_profiles').upsert({
          user_id: userId,
          profession: profession.trim() || null,
          address_line: addressLine.trim(),
          city: city.trim(),
          district: district.trim() || null,
          state: state.trim(),
          pincode: pincode.trim(),
          government_id_type: idType,
          government_id_number: idNumber.trim(),
          government_id_url: idUrl,
          kyc_status: 'pending',
          kyc_submitted_at: new Date().toISOString(),
        }),
      ]);
      if (userRes.error) throw userRes.error;
      if (cpRes.error) throw cpRes.error;

      // Navigate immediately; refresh in background so user doesn't wait
      void draft.clear();
      router.replace('/(consumer)/home');
      void refreshProfile();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to submit KYC');
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-6 pt-16">
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-brand-700 text-base">← Back</Text>
        </Pressable>

        <Text className="text-3xl font-bold text-gray-900 mb-2">Complete your profile</Text>
        <Text className="text-gray-500 text-base mb-6">
          We need these details before you can pre-book any crop.
        </Text>

        <DraftBanner
          show={draft.resume}
          savedAt={draft.savedAt}
          onStartOver={() => {
            draft.clear();
            setForm(INITIAL_FORM);
          }}
        />

        <Section title="Personal">
          <Field label="Full Name *" value={fullName} onChangeText={setFullName} />
          <PhoneField label="Mobile Number" required value={phone} onChange={setPhone} />
          <Field label="Profession (optional)" value={profession} onChangeText={setProfession} placeholder="e.g. Software Engineer" />
        </Section>

        <Section title="Communication Address">
          <Field label="Address Line *" value={addressLine} onChangeText={setAddressLine} multiline placeholder="House no, street, area" />
          <Field label="City *" value={city} onChangeText={setCity} />
          <Field label="District" value={district} onChangeText={setDistrict} />
          <Field label="State *" value={state} onChangeText={setState} />
          <Field label="Pincode *" value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} />
        </Section>

        <Section title="Government ID">
          <Text className="text-gray-700 font-semibold mb-2">ID Type *</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {ID_TYPES.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => setIdType(t.value)}
                className={`px-4 py-2 rounded-full border-2 ${idType === t.value ? 'bg-brand-50 border-brand-600' : 'border-gray-200'}`}
              >
                <Text className={idType === t.value ? 'text-brand-700 font-semibold' : 'text-gray-600'}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
          <Field label="ID Number *" value={idNumber} onChangeText={setIdNumber} placeholder="Enter as on document" autoCapitalize="characters" />

          <Text className="text-gray-700 font-semibold mb-2 mt-2">ID Document Photo (optional)</Text>
          <Pressable
            onPress={pickIdImage}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-6 items-center"
          >
            {idImage ? (
              <Text className="text-brand-700 font-medium">✓ Image selected — tap to change</Text>
            ) : (
              <>
                <Text className="text-2xl mb-1">📷</Text>
                <Text className="text-gray-500 text-sm">Tap to upload ID photo</Text>
              </>
            )}
          </Pressable>
        </Section>

        {error ? <Text className="text-red-500 text-sm mt-3">{error}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={!isValid || submitting}
          className={`rounded-2xl py-4 items-center mt-8 ${!isValid || submitting ? 'bg-gray-200' : 'bg-brand-700'}`}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`text-base font-bold ${!isValid ? 'text-gray-400' : 'text-white'}`}>
              Submit for Verification
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-lg font-bold text-gray-900 mb-3">{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, value, onChangeText, keyboardType, placeholder, multiline, maxLength, autoCapitalize }: any) {
  return (
    <View className="mb-3">
      <Text className="text-gray-700 font-semibold mb-1.5 text-sm">{label}</Text>
      <TextInput
        className="border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-900"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        multiline={multiline}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}
