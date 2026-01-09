'use client';

/**
 * Notification Dropdown Component
 *
 * Displays notifications from the database with real-time updates.
 * Features mark as read, dismiss, and links to notification settings.
 */

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  Bell,
  AlertTriangle,
  Building2,
  FileText,
  Shield,
  Settings,
  Check,
  X,
  ChevronRight,
  Loader2,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
  seedSampleNotifications,
  type Notification,
  type NotificationType,
} from '@/lib/notifications/actions';

// ============================================================================
// Configuration
// ============================================================================

const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon: typeof AlertTriangle;
  iconClass: string;
  bgClass: string;
  borderClass: string;
}> = {
  incident: {
    icon: AlertTriangle,
    iconClass: 'text-error',
    bgClass: 'bg-error/10',
    borderClass: 'border-error/20',
  },
  vendor: {
    icon: Building2,
    iconClass: 'text-warning',
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/20',
  },
  compliance: {
    icon: FileText,
    iconClass: 'text-primary',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/20',
  },
  security: {
    icon: Shield,
    iconClass: 'text-info',
    bgClass: 'bg-info/10',
    borderClass: 'border-info/20',
  },
  system: {
    icon: Settings,
    iconClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    borderClass: 'border-muted',
  },
};

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ============================================================================
// Component
// ============================================================================

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Load notifications
  const loadNotifications = async () => {
    const result = await getNotifications();
    if (result.success && result.data) {
      setNotifications(result.data);
      setUnreadCount(result.stats?.unread || 0);
    }
    setIsLoading(false);
  };

  // Initial load and seed sample notifications if needed
  useEffect(() => {
    const init = async () => {
      await seedSampleNotifications();
      await loadNotifications();
    };
    init();
  }, []);

  // Reload when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Handle mark as read
  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      const result = await markNotificationAsRead(id);
      if (result.success) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        toast.error('Failed to mark as read');
      }
    });
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      const result = await markAllNotificationsAsRead();
      if (result.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      } else {
        toast.error('Failed to mark all as read');
      }
    });
  };

  // Handle dismiss
  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    startTransition(async () => {
      const notification = notifications.find(n => n.id === id);
      const result = await dismissNotification(id);
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        toast.error('Failed to dismiss notification');
      }
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    startTransition(async () => {
      await loadNotifications();
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="icon-btn relative group">
          <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 p-0 overflow-hidden rounded-xl border-border/50 shadow-xl"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={isPending}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-primary hover:text-primary"
                onClick={handleMarkAllAsRead}
                disabled={isPending}
              >
                <Check className="h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-4 mb-3">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                No new notifications to show
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => {
                const config = NOTIFICATION_CONFIG[notification.type];
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'relative group flex gap-3 p-4 transition-all duration-200 cursor-pointer',
                      !notification.read && 'bg-accent/40',
                      'hover:bg-muted/60'
                    )}
                    onClick={() => {
                      if (!notification.read) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/50" />
                    )}

                    {/* Icon */}
                    <div className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border',
                      config.bgClass,
                      config.borderClass
                    )}>
                      <Icon className={cn('h-5 w-5', config.iconClass)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm font-medium leading-tight line-clamp-1',
                          notification.read ? 'text-muted-foreground' : 'text-foreground'
                        )}>
                          {notification.title}
                        </p>

                        {/* Dismiss button */}
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 -m-1 hover:bg-muted rounded-lg"
                          onClick={(e) => handleDismiss(notification.id, e)}
                          disabled={isPending}
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-muted-foreground/70">
                          {formatRelativeTime(notification.created_at)}
                        </span>

                        {notification.href && (
                          <Link
                            href={notification.href}
                            className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!notification.read) {
                                handleMarkAsRead(notification.id);
                              }
                              setIsOpen(false);
                            }}
                          >
                            View
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 bg-muted/30 border-t">
          <Link href="/settings/notifications" onClick={() => setIsOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-center text-xs h-9 gap-2 hover:bg-primary/10 hover:text-primary"
            >
              <Settings className="h-3.5 w-3.5" />
              Notification Settings
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
