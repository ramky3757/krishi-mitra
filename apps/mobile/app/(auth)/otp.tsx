import { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const { verifyOTP, signInWithPhone, isLoading } = useAuthStore();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleDigit = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (!digit && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return;
    setError('');
    try {
      await verifyOTP(phone, code);
    } catch (e: any) {
      setError(e.message ?? 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      await signInWithPhone(phone);
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((t) => {
          if (t <= 1) { clearInterval(interval); return 0; }
          return t - 1;
        });
      }, 1000);
    } catch (_) {}
  };

  const isComplete = otp.every(Boolean);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 px-6 pt-16 pb-8">
        <Pressable onPress={() => router.back()} className="mb-8">
          <Text className="text-brand-700 text-base">← Back</Text>
        </Pressable>

        <Text className="text-3xl font-bold text-gray-900 mb-2">Verify your number</Text>
        <Text className="text-gray-500 text-base mb-2">
          Enter the 6-digit code sent to
        </Text>
        <Text className="text-gray-900 font-semibold text-base mb-10">{phone}</Text>

        {/* OTP boxes */}
        <View className="flex-row gap-3 mb-4">
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputRefs.current[i] = ref; }}
              className={`flex-1 aspect-square border-2 rounded-2xl text-center text-2xl font-bold
                ${error ? 'border-red-400 bg-red-50' : digit ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}
              keyboardType="numeric"
              maxLength={1}
              value={digit}
              onChangeText={(v) => handleDigit(v, i)}
              autoFocus={i === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? (
          <Text className="text-red-500 text-sm text-center">{error}</Text>
        ) : null}

        {/* Resend */}
        <View className="flex-row justify-center mt-4">
          <Text className="text-gray-500 text-sm">Didn't receive it? </Text>
          {resendTimer > 0 ? (
            <Text className="text-gray-400 text-sm">Resend in {resendTimer}s</Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text className="text-brand-700 text-sm font-semibold">Resend OTP</Text>
            </Pressable>
          )}
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={handleVerify}
          disabled={!isComplete || isLoading}
          className={`rounded-2xl py-4 items-center ${!isComplete || isLoading ? 'bg-gray-200' : 'bg-brand-700'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`text-base font-bold ${!isComplete ? 'text-gray-400' : 'text-white'}`}>
              Verify & Continue
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
