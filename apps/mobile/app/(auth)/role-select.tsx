import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';

export default function RoleSelectScreen() {
  const { updateProfile } = useAuthStore();

  const selectRole = async (role: UserRole) => {
    try {
      await updateProfile({ role });
      if (role === 'farmer') {
        router.replace('/(auth)/farmer-kyc');
      } else {
        router.replace('/(auth)/profile-setup');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 px-6 pt-16 pb-8">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Who are you?</Text>
        <Text className="text-gray-500 text-base mb-10">
          Help us personalize your HarvestBond experience.
        </Text>

        <RoleCard
          emoji="🧑‍🌾"
          title="I'm a Farmer"
          subtitle="I grow crops and want to sell my yield directly to consumers"
          features={[
            'Post crop listings with full details',
            'Receive advance payments for financial stability',
            'Build direct relationships with buyers',
            'Share farm progress and updates',
          ]}
          onPress={() => selectRole('farmer')}
          accent="brand"
        />

        <View className="h-4" />

        <RoleCard
          emoji="👨‍👩‍👧‍👦"
          title="I'm a Consumer"
          subtitle="I want to pre-buy fresh crops directly from verified farmers"
          features={[
            'Browse verified farm listings near you',
            'Pre-book crops and secure your supply',
            'Visit farms and track crop progress',
            'Know exactly how your food is grown',
          ]}
          onPress={() => selectRole('consumer')}
          accent="harvest"
        />
      </View>
    </ScrollView>
  );
}

function RoleCard({
  emoji,
  title,
  subtitle,
  features,
  onPress,
  accent,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  features: string[];
  onPress: () => void;
  accent: 'brand' | 'harvest';
}) {
  const borderColor = accent === 'brand' ? 'border-brand-600' : 'border-harvest-300';
  const bgColor = accent === 'brand' ? 'bg-brand-50' : 'bg-harvest-100';
  const dotColor = accent === 'brand' ? 'bg-brand-600' : 'bg-harvest-300';
  const btnColor = accent === 'brand' ? 'bg-brand-700' : 'bg-soil-300';

  return (
    <Pressable
      onPress={onPress}
      className={`border-2 ${borderColor} ${bgColor} rounded-3xl p-6 active:opacity-80`}
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
        <Text className="text-white font-semibold">Continue as {title.split("'")[1]}</Text>
      </View>
    </Pressable>
  );
}
