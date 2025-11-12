/**
 * React Native Paper Theme Configuration
 * 
 * This ensures consistent theming across Expo Go and production builds.
 */

import { MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';

export const appTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.primary,
    secondaryContainer: colors.primaryLight,
    tertiary: colors.info,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    background: colors.background,
    error: colors.error,
    errorContainer: '#fee2e2',
    onPrimary: colors.textOnPrimary,
    onSecondary: colors.textOnPrimary,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    onBackground: colors.text,
    outline: colors.border,
    outlineVariant: colors.divider,
  },
};

// Export colors for direct use in StyleSheet
export { colors };

