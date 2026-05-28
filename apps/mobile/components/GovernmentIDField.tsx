import { View, Text, TextInput } from 'react-native';

export type IDType = 'aadhaar' | 'voter_id' | 'driving_license' | 'passport';

type Rules = {
  label: string;
  placeholder: string;
  maxLength: number;
  /** Format mask while user types — restricts to allowed characters */
  filter: (input: string) => string;
  /** Final-validity check */
  isValid: (val: string) => boolean;
  errorMsg: string;
  helper: string;
};

const ID_RULES: Record<IDType, Rules> = {
  aadhaar: {
    label: 'Aadhaar Number',
    placeholder: '1234 5678 9012',
    maxLength: 14, // 12 digits + 2 spaces (formatted)
    filter: (s) => {
      const digits = s.replace(/\D/g, '').slice(0, 12);
      // Format as "1234 5678 9012"
      return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    },
    isValid: (val) => /^\d{12}$/.test(val.replace(/\s/g, '')),
    errorMsg: 'Aadhaar must be exactly 12 digits',
    helper: '12 digits, as on your Aadhaar card',
  },
  voter_id: {
    label: 'Voter ID (EPIC) Number',
    placeholder: 'ABC1234567',
    maxLength: 10,
    filter: (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
    // 3 alphabets followed by 7 digits (standard EPIC format)
    isValid: (val) => /^[A-Z]{3}[0-9]{7}$/.test(val),
    errorMsg: 'Voter ID must be 3 letters followed by 7 digits',
    helper: 'Format: 3 letters + 7 digits (e.g. ABC1234567)',
  },
  driving_license: {
    label: 'Driving License Number',
    placeholder: 'MH 14 20120012345',
    maxLength: 17, // some states use spaces/dashes — accept up to 17
    filter: (s) => s.toUpperCase().replace(/[^A-Z0-9\s-]/g, '').slice(0, 17),
    // Loose check: 13-16 alphanumeric (varies wildly by state)
    isValid: (val) => {
      const stripped = val.replace(/[\s-]/g, '');
      return stripped.length >= 13 && stripped.length <= 16 && /^[A-Z0-9]+$/.test(stripped);
    },
    errorMsg: 'Driving License must be 13–16 alphanumeric characters',
    helper: 'Includes state code (e.g. MH, KA, TS, AP)',
  },
  passport: {
    label: 'Passport Number',
    placeholder: 'A1234567',
    maxLength: 8,
    filter: (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8),
    isValid: (val) => /^[A-Z][0-9]{7}$/.test(val),
    errorMsg: 'Passport must be 1 letter followed by 7 digits',
    helper: 'Format: 1 letter + 7 digits (e.g. A1234567)',
  },
};

export function isGovernmentIDValid(idType: IDType, value: string): boolean {
  return ID_RULES[idType]?.isValid(value ?? '') ?? false;
}

export default function GovernmentIDField({
  idType,
  value,
  onChange,
  required,
}: {
  idType: IDType;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}) {
  const rules = ID_RULES[idType];
  const valueClean = value ?? '';
  const isComplete = valueClean.length > 0 && rules.isValid(valueClean);
  const hasInput = valueClean.length > 0;
  const showError = hasInput && !isComplete;

  return (
    <View>
      <Text className="text-gray-700 font-semibold mb-1.5 text-sm">
        {rules.label}{required ? ' *' : ''}
      </Text>
      <View
        className={`flex-row items-center border-2 rounded-2xl overflow-hidden ${
          showError ? 'border-red-400' : isComplete ? 'border-brand-300' : 'border-gray-200'
        }`}
      >
        <TextInput
          className="flex-1 px-4 py-3.5 text-base text-gray-900"
          value={valueClean}
          onChangeText={(text) => onChange(rules.filter(text))}
          maxLength={rules.maxLength}
          placeholder={rules.placeholder}
          placeholderTextColor="#9ca3af"
          autoCapitalize="characters"
          autoCorrect={false}
          keyboardType={idType === 'aadhaar' ? 'number-pad' : 'default'}
          inputMode={idType === 'aadhaar' ? 'numeric' : undefined}
        />
        {isComplete && (
          <View className="pr-3">
            <Text className="text-brand-600 text-lg">✓</Text>
          </View>
        )}
      </View>
      {showError ? (
        <Text className="text-red-500 text-xs mt-1">{rules.errorMsg}</Text>
      ) : (
        <Text className="text-gray-400 text-xs mt-1">{rules.helper}</Text>
      )}
    </View>
  );
}
