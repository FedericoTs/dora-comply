'use client';

/**
 * Real-time Notifications Hook
 *
 * Subscribes to the notifications table using Supabase Realtime
 * to receive instant notifications and show toast alerts.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Notification, NotificationType } from '@/lib/notifications/actions';

// Notification type icons/labels for toast
const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, { emoji: string; label: string }> = {
  incident: { emoji: '🚨', label: 'Incident' },
  vendor: { emoji: '🏢', label: 'Vendor' },
  compliance: { emoji: '📋', label: 'Compliance' },
  security: { emoji: '🔐', label: 'Security' },
  system: { emoji: '⚙️', label: 'System' },
};

interface UseRealtimeNotificationsOptions {
  /**
   * Whether to show toast notifications for new notifications
   * @default true
   */
  showToasts?: boolean;
  /**
   * Callback when a new notification is received
   */
  onNewNotification?: (notification: Notification) => void;
}

interface UseRealtimeNotificationsReturn {
  /**
   * Whether the realtime subscription is connected
   */
  isConnected: boolean;
  /**
   * The latest notification received
   */
  latestNotification: Notification | null;
  /**
   * Count of new notifications since the hook was mounted
   */
  newNotificationCount: number;
  /**
   * Reset the new notification count
   */
  resetCount: () => void;
}

export function useRealtimeNotifications(
  options: UseRealtimeNotificationsOptions = {}
): UseRealtimeNotificationsReturn {
  const { showToasts = true, onNewNotification } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const [newNotificationCount, setNewNotificationCount] = useState(0);

  // Use ref to avoid stale closure issues with callbacks
  const onNewNotificationRef = useRef(onNewNotification);
  onNewNotificationRef.current = onNewNotification;

  const resetCount = useCallback(() => {
    setNewNotificationCount(0);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = async () => {
      // Get current user to filter notifications
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's organization
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!member) return;

      // Subscribe to notifications table
      channel = supabase
        .channel('realtime-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `organization_id=eq.${member.organization_id}`,
          },
          (payload: RealtimePostgresChangesPayload<Notification>) => {
            const notification = payload.new as Notification;

            // Only process if notification is for all users or this specific user
            if (notification.user_id && notification.user_id !== user.id) {
              return;
            }

            setLatestNotification(notification);
            setNewNotificationCount((prev) => prev + 1);

            // Show toast notification
            if (showToasts) {
              const config = NOTIFICATION_TYPE_CONFIG[notification.type] || {
                emoji: '🔔',
                label: 'Notification',
              };

              toast(notification.title, {
                description: notification.message,
                icon: config.emoji,
                action: notification.href
                  ? {
                      label: 'View',
                      onClick: () => {
                        window.location.href = notification.href!;
                      },
                    }
                  : undefined,
                duration: 5000,
              });
            }

            // Call the callback if provided
            onNewNotificationRef.current?.(notification);
          }
        )
        .subscribe((status: string) => {
          setIsConnected(status === 'SUBSCRIBED');
        });
    };

    setupSubscription();

    // Cleanup on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [showToasts]);

  return {
    isConnected,
    latestNotification,
    newNotificationCount,
    resetCount,
  };
}
