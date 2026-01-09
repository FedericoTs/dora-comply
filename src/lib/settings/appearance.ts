'use server';

/**
 * Appearance Settings
 * Types and server actions for managing user appearance preferences
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';
export type DateFormat = 'iso' | 'eu' | 'us';
export type TimeFormat = '12h' | '24h';
export type Locale = 'en' | 'de' | 'fr' | 'es' | 'it';

export interface AppearancePreferences {
  theme: Theme;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  locale: Locale;
  compactMode: boolean;
}

// Default preferences
export const DEFAULT_APPEARANCE_PREFERENCES: AppearancePreferences = {
  theme: 'system',
  dateFormat: 'iso',
  timeFormat: '24h',
  locale: 'en',
  compactMode: false,
};

// ============================================================================
// Get Appearance Preferences
// ============================================================================

export async function getAppearancePreferences(): Promise<{
  success: boolean;
  data?: AppearancePreferences;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('users')
    .select('appearance_preferences')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching appearance preferences:', error);
    return { success: false, error: error.message };
  }

  // Return stored preferences or defaults
  const preferences = data?.appearance_preferences as AppearancePreferences | null;

  return {
    success: true,
    data: preferences || DEFAULT_APPEARANCE_PREFERENCES,
  };
}

// ============================================================================
// Update Appearance Preferences
// ============================================================================

export async function updateAppearancePreferences(
  preferences: AppearancePreferences
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('users')
    .update({
      appearance_preferences: preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating appearance preferences:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================================================
// Update Individual Settings
// ============================================================================

export async function updateTheme(
  theme: Theme
): Promise<{ success: boolean; error?: string }> {
  const currentResult = await getAppearancePreferences();

  if (!currentResult.success || !currentResult.data) {
    return { success: false, error: currentResult.error || 'Failed to get current preferences' };
  }

  return updateAppearancePreferences({
    ...currentResult.data,
    theme,
  });
}

export async function updateDateFormat(
  dateFormat: DateFormat
): Promise<{ success: boolean; error?: string }> {
  const currentResult = await getAppearancePreferences();

  if (!currentResult.success || !currentResult.data) {
    return { success: false, error: currentResult.error || 'Failed to get current preferences' };
  }

  return updateAppearancePreferences({
    ...currentResult.data,
    dateFormat,
  });
}

export async function updateTimeFormat(
  timeFormat: TimeFormat
): Promise<{ success: boolean; error?: string }> {
  const currentResult = await getAppearancePreferences();

  if (!currentResult.success || !currentResult.data) {
    return { success: false, error: currentResult.error || 'Failed to get current preferences' };
  }

  return updateAppearancePreferences({
    ...currentResult.data,
    timeFormat,
  });
}

export async function updateLocale(
  locale: Locale
): Promise<{ success: boolean; error?: string }> {
  const currentResult = await getAppearancePreferences();

  if (!currentResult.success || !currentResult.data) {
    return { success: false, error: currentResult.error || 'Failed to get current preferences' };
  }

  return updateAppearancePreferences({
    ...currentResult.data,
    locale,
  });
}

export async function updateCompactMode(
  compactMode: boolean
): Promise<{ success: boolean; error?: string }> {
  const currentResult = await getAppearancePreferences();

  if (!currentResult.success || !currentResult.data) {
    return { success: false, error: currentResult.error || 'Failed to get current preferences' };
  }

  return updateAppearancePreferences({
    ...currentResult.data,
    compactMode,
  });
}
