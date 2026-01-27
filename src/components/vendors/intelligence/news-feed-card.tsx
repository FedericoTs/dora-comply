'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  Bell,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewsAlertItem } from './news-alert-item';
import { cn } from '@/lib/utils';
import type { VendorNewsAlert, IntelligenceSummary } from '@/lib/intelligence/types';

// =============================================================================
// TYPES
// =============================================================================

interface NewsFeedCardProps {
  alerts: VendorNewsAlert[];
  summary?: IntelligenceSummary | null;
  onRefresh?: () => Promise<void>;
  onMarkRead?: (alertId: string) => Promise<void>;
  onDismiss?: (alertId: string) => Promise<void>;
  showViewAll?: boolean;
  viewAllHref?: string;
  maxAlerts?: number;
  title?: string;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function NewsFeedCard({
  alerts,
  summary,
  onRefresh,
  onMarkRead,
  onDismiss,
  showViewAll = true,
  viewAllHref = '/monitoring',
  maxAlerts = 5,
  title = 'Business Intelligence',
  className,
}: NewsFeedCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const displayAlerts = alerts.slice(0, maxAlerts);
  const hasMore = alerts.length > maxAlerts;
  const unreadCount = summary?.unreadAlerts ?? alerts.filter((a) => !a.is_read).length;
  const criticalCount = summary?.criticalAlerts ?? 0;
  const highCount = summary?.highAlerts ?? 0;

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Newspaper className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              {summary && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {summary.vendorsWithAlerts} vendors monitored
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Severity badges */}
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalCount} Critical
              </Badge>
            )}
            {highCount > 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-orange-500/10 text-orange-700 border-orange-200"
              >
                {highCount} High
              </Badge>
            )}

            {/* Unread badge */}
            {unreadCount > 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-blue-500/10 text-blue-700 border-blue-200"
              >
                <Bell className="h-3 w-3 mr-1" />
                {unreadCount}
              </Badge>
            )}

            {/* Refresh button */}
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
                />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {displayAlerts.length === 0 ? (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
              <Newspaper className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No intelligence alerts</p>
            <p className="text-xs text-gray-400 mt-1">
              Enable monitoring on vendors to receive alerts
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Critical alert banner */}
            {criticalCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    {criticalCount} critical alert{criticalCount !== 1 ? 's' : ''} require
                    attention
                  </p>
                </div>
                <Link
                  href={`${viewAllHref}?severity=critical`}
                  className="text-sm text-red-600 hover:underline"
                >
                  View all
                </Link>
              </div>
            )}

            {/* Alert list */}
            {displayAlerts.map((alert) => (
              <NewsAlertItem
                key={alert.id}
                alert={alert}
                onMarkRead={onMarkRead}
                onDismiss={onDismiss}
                compact
              />
            ))}

            {/* View all link */}
            {(showViewAll || hasMore) && (
              <div className="pt-2">
                <Link
                  href={viewAllHref}
                  className="flex items-center justify-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 py-2"
                >
                  View all alerts
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

export function NewsFeedCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gray-100 rounded-lg animate-pulse" />
            <div>
              <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mt-1" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50/50"
            >
              <div className="w-7 h-7 bg-gray-100 rounded animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse mt-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
