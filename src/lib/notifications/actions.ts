'use server';

/**
 * Notification Server Actions
 *
 * CRUD operations for in-app notifications with database persistence.
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ============================================================================
// Types
// ============================================================================

export type NotificationType = 'incident' | 'vendor' | 'compliance' | 'security' | 'system';

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  href: string | null;
  read: boolean;
  dismissed: boolean;
  created_at: string;
  read_at: string | null;
}

export interface NotificationStats {
  total: number;
  unread: number;
}

// ============================================================================
// Get Notifications
// ============================================================================

export async function getNotifications(limit = 20): Promise<{
  success: boolean;
  data?: Notification[];
  stats?: NotificationStats;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get notifications (user-specific or org-wide, not dismissed)
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('dismissed', false)
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: error.message };
  }

  const notifications = (data || []) as Notification[];
  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
  };

  return { success: true, data: notifications, stats };
}

// ============================================================================
// Mark as Read
// ============================================================================

export async function markNotificationAsRead(notificationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

// ============================================================================
// Mark All as Read
// ============================================================================

export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString()
    })
    .eq('read', false)
    .or(`user_id.is.null,user_id.eq.${user.id}`);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

// ============================================================================
// Dismiss Notification
// ============================================================================

export async function dismissNotification(notificationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ dismissed: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error dismissing notification:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

// ============================================================================
// Create Notification (for internal use)
// ============================================================================

export async function createNotification(notification: {
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  userId?: string; // If null, notification goes to all org users
}): Promise<{
  success: boolean;
  data?: Notification;
  error?: string;
}> {
  const supabase = await createClient();

  // Get current user's organization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: 'No organization found' };
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      organization_id: userData.organization_id,
      user_id: notification.userId || null,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      href: notification.href || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true, data: data as Notification };
}

// ============================================================================
// Seed Sample Notifications (for demo/testing)
// ============================================================================

export async function seedSampleNotifications(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: 'No organization found' };
  }

  // Check if notifications already exist
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', userData.organization_id);

  if (count && count > 0) {
    return { success: true }; // Already has notifications
  }

  const sampleNotifications = [
    {
      organization_id: userData.organization_id,
      type: 'incident',
      title: 'Incident Report Due Soon',
      message: 'Initial notification for a major incident is due within 24 hours.',
      href: '/incidents',
    },
    {
      organization_id: userData.organization_id,
      type: 'vendor',
      title: 'Vendor Assessment Expiring',
      message: 'Annual assessment for 2 critical vendors expires in 14 days.',
      href: '/vendors',
    },
    {
      organization_id: userData.organization_id,
      type: 'compliance',
      title: 'RoI Submission Reminder',
      message: 'Register of Information annual submission deadline approaching.',
      href: '/roi',
    },
    {
      organization_id: userData.organization_id,
      type: 'security',
      title: 'Enable Two-Factor Authentication',
      message: 'Enhance your account security by enabling MFA.',
      href: '/settings/security',
    },
  ];

  const { error } = await supabase
    .from('notifications')
    .insert(sampleNotifications);

  if (error) {
    console.error('Error seeding notifications:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}
