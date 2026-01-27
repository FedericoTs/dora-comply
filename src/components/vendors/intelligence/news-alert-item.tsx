'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Newspaper,
  Gavel,
  TrendingUp,
  Users,
  ShieldAlert,
  FileText,
  Info,
  ExternalLink,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  VendorNewsAlert,
  IntelligenceAlertType,
  IntelligenceSeverity,
  IntelligenceSentiment,
} from '@/lib/intelligence/types';

// =============================================================================
// TYPES
// =============================================================================

interface NewsAlertItemProps {
  alert: VendorNewsAlert;
  onMarkRead?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  showVendorName?: boolean;
  vendorName?: string;
  compact?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

const alertTypeIcons: Record<IntelligenceAlertType, typeof Newspaper> = {
  news: Newspaper,
  regulatory: Gavel,
  financial: TrendingUp,
  leadership: Users,
  breach: ShieldAlert,
  filing: FileText,
  other: Info,
};

const alertTypeLabels: Record<IntelligenceAlertType, string> = {
  news: 'News',
  regulatory: 'Regulatory',
  financial: 'Financial',
  leadership: 'Leadership',
  breach: 'Security',
  filing: 'SEC Filing',
  other: 'Other',
};

const severityColors: Record<IntelligenceSeverity, string> = {
  low: 'bg-green-500/10 text-green-700 border-green-200',
  medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  high: 'bg-orange-500/10 text-orange-700 border-orange-200',
  critical: 'bg-red-500/10 text-red-700 border-red-200',
};

const sentimentColors: Record<IntelligenceSentiment, string> = {
  positive: 'text-green-600',
  neutral: 'text-gray-500',
  negative: 'text-red-600',
};

// =============================================================================
// COMPONENT
// =============================================================================

export function NewsAlertItem({
  alert,
  onMarkRead,
  onDismiss,
  showVendorName = false,
  vendorName,
  compact = false,
}: NewsAlertItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  const Icon = alertTypeIcons[alert.alert_type] || Info;
  const typeLabel = alertTypeLabels[alert.alert_type] || 'Alert';

  const handleMarkRead = async () => {
    if (!onMarkRead || alert.is_read) return;
    setIsActioning(true);
    await onMarkRead(alert.id);
    setIsActioning(false);
  };

  const handleDismiss = async () => {
    if (!onDismiss) return;
    setIsActioning(true);
    await onDismiss(alert.id);
    setIsActioning(false);
  };

  const publishedDate = alert.published_at || alert.created_at;
  const timeAgo = publishedDate
    ? formatDistanceToNow(new Date(publishedDate), { addSuffix: true })
    : '';

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg border transition-colors',
          alert.is_read ? 'bg-gray-50/50' : 'bg-white',
          !alert.is_read && 'border-l-4',
          !alert.is_read && severityColors[alert.severity].split(' ')[0]
        )}
      >
        <div
          className={cn(
            'p-1.5 rounded-md',
            severityColors[alert.severity].split(' ').slice(0, 2).join(' ')
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm line-clamp-1',
              alert.is_read ? 'text-gray-600' : 'font-medium text-gray-900'
            )}
          >
            {alert.headline}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {typeLabel} · {timeAgo}
          </p>
        </div>
        {alert.url && (
          <a
            href={alert.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        alert.is_read ? 'bg-gray-50/50' : 'bg-white shadow-sm',
        !alert.is_read && 'border-l-4',
        !alert.is_read && alert.severity === 'critical' && 'border-l-red-500',
        !alert.is_read && alert.severity === 'high' && 'border-l-orange-500',
        !alert.is_read && alert.severity === 'medium' && 'border-l-yellow-500',
        !alert.is_read && alert.severity === 'low' && 'border-l-green-500'
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'p-2 rounded-lg',
              severityColors[alert.severity].split(' ').slice(0, 2).join(' ')
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {typeLabel}
              </Badge>
              <Badge
                variant="outline"
                className={cn('text-xs', severityColors[alert.severity])}
              >
                {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
              </Badge>
              {alert.sentiment_label && (
                <span
                  className={cn('text-xs', sentimentColors[alert.sentiment_label])}
                >
                  {alert.sentiment_label === 'positive' && '↑'}
                  {alert.sentiment_label === 'negative' && '↓'}
                  {alert.sentiment_label === 'neutral' && '→'}{' '}
                  {alert.sentiment_label}
                </span>
              )}
              {showVendorName && vendorName && (
                <span className="text-xs text-gray-500">· {vendorName}</span>
              )}
            </div>

            {/* Headline */}
            <h4
              className={cn(
                'mt-2 text-sm',
                alert.is_read ? 'text-gray-600' : 'font-semibold text-gray-900'
              )}
            >
              {alert.headline}
            </h4>

            {/* Summary (expandable) */}
            {alert.summary && (
              <div className="mt-2">
                <p
                  className={cn(
                    'text-sm text-gray-600',
                    !isExpanded && 'line-clamp-2'
                  )}
                >
                  {alert.summary}
                </p>
                {alert.summary.length > 150 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 text-xs text-emerald-600 mt-1 hover:underline"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3" /> Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" /> Show more
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Keywords */}
            {alert.keywords && alert.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {alert.keywords.slice(0, 5).map((keyword) => (
                  <span
                    key={keyword}
                    className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{timeAgo}</span>
                {alert.source && (
                  <span className="capitalize">via {alert.source.replace('_', ' ')}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {alert.url && (
                  <a
                    href={alert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                  >
                    View source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {!alert.is_read && onMarkRead && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleMarkRead}
                disabled={isActioning}
                title="Mark as read"
              >
                <Check className="h-4 w-4 text-gray-400 hover:text-green-600" />
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDismiss}
                disabled={isActioning}
                title="Dismiss"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-red-600" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
