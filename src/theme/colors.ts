/**
 * Centralized color theme for LifeOS
 * 
 * This ensures consistent colors across Expo Go and production builds.
 * All colors are defined here and should be imported from this file.
 */

export const colors = {
  // Primary brand color (Indigo)
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  
  // Background colors
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceVariant: '#f1f5f9',
  
  // Text colors
  text: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textOnPrimary: '#ffffff',
  
  // Status colors
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Border and divider colors
  border: '#e5e7eb',
  divider: '#e5e7eb',
  
  // Card colors
  cardBackground: '#ffffff',
  cardElevation: '#f8fafc',
  
  // Welcome card colors
  welcomeBackground: '#6366f1',
  welcomeText: '#ffffff',
  welcomeTextSecondary: '#e0e7ff',
  welcomeTextTertiary: '#c7d2fe',
  
  // Notion card colors
  highlightIcon: '#f59e0b',
  ideaIcon: '#6366f1',
  
  // Completion card colors
  completionBackground: '#f0fdf4',
  completionBorder: '#10b981',
  completionText: '#10b981',
  
  // Gray scale
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
} as const;

// Type for colors
export type ColorKey = keyof typeof colors;

