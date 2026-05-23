import { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';

export default function RoleSelectScreen() {
  const { updateProfile, user } = useAuthStore();
  const [loading, setLoading] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectRole = async (role: UserRole) => {
    setLoading(role);
    setError(null);
    try {
      await updateProfile({ role });
      if (role === 'farmer') {
        router.replace('/(farmer)/dashboard');
      } else {
        router.replace('/(consumer)/home');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 px-6 pt-16 pb-8">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Who are you?</Text>
        <Text className="text-gray-500 text-base mb-10">
          Help us personalize your Krishi Mitra experience.
        </Text>

        {error && (
          <View className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        )}

        <RoleCard
          emoji="🧑‍🌾"
          title="I'm a Farmer"
          buttonLabel="Continue as Farmer"
          subtitle="I grow crops and want to sell my yield directly to consumers"
          features={[
            'Post crop listings with full details',
            'Receive advance payments for financial stability',
            'Build direct relationships with buyers',
            'Share farm progress and updates',
          ]}
          onPress={() => selectRole('farmer')}
          isLoading={loading === 'farmer'}
          disabled={loading !== null}
          accent="brand"
        />

        <View className="h-4" />

        <RoleCard
          emoji="👨‍👩‍👧‍👦"
          title="I'm a Consumer"
          buttonLabel="Continue as Consumer"
          subtitle="I want to pre-buy fresh crops directly from verified farmers"
          features={[
            'Browse verified farm listings near you',
            'Pre-book crops and secure your supply',
            'Visit farms and track crop progress',
            'Know exactly how your food is grown',
          ]}
          onPress={() => selectRole('consumer')}
          isLoading={loading === 'consumer'}
          disabled={loading !== null}
          accent="harvest"
        />
      </View>
    </ScrollView>
  );
}

function RoleCard({
  emoji, title, buttonLabel, subtitle, features, onPress, isLoading, disabled, accent,
}: {
  emoji: string;
  title: string;
  buttonLabel: string;
  subtitle: string;
  features: string[];
  onPress: () => void;
  isLoading: boolean;
  disabled: boolean;
  accent: 'brand' | 'harvest';
}) {
  const borderColor = accent === 'brand' ? 'border-brand-600' : 'border-amber-400';
  const bgColor = accent === 'brand' ? 'bg-brand-50' : 'bg-amber-50';
  const dotColor = accent === 'brand' ? 'bg-brand-600' : 'bg-amber-400';
  const btnColor = accent === 'brand' ? 'bg-brand-700' : 'bg-amber-600';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`border-2 ${borderColor} ${bgColor} rounded-3xl p-6 active:opacity-80 ${disabled ? 'opacity-70' : ''}`}
    >
      <Text className="text-5xl mb-3">{emoji}</Text>
      <Text className="text-xl font-bold text-gray-900 mb-1">{title}</Text>
      <Text className="text-gray-600 text-sm mb-5">{subtitle}</Text>

      <View className="gap-2 mb-6">
        {features.map((f, i) => (
          <View key={i} className="flex-row items-start gap-2">
            <View className={`w-2 h-2 rounded-full ${dotColor} mt-1.5`} />
            <Text className="text-gray-700 text-sm flex-1">{f}</Text>
          </View>
        ))}
      </View>

      <View className={`${btnColor} rounded-xl py-3 items-center`}>
        {isLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text className="text-white font-semibold">{buttonLabel}</Text>
        )}
      </View>
    </Pressable>
  );
}
