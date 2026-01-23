/**
 * Notification Settings Types
 * Types and constants for notification preferences
 */

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

// ============================================================================
// Default Preferences
// ============================================================================

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
