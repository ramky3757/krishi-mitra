import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function EmailScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { signInWithEmail, isLoading } = useAuthStore();

  const handleSendOTP = async () => {
    setError('');
    const cleaned = email.trim().toLowerCase();
    if (!cleaned.includes('@') || !cleaned.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }
    try {
      await signInWithEmail(cleaned);
      router.push({ pathname: '/(auth)/otp', params: { email: cleaned } });
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
        <Pressable onPress={() => router.back()} className="mb-8">
          <Text className="text-brand-700 text-base">← Back</Text>
        </Pressable>

        <Text className="text-3xl font-bold text-gray-900 mb-2">Enter your email</Text>
        <Text className="text-gray-500 text-base mb-10">
          We'll send a 6-digit code to verify your identity.
        </Text>

        <View className={`border-2 rounded-2xl overflow-hidden ${error ? 'border-red-400' : 'border-gray-200'}`}>
          <TextInput
            className="px-4 py-4 text-base text-gray-900"
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(t) => { setEmail(t); setError(''); }}
            autoFocus
          />
        </View>

        {error ? (
          <Text className="text-red-500 text-sm mt-2">{error}</Text>
        ) : (
          <Text className="text-gray-400 text-sm mt-2">
            A one-time code will be sent to this email
          </Text>
        )}

        <View className="flex-1" />

        <Pressable
          onPress={handleSendOTP}
          disabled={isLoading || email.length < 5}
          className={`rounded-2xl py-4 items-center ${isLoading || email.length < 5 ? 'bg-gray-200' : 'bg-brand-700'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`text-base font-bold ${email.length < 5 ? 'text-gray-400' : 'text-white'}`}>
              Send Code
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
