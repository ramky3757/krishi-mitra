import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { signInWithPhone, isLoading } = useAuthStore();

  const handleSendOTP = async () => {
    setError('');
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      const formattedPhone = `+91${cleaned}`;
      await signInWithPhone(formattedPhone);
      router.push({ pathname: '/(auth)/otp', params: { phone: formattedPhone } });
    } catch (e: any) {
      setError(e.message ?? 'Failed to send OTP. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 px-6 pt-16 pb-8">
        {/* Back */}
        <Pressable onPress={() => router.back()} className="mb-8">
          <Text className="text-brand-700 text-base">← Back</Text>
        </Pressable>

        <Text className="text-3xl font-bold text-gray-900 mb-2">Enter your number</Text>
        <Text className="text-gray-500 text-base mb-10">
          We'll send a one-time password to verify your identity.
        </Text>

        {/* Phone input */}
        <View className={`flex-row border-2 rounded-2xl overflow-hidden ${error ? 'border-red-400' : 'border-gray-200'}`}>
          <View className="bg-gray-100 px-4 items-center justify-center">
            <Text className="text-gray-600 font-semibold">🇮🇳 +91</Text>
          </View>
          <TextInput
            className="flex-1 px-4 py-4 text-base text-gray-900"
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={(t) => { setPhone(t); setError(''); }}
            autoFocus
          />
        </View>

        {error ? (
          <Text className="text-red-500 text-sm mt-2">{error}</Text>
        ) : (
          <Text className="text-gray-400 text-sm mt-2">
            Standard SMS rates may apply
          </Text>
        )}

        <View className="flex-1" />

        <Pressable
          onPress={handleSendOTP}
          disabled={isLoading || phone.length < 10}
          className={`rounded-2xl py-4 items-center ${isLoading || phone.length < 10 ? 'bg-gray-200' : 'bg-brand-700'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`text-base font-bold ${phone.length < 10 ? 'text-gray-400' : 'text-white'}`}>
              Send OTP
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
