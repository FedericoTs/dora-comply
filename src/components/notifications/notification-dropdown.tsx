'use client';

/**
 * Notification Dropdown Component
 *
 * Displays recent notifications in a dropdown panel.
 * Shows sample notifications for now - will be connected to real data later.
 */

import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Sample notification type
interface Notification {
  id: string;
  type: 'incident' | 'vendor' | 'compliance' | 'security' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  href?: string;
}

// Sample notifications for demo
const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'incident',
    title: 'Incident Report Due',
    message: 'Initial notification for INC-2025-001 due in 4 hours',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    read: false,
    href: '/incidents',
  },
  {
    id: '2',
    type: 'vendor',
    title: 'Assessment Expiring',
    message: 'CloudSync Ltd. assessment expires in 7 days',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    href: '/vendors',
  },
  {
    id: '3',
    type: 'compliance',
    title: 'RoI Deadline Approaching',
    message: 'Annual Register of Information due in 14 days',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    href: '/roi',
  },
  {
    id: '4',
    type: 'security',
    title: 'New Login Detected',
    message: 'Login from a new device in London, UK',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    read: true,
    href: '/settings/security',
  },
];

const NOTIFICATION_ICONS = {
  incident: AlertTriangle,
  vendor: Building2,
  compliance: FileText,
  security: Shield,
  system: Settings,
};

const NOTIFICATION_COLORS = {
  incident: 'text-error bg-error/10',
  vendor: 'text-warning bg-warning/10',
  compliance: 'text-primary bg-primary/10',
  security: 'text-info bg-info/10',
  system: 'text-muted-foreground bg-muted',
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="icon-btn relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={markAllAsRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground">
                You&apos;re all caught up!
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.type];
              const colorClass = NOTIFICATION_COLORS[notification.type];

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'relative group flex gap-3 p-3 border-b last:border-0 transition-colors',
                    !notification.read && 'bg-accent/50',
                    'hover:bg-muted/50'
                  )}
                >
                  {/* Icon */}
                  <div className={cn('p-2 rounded-lg shrink-0', colorClass)}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={cn(
                            'text-sm font-medium leading-tight',
                            !notification.read && 'text-foreground',
                            notification.read && 'text-muted-foreground'
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>

                      {/* Dismiss button */}
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(notification.timestamp)}
                      </span>
                      {notification.href && (
                        <Link
                          href={notification.href}
                          className="text-xs text-primary hover:underline flex items-center gap-0.5"
                          onClick={() => {
                            markAsRead(notification.id);
                            setIsOpen(false);
                          }}
                        >
                          View
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                  )}
                </div>
              );
            })
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />

        {/* Footer */}
        <div className="p-2">
          <Link href="/settings/notifications">
            <Button
              variant="ghost"
              className="w-full justify-center text-xs h-8"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-3 w-3 mr-1.5" />
              Notification Settings
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
