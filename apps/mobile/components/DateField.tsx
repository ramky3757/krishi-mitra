import { View, Text, Platform, Pressable } from 'react-native';

/**
 * Cross-platform date input.
 * - Web: renders a native HTML date picker via React DOM
 * - Native: renders a tappable button that opens the OS date picker
 *   (uses `@react-native-community/datetimepicker` only on native — lazy-loaded)
 */
export default function DateField({
  label,
  value,             // ISO 'YYYY-MM-DD'
  onChange,
  min,
  max,
  required,
  helper,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  helper?: string;
}) {
  return (
    <View>
      <Text className="text-gray-700 font-semibold mb-2 text-sm">
        {label}{required ? ' *' : ''}
      </Text>

      {Platform.OS === 'web' ? (
        // @ts-ignore — DOM element on web only
        <input
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={(e: any) => onChange(e.target.value)}
          style={{
            width: '100%',
            paddingTop: 14,
            paddingBottom: 14,
            paddingLeft: 16,
            paddingRight: 16,
            borderWidth: 2,
            borderColor: '#e5e7eb',
            borderStyle: 'solid',
            borderRadius: 16,
            fontSize: 16,
            color: '#111827',
            fontFamily: 'inherit',
            background: 'white',
          }}
        />
      ) : (
        <NativeDate value={value} onChange={onChange} min={min} max={max} />
      )}

      {helper && <Text className="text-gray-400 text-xs mt-1">{helper}</Text>}
    </View>
  );
}

function NativeDate({ value, onChange, min, max }: { value: string; onChange: (v: string) => void; min?: string; max?: string }) {
  // Native: keep simple — render a button that opens the OS modal.
  // We use require() to avoid bundling the native lib on web.
  const handlePress = async () => {
    try {
      const dt = require('@react-native-community/datetimepicker');
      const DateTimePickerAndroid = dt?.DateTimePickerAndroid;
      if (DateTimePickerAndroid) {
        DateTimePickerAndroid.open({
          value: value ? new Date(value) : new Date(),
          minimumDate: min ? new Date(min) : undefined,
          maximumDate: max ? new Date(max) : undefined,
          mode: 'date',
          onChange: (_e: any, d?: Date) => {
            if (d) onChange(d.toISOString().slice(0, 10));
          },
        });
      } else {
        // iOS fallback: show inline picker via DateTimePickerModal in a portal
        // For MVP we accept manual text entry as fallback
      }
    } catch {}
  };

  return (
    <Pressable
      onPress={handlePress}
      className="border-2 border-gray-200 rounded-2xl px-4 py-4 flex-row justify-between items-center"
    >
      <Text className={value ? 'text-gray-900 text-base' : 'text-gray-400 text-base'}>
        {value || 'Select date'}
      </Text>
      <Text className="text-gray-400">📅</Text>
    </Pressable>
  );
}

/** Calculate human-friendly "days to harvest" helper text */
export function daysToHarvest(harvestDate: string | null | undefined): string | null {
  if (!harvestDate) return null;
  const target = new Date(harvestDate);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Past harvest by ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''}`;
  if (diff === 0) return 'Harvest today';
  if (diff === 1) return 'Harvest tomorrow';
  if (diff < 30) return `${diff} days to harvest`;
  if (diff < 60) return 'About 1 month to harvest';
  const months = Math.floor(diff / 30);
  return `~${months} month${months !== 1 ? 's' : ''} to harvest`;
}
