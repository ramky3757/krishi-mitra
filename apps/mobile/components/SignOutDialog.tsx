import { Modal, View, Text, Pressable } from 'react-native';

/**
 * Lightweight sign-out confirmation — much faster than react-native-paper Dialog.
 * Uses native RN Modal with no entrance animation (transparent overlay).
 */
export default function SignOutDialog({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable onPress={onCancel} className="flex-1 bg-black/40 items-center justify-center px-6">
        <Pressable
          onPress={(e) => e.stopPropagation?.()}
          className="bg-white rounded-3xl p-6 w-full"
          style={{ maxWidth: 360 }}
        >
          <Text className="text-xl font-bold text-gray-900 mb-2">Sign out?</Text>
          <Text className="text-gray-500 text-sm mb-6">
            You'll need to sign in again to access your account.
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 border border-gray-200 rounded-2xl py-3 items-center"
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className="flex-1 bg-red-600 rounded-2xl py-3 items-center"
            >
              <Text className="text-white font-bold">Sign out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
