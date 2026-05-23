import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { INDIA_STATES } from '@/constants';

export default function ProfileSetupScreen() {
  const { user, updateProfile } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) return;
    setIsLoading(true);
    try {
      await updateProfile({ full_name: fullName.trim() });
      // Create consumer profile
      await supabase.from('consumer_profiles').upsert({
        user_id: user?.id,
        state,
        district,
      });
      router.replace('/(consumer)/home');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 px-6 pt-16 pb-8">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Complete your profile</Text>
        <Text className="text-gray-500 text-base mb-10">
          Help us show you the best crops near you.
        </Text>

        <View className="gap-5">
          <View>
            <Text className="text-gray-700 font-semibold mb-2">Full Name *</Text>
            <TextInput
              className="border-2 border-gray-200 rounded-2xl px-4 py-4 text-base text-gray-900"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          <View>
            <Text className="text-gray-700 font-semibold mb-2">State</Text>
            <TextInput
              className="border-2 border-gray-200 rounded-2xl px-4 py-4 text-base text-gray-900"
              placeholder="e.g. Telangana, Maharashtra"
              value={state}
              onChangeText={setState}
            />
          </View>

          <View>
            <Text className="text-gray-700 font-semibold mb-2">District</Text>
            <TextInput
              className="border-2 border-gray-200 rounded-2xl px-4 py-4 text-base text-gray-900"
              placeholder="e.g. Hyderabad, Pune"
              value={district}
              onChangeText={setDistrict}
            />
          </View>
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={handleSave}
          disabled={!fullName.trim() || isLoading}
          className={`rounded-2xl py-4 items-center mt-8 ${!fullName.trim() || isLoading ? 'bg-gray-200' : 'bg-brand-700'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`text-base font-bold ${!fullName.trim() ? 'text-gray-400' : 'text-white'}`}>
              Let's Go →
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
