import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

// HarvestBond brand palette mapped to Material Design 3 token slots.
const brand = {
  primary: '#1a6b3c',      // brand-700
  primaryDark: '#14532d',  // brand-900
  primaryLight: '#bbf7d0', // brand-200
  secondary: '#ca8a04',    // harvest gold
  tertiary: '#b45309',     // soil brown
  surface: '#ffffff',
  background: '#fafaf7',
  error: '#b91c1c',
};

const fontConfig = {
  default: { fontFamily: 'System', fontWeight: '400' as const, letterSpacing: 0 },
};

export const harvestBondLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brand.primary,
    onPrimary: '#ffffff',
    primaryContainer: brand.primaryLight,
    onPrimaryContainer: brand.primaryDark,
    secondary: brand.secondary,
    onSecondary: '#ffffff',
    secondaryContainer: '#fef3c7',
    onSecondaryContainer: '#713f12',
    tertiary: brand.tertiary,
    onTertiary: '#ffffff',
    tertiaryContainer: '#fed7aa',
    onTertiaryContainer: '#7c2d12',
    background: brand.background,
    surface: brand.surface,
    surfaceVariant: '#f0f5ec',
    error: brand.error,
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 12,
};

export const harvestBondDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: brand.primaryLight,
    onPrimary: brand.primaryDark,
    primaryContainer: brand.primary,
    onPrimaryContainer: brand.primaryLight,
    secondary: '#fde68a',
    background: '#0f2417',
    surface: '#1a3a26',
  },
  roundness: 12,
};
