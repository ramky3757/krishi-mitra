import { View, Text, Pressable, Alert, Platform } from 'react-native';
import { formatSavedAt } from '@/lib/draftStorage';

export default function DraftBanner({
  show,
  savedAt,
  onStartOver,
}: {
  show: boolean;
  savedAt: Date | null;
  onStartOver: () => void;
}) {
  if (!show) return null;

  const confirm = () => {
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm('Clear your saved progress and start over?')) onStartOver();
      return;
    }
    Alert.alert('Start over?', 'Your saved progress will be cleared.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start over', style: 'destructive', onPress: onStartOver },
    ]);
  };

  return (
    <View className="bg-brand-50 border border-brand-200 rounded-2xl px-4 py-3 mb-4 flex-row items-center gap-3">
      <Text className="text-xl">📝</Text>
      <View className="flex-1">
        <Text className="text-brand-800 font-semibold text-sm">
          Resumed where you left off
        </Text>
        <Text className="text-brand-700 text-xs">
          Auto-saved {formatSavedAt(savedAt)}
        </Text>
      </View>
      <Pressable onPress={confirm} className="px-3 py-1.5">
        <Text className="text-brand-700 text-xs font-semibold">Start over</Text>
      </Pressable>
    </View>
  );
}
