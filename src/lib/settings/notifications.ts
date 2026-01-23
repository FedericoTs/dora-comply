'use server';

/**
 * Notification Settings Server Actions
 * Server actions for managing user notification preferences
 */

import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
  type EmailNotificationSettings,
  type InAppNotificationSettings,
} from './notification-types';

// Re-export types for convenience (types can be re-exported from 'use server' files)
export type {
  NotificationDigest,
  NotificationCategories,
  EmailNotificationSettings,
  InAppNotificationSettings,
  NotificationPreferences,
} from './notification-types';

// Re-export constant via a getter function
export async function getDefaultNotificationPreferences(): Promise<NotificationPreferences> {
  return DEFAULT_NOTIFICATION_PREFERENCES;
}

// ============================================================================
// Get Notification Preferences
// ============================================================================

export async function getNotificationPreferences(): Promise<{
  success: boolean;
  data?: NotificationPreferences;
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
    .select('notification_preferences')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching notification preferences:', error);
    return { success: false, error: error.message };
  }

  // Return stored preferences or defaults
  const preferences = data?.notification_preferences as NotificationPreferences | null;

  return {
    success: true,
    data: preferences || DEFAULT_NOTIFICATION_PREFERENCES,
  };
}

// ============================================================================
// Update Notification Preferences
// ============================================================================

export async function updateNotificationPreferences(
  preferences: NotificationPreferences
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
      notification_preferences: preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating notification preferences:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================================================
// Update Email Settings
// ============================================================================

export async function updateEmailSettings(
  settings: Partial<EmailNotificationSettings>
): Promise<{ success: boolean; error?: string }> {
  const currentResult = await getNotificationPreferences();

  if (!currentResult.success || !currentResult.data) {
    return { success: false, error: currentResult.error || 'Failed to get current preferences' };
  }

  const updated: NotificationPreferences = {
    ...currentResult.data,
    email: {
      ...currentResult.data.email,
      ...settings,
      categories: {
        ...currentResult.data.email.categories,
        ...(settings.categories || {}),
      },
    },
  };

  return updateNotificationPreferences(updated);
}

// ============================================================================
// Update In-App Settings
// ============================================================================

export async function updateInAppSettings(
  settings: Partial<InAppNotificationSettings>
): Promise<{ success: boolean; error?: string }> {
  const currentResult = await getNotificationPreferences();

  if (!currentResult.success || !currentResult.data) {
    return { success: false, error: currentResult.error || 'Failed to get current preferences' };
  }

  const updated: NotificationPreferences = {
    ...currentResult.data,
    inApp: {
      ...currentResult.data.inApp,
      ...settings,
      categories: {
        ...currentResult.data.inApp.categories,
        ...(settings.categories || {}),
      },
    },
  };

  return updateNotificationPreferences(updated);
}
