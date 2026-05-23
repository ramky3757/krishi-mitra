import { View, Text, Pressable, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-brand-700">
      <StatusBar style="light" />

      {/* Hero gradient background */}
      <LinearGradient
        colors={['#14532d', '#1a6b3c', '#22c55e']}
        style={{ position: 'absolute', inset: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Top section */}
      <View className="flex-1 items-center justify-center px-8 pt-20">
        <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-6">
          <Text className="text-5xl">🌾</Text>
        </View>

        <Text className="text-white text-4xl font-bold text-center tracking-tight">
          HarvestBond
        </Text>
        <Text className="text-brand-200 text-base text-center mt-3 leading-6">
          Know your farmer.{'\n'}Own your harvest.
        </Text>

        <View className="mt-12 gap-4 w-full">
          <FeatureItem icon="🧑‍🌾" text="Connect directly with verified farmers" />
          <FeatureItem icon="📦" text="Pre-buy fresh crops before they're harvested" />
          <FeatureItem icon="🌱" text="Track your crop from seed to kitchen" />
          <FeatureItem icon="🚜" text="Visit the farm, know your food" />
        </View>
      </View>

      {/* Bottom CTA */}
      <View className="px-8 pb-12 gap-4">
        <Pressable
          onPress={() => router.push('/(auth)/phone')}
          className="bg-white rounded-2xl py-4 items-center active:opacity-80"
        >
          <Text className="text-brand-700 text-base font-bold">Get Started</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(auth)/phone')}
          className="border border-white/40 rounded-2xl py-4 items-center active:opacity-80"
        >
          <Text className="text-white text-base font-semibold">I already have an account</Text>
        </Pressable>

        <Text className="text-brand-300 text-xs text-center mt-2">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="w-10 h-10 rounded-full bg-white/15 items-center justify-center">
        <Text className="text-xl">{icon}</Text>
      </View>
      <Text className="text-white/90 text-sm flex-1">{text}</Text>
    </View>
  );
}
