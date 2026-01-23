/**
 * Notification Email Sending
 *
 * Handles sending notification emails based on user preferences
 */

import { sendEmail } from './client';
import {
  generateNotificationEmail,
  generateNotificationSubject,
} from './templates/notification';
import type { NotificationType } from '@/lib/notifications/actions';
import type { NotificationPreferences } from '@/lib/settings/notification-types';

interface SendNotificationEmailParams {
  recipientEmail: string;
  recipientName?: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
  preferences: NotificationPreferences;
}

/**
 * Check if email should be sent based on user preferences
 */
export function shouldSendEmail(
  type: NotificationType,
  preferences: NotificationPreferences
): boolean {
  // Check if email notifications are enabled
  if (!preferences.email.enabled) {
    return false;
  }

  // Check if immediate digest is selected (other digests require batch jobs)
  if (preferences.email.digest !== 'immediate') {
    return false;
  }

  // Check if this notification type is enabled
  const categoryKey = getCategoryKey(type);
  if (!preferences.email.categories[categoryKey]) {
    return false;
  }

  return true;
}

/**
 * Map notification type to category key
 */
function getCategoryKey(type: NotificationType): keyof NotificationPreferences['email']['categories'] {
  const mapping: Record<NotificationType, keyof NotificationPreferences['email']['categories']> = {
    incident: 'incidents',
    vendor: 'vendors',
    compliance: 'compliance',
    security: 'security',
    system: 'system',
  };
  return mapping[type];
}

/**
 * Send a notification email
 */
export async function sendNotificationEmail(
  params: SendNotificationEmailParams
): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  const { recipientEmail, recipientName, type, title, message, href, preferences } = params;

  // Check if we should send based on preferences
  if (!shouldSendEmail(type, preferences)) {
    return { success: true, skipped: true };
  }

  // Generate email content
  const subject = generateNotificationSubject({ type, title, message, href });
  const html = generateNotificationEmail({
    type,
    title,
    message,
    href,
    recipientName,
  });

  // Send the email
  return sendEmail({
    to: recipientEmail,
    subject,
    html,
  });
}
