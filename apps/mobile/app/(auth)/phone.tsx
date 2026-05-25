import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Svg, Path } from 'react-native-svg';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </Svg>
  );
}

function EmailIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2z" stroke="#1a6b3c" strokeWidth="2" strokeLinejoin="round"/>
      <Path d="M2 8l10 7 10-7" stroke="#1a6b3c" strokeWidth="2" strokeLinejoin="round"/>
    </Svg>
  );
}

export default function LoginOptionsScreen() {
  const [mode, setMode] = useState<'choose' | 'email'>('choose');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { signInWithEmail, isLoading } = useAuthStore();
  const [googleLoading, setGoogleLoading] = useState(false);

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
      setError(e.message ?? 'Failed to send code. Please try again.');
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/`
        : 'krishimitra://';
      const { error: oErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (oErr) setError(oErr.message);
    } catch (e: any) {
      setError(e?.message ?? 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-16 pb-8 justify-center">
          {/* Card */}
          <View
            className="bg-white rounded-3xl px-6 py-8 mx-auto w-full"
            style={{
              maxWidth: 440,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 16,
              elevation: 2,
            }}
          >
            {/* Branding */}
            <View className="items-center mb-7">
              <View className="w-16 h-16 rounded-2xl bg-brand-700 items-center justify-center mb-3">
                <Text className="text-3xl">🌾</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">Welcome back</Text>
              <Text className="text-gray-500 text-sm mt-1 text-center">
                {mode === 'choose'
                  ? 'Pick a way to sign in to Krishi Mitra'
                  : "We'll email you a 6-digit code"}
              </Text>
            </View>

            {mode === 'choose' ? (
              <View className="gap-3">
                {/* Google */}
                <Pressable
                  onPress={handleGoogle}
                  disabled={googleLoading}
                  className={`flex-row items-center justify-center gap-3 rounded-2xl py-3.5 border border-gray-200 bg-white ${googleLoading ? 'opacity-60' : ''}`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                  }}
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#1a6b3c" />
                  ) : (
                    <>
                      <GoogleLogo />
                      <Text className="text-gray-800 font-semibold text-base">Continue with Google</Text>
                    </>
                  )}
                </Pressable>

                {/* Email */}
                <Pressable
                  onPress={() => setMode('email')}
                  className="flex-row items-center justify-center gap-3 rounded-2xl py-3.5 border border-gray-200 bg-white"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                  }}
                >
                  <EmailIcon />
                  <Text className="text-gray-800 font-semibold text-base">Continue with Email</Text>
                </Pressable>

                {/* Future: add more here. e.g. Apple, Phone, etc. */}

                {error ? (
                  <Text className="text-red-500 text-sm text-center mt-2">{error}</Text>
                ) : null}

                {/* Terms */}
                <Text className="text-gray-400 text-xs text-center mt-5 leading-5">
                  By continuing, you agree to our{'\n'}
                  <Text className="text-brand-700 font-medium">Terms of Service</Text>{' '}and{' '}
                  <Text className="text-brand-700 font-medium">Privacy Policy</Text>.
                </Text>
              </View>
            ) : (
              <View>
                {/* Email input */}
                <Text className="text-gray-700 font-semibold text-sm mb-2">Email address</Text>
                <View className={`border rounded-2xl bg-gray-50 ${error ? 'border-red-300' : 'border-gray-200'}`}>
                  <TextInput
                    className="px-4 py-3.5 text-base text-gray-900"
                    placeholder="your@email.com"
                    placeholderTextColor="#9ca3af"
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
                ) : null}

                <Pressable
                  onPress={handleSendOTP}
                  disabled={isLoading || email.length < 5}
                  className={`rounded-2xl py-3.5 items-center mt-5 ${isLoading || email.length < 5 ? 'bg-gray-200' : 'bg-brand-700'}`}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className={`text-base font-bold ${email.length < 5 ? 'text-gray-400' : 'text-white'}`}>
                      Send code
                    </Text>
                  )}
                </Pressable>

                <Pressable onPress={() => { setMode('choose'); setError(''); }} className="mt-4">
                  <Text className="text-brand-700 text-sm font-medium text-center">
                    ← Other sign-in options
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Back to welcome */}
          <Pressable onPress={() => router.back()} className="mt-6 self-center">
            <Text className="text-gray-500 text-sm">← Back to home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
