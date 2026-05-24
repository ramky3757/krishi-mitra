import { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

const OTP_LENGTH = 8;

export default function OTPScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const { verifyEmailOTP, signInWithEmail, isLoading } = useAuthStore();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleDigit = (value: string, index: number) => {
    // Support paste of full code
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newOtp = Array(OTP_LENGTH).fill('');
      digits.forEach((d, i) => { newOtp[i] = d; });
      setOtp(newOtp);
      setError('');
      const next = Math.min(digits.length, OTP_LENGTH - 1);
      inputRefs.current[next]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (!digit && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return;
    setError('');
    try {
      await verifyEmailOTP(email, code);
      router.replace('/');
    } catch (e: any) {
      setError(e.message ?? 'Invalid code. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      await signInWithEmail(email);
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

        <Text className="text-3xl font-bold text-gray-900 mb-2">Check your email</Text>
        <Text className="text-gray-500 text-base mb-2">
          Enter the {OTP_LENGTH}-digit code sent to
        </Text>
        <Text className="text-gray-900 font-semibold text-base mb-10">{email}</Text>

        <View className="flex-row gap-1.5 mb-4 justify-center">
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputRefs.current[i] = ref; }}
              style={{ width: 36, height: 48 }}
              className={`border-2 rounded-xl text-center text-lg font-bold
                ${error ? 'border-red-400 bg-red-50' : digit ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}
              keyboardType="numeric"
              maxLength={i === 0 ? OTP_LENGTH : 1}
              value={digit}
              onChangeText={(v) => handleDigit(v, i)}
              autoFocus={i === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? (
          <Text className="text-red-500 text-sm text-center">{error}</Text>
        ) : (
          <Text className="text-gray-400 text-sm text-center">
            Didn't get it? Check your spam folder too.
          </Text>
        )}

        <View className="flex-row justify-center mt-4">
          <Text className="text-gray-500 text-sm">Didn't receive it? </Text>
          {resendTimer > 0 ? (
            <Text className="text-gray-400 text-sm">Resend in {resendTimer}s</Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text className="text-brand-700 text-sm font-semibold">Resend Code</Text>
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
