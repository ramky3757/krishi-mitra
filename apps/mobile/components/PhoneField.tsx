import { View, Text, TextInput } from 'react-native';

/**
 * Indian mobile input.
 * - Shows fixed +91 prefix
 * - Accepts only 10 digits, first digit must be 6-9 (valid Indian mobile)
 * - Returns the full E.164 value (+919876543210) via onChange
 *
 * Pass either an E.164 string (+919...) or a raw 10-digit string as `value`;
 * the field auto-extracts the last 10 digits for display.
 */
export default function PhoneField({
  label,
  value,
  onChange,
  required,
  error,
  helper,
}: {
  label: string;
  value: string;                // can be '+919876543210' or '9876543210' or ''
  onChange: (e164: string) => void; // emits '+919876543210' (empty if cleared)
  required?: boolean;
  error?: string;
  helper?: string;
}) {
  // Extract the local 10-digit portion from whatever's stored.
  // CRITICAL: explicitly strip the leading '+91' first so that the country
  // code's '91' digits don't get fed back into the input and mistaken for
  // user-typed digits (which previously caused the input to balloon to
  // '919191...' after just a few keystrokes).
  const stripped = (value || '').replace(/^\+91/, '').replace(/\D/g, '');
  const last10 = stripped.slice(0, 10);

  const handleChange = (text: string) => {
    // User-typed text is the LOCAL portion only; strip non-digits and cap at 10
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    if (!cleaned) {
      onChange('');
    } else {
      onChange(`+91${cleaned}`);
    }
  };

  const isComplete = last10.length === 10;
  const isInvalidStart = last10.length > 0 && !/^[6-9]/.test(last10);

  return (
    <View>
      <Text className="text-gray-700 font-semibold mb-2 text-sm">
        {label}{required ? ' *' : ''}
      </Text>
      <View
        className={`flex-row items-center border-2 rounded-2xl overflow-hidden ${
          error || isInvalidStart ? 'border-red-400' : isComplete ? 'border-brand-300' : 'border-gray-200'
        }`}
      >
        <View className="bg-gray-50 px-3 py-3.5 border-r border-gray-200">
          <Text className="text-gray-700 font-semibold">🇮🇳 +91</Text>
        </View>
        <TextInput
          className="flex-1 px-3 py-3.5 text-base text-gray-900"
          value={last10}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={10}
          placeholder="9876543210"
          placeholderTextColor="#9ca3af"
          inputMode="numeric"
        />
        {isComplete && !isInvalidStart && (
          <View className="pr-3">
            <Text className="text-brand-600 text-lg">✓</Text>
          </View>
        )}
      </View>

      {error ? (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      ) : isInvalidStart ? (
        <Text className="text-red-500 text-xs mt-1">Mobile number must start with 6, 7, 8, or 9</Text>
      ) : helper ? (
        <Text className="text-gray-400 text-xs mt-1">{helper}</Text>
      ) : null}
    </View>
  );
}
