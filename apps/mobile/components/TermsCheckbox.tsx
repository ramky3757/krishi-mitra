import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function TermsCheckbox({
  accepted,
  onToggle,
  role,
}: {
  accepted: boolean;
  onToggle: () => void;
  role: 'farmer' | 'consumer';
}) {
  const otherDoc = role === 'farmer' ? 'farmer' : 'consumer';

  return (
    <Pressable
      onPress={onToggle}
      className="flex-row items-start gap-3 p-4 bg-gray-50 rounded-2xl"
    >
      <View
        className={`w-6 h-6 rounded-md border-2 items-center justify-center mt-0.5 ${
          accepted ? 'bg-brand-700 border-brand-700' : 'border-gray-300 bg-white'
        }`}
      >
        {accepted && <Text className="text-white text-sm font-bold">✓</Text>}
      </View>
      <Text className="flex-1 text-gray-700 text-sm leading-5">
        I have read and agree to Krishi Mitra's{' '}
        <Text
          className="text-brand-700 font-semibold underline"
          onPress={(e) => { e.stopPropagation?.(); router.push('/terms?only=common'); }}
        >
          Terms of Service
        </Text>
        ,{' '}
        <Text
          className="text-brand-700 font-semibold underline"
          onPress={(e) => { e.stopPropagation?.(); router.push(`/terms?only=${otherDoc}`); }}
        >
          {role === 'farmer' ? 'Farmer Terms' : 'Consumer Terms'}
        </Text>
        , and{' '}
        <Text
          className="text-brand-700 font-semibold underline"
          onPress={(e) => { e.stopPropagation?.(); router.push('/terms?only=privacy'); }}
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </Pressable>
  );
}
