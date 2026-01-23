'use client';

/**
 * Notification History Page
 *
 * Full page view of all notifications with filtering, pagination,
 * and bulk actions.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  AlertTriangle,
  Building2,
  FileText,
  Shield,
  Settings,
  Check,
  CheckCheck,
  X,
  Filter,
  Loader2,
  Inbox,
  ChevronRight,
  Wifi,
  WifiOff,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
  type Notification,
  type NotificationType,
} from '@/lib/notifications/actions';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';

// ============================================================================
// Configuration
// ============================================================================

const NOTIFICATION_CONFIG: Record<
  NotificationType,
  {
    icon: typeof AlertTriangle;
    iconClass: string;
    bgClass: string;
    borderClass: string;
    label: string;
  }
> = {
  incident: {
    icon: AlertTriangle,
    iconClass: 'text-error',
    bgClass: 'bg-error/10',
    borderClass: 'border-error/20',
    label: 'Incident',
  },
  vendor: {
    icon: Building2,
    iconClass: 'text-warning',
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/20',
    label: 'Vendor',
  },
  compliance: {
    icon: FileText,
    iconClass: 'text-primary',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/20',
    label: 'Compliance',
  },
  security: {
    icon: Shield,
    iconClass: 'text-info',
    bgClass: 'bg-info/10',
    borderClass: 'border-info/20',
    label: 'Security',
  },
  system: {
    icon: Settings,
    iconClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    borderClass: 'border-muted',
    label: 'System',
  },
};

// ============================================================================
// Component
// ============================================================================

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Real-time notifications subscription
  const { isConnected } = useRealtimeNotifications({
    showToasts: true,
    onNewNotification: useCallback((newNotification: Notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotification.id)) {
          return prev;
        }
        return [newNotification, ...prev];
      });
    }, []),
  });

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    const result = await getNotifications(100); // Load more for history
    if (result.success && result.data) {
      setNotifications(result.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (statusFilter === 'unread' && n.read) return false;
    if (statusFilter === 'read' && !n.read) return false;
    return true;
  });

  // Stats
  const stats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
  };

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  // Actions
  const handleMarkAsRead = async (id: string) => {
    setIsActioning(true);
    const result = await markNotificationAsRead(id);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } else {
      toast.error('Failed to mark as read');
    }
    setIsActioning(false);
  };

  const handleMarkAllAsRead = async () => {
    setIsActioning(true);
    const result = await markAllNotificationsAsRead();
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } else {
      toast.error('Failed to mark all as read');
    }
    setIsActioning(false);
  };

  const handleDismiss = async (id: string) => {
    setIsActioning(true);
    const result = await dismissNotification(id);
    if (result.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      toast.error('Failed to dismiss notification');
    }
    setIsActioning(false);
  };

  const handleBulkDismiss = async () => {
    if (selectedIds.size === 0) return;

    setIsActioning(true);
    let failed = 0;
    for (const id of selectedIds) {
      const result = await dismissNotification(id);
      if (!result.success) failed++;
    }

    if (failed === 0) {
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} notifications dismissed`);
    } else {
      toast.error(`Failed to dismiss ${failed} notifications`);
      loadNotifications();
    }
    setIsActioning(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            View and manage all your notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Realtime indicator */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
              isConnected
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-muted text-muted-foreground border'
            )}
          >
            {isConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {isConnected ? 'Live updates' : 'Connecting...'}
          </div>
          <Link href="/settings/notifications">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold text-primary">
              {stats.unread}
            </div>
            <div className="text-xs text-muted-foreground">Unread</div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-2">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Quick Actions</div>
              <div className="text-xs text-muted-foreground">
                Mark all as read or manage selected
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleMarkAllAsRead}
              disabled={isActioning || stats.unread === 0}
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Bulk Actions */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as NotificationType | 'all')}
              >
                <SelectTrigger className="w-36 h-8">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(NOTIFICATION_CONFIG).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as 'all' | 'unread' | 'read')}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedIds.size} selected</Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={handleBulkDismiss}
                  disabled={isActioning}
                >
                  <Trash2 className="h-4 w-4" />
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Inbox className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="font-medium">No notifications</p>
              <p className="text-sm text-muted-foreground mt-1">
                {typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Select all row */}
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/30">
                <Checkbox
                  checked={
                    selectedIds.size === filteredNotifications.length &&
                    filteredNotifications.length > 0
                  }
                  onCheckedChange={selectAll}
                />
                <span className="text-xs text-muted-foreground">
                  Select all ({filteredNotifications.length})
                </span>
              </div>

              {/* Notification list */}
              {filteredNotifications.map((notification) => {
                const config = NOTIFICATION_CONFIG[notification.type];
                const Icon = config.icon;
                const isSelected = selectedIds.has(notification.id);

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-3 p-4 transition-colors',
                      !notification.read && 'bg-accent/30',
                      isSelected && 'bg-primary/5'
                    )}
                  >
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(notification.id)}
                      className="mt-1"
                    />

                    {/* Icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border',
                        config.bgClass,
                        config.borderClass
                      )}
                    >
                      <Icon className={cn('h-5 w-5', config.iconClass)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={cn(
                                'font-medium text-sm',
                                notification.read && 'text-muted-foreground'
                              )}
                            >
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px]">
                              {config.label}
                            </Badge>
                            <span>
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            <span className="hidden sm:inline">
                              {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {notification.href && (
                            <Link href={notification.href}>
                              <Button variant="ghost" size="sm" className="gap-1 h-8">
                                View
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={isActioning}
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDismiss(notification.id)}
                            disabled={isActioning}
                            title="Dismiss"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
