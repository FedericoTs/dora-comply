'use server';

/**
 * Notification Settings
 * Types and server actions for managing user notification preferences
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export type NotificationDigest = 'immediate' | 'daily' | 'weekly' | 'none';

export interface NotificationCategories {
  incidents: boolean; // Incident reporting deadlines, updates
  vendors: boolean; // Vendor assessment reminders, risk alerts
  compliance: boolean; // RoI deadlines, compliance updates
  security: boolean; // MFA prompts, login alerts
  system: boolean; // Platform updates, maintenance
}

export interface EmailNotificationSettings {
  enabled: boolean;
  digest: NotificationDigest;
  categories: NotificationCategories;
}

export interface InAppNotificationSettings {
  enabled: boolean;
  categories: NotificationCategories;
}

export interface NotificationPreferences {
  email: EmailNotificationSettings;
  inApp: InAppNotificationSettings;
}

// Default preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: {
    enabled: true,
    digest: 'immediate',
    categories: {
      incidents: true,
      vendors: true,
      compliance: true,
      security: true,
      system: true,
    },
  },
  inApp: {
    enabled: true,
    categories: {
      incidents: true,
      vendors: true,
      compliance: true,
      security: true,
      system: true,
    },
  },
};

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
