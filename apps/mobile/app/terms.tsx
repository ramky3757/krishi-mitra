import { useLocalSearchParams, router } from 'expo-router';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { TERMS, TERMS_VERSION, TERMS_LAST_UPDATED, termsContentForRole, type TermsKey } from '@/lib/terms';
import { useAuthStore } from '@/stores/authStore';

export default function TermsScreen() {
  const { only } = useLocalSearchParams<{ only?: string }>();
  const { user } = useAuthStore();

  // ?only=farmer|consumer|common|privacy → show just that section
  // Otherwise show what's relevant to the user's role
  const keys: TermsKey[] = only
    ? [only as TermsKey]
    : termsContentForRole(user?.role as 'farmer' | 'consumer' | undefined);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-brand-700 px-5 pt-14 pb-5">
        <Pressable onPress={() => router.back()} className="mb-3">
          <Text className="text-brand-200 text-base">← Back</Text>
        </Pressable>
        <Text className="text-white text-2xl font-bold">Terms & Privacy</Text>
        <Text className="text-brand-300 text-xs mt-1">
          Version {TERMS_VERSION} · Last updated {TERMS_LAST_UPDATED}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {keys.map((k) => {
          const doc = TERMS[k];
          if (!doc) return null;
          return (
            <View key={k} className="bg-white rounded-3xl p-5 mb-4">
              <Text className="text-xl font-bold text-gray-900 mb-4">{doc.title}</Text>
              {doc.sections.map((s, i) => (
                <View key={i} className="mb-4">
                  <Text className="font-bold text-gray-900 mb-1">{s.heading}</Text>
                  <Text className="text-gray-700 text-sm leading-6">{s.body}</Text>
                </View>
              ))}
            </View>
          );
        })}

        <Text className="text-gray-400 text-xs text-center mt-4">
          For grievances contact{' '}
          <Text className="text-brand-700 font-semibold">support@krishimitra.app</Text>
        </Text>
      </ScrollView>
    </View>
  );
}
