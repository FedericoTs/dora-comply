'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Key,
  Mail,
  CreditCard,
  User,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DomainBreachResult, BreachSummary } from '@/lib/external/hibp-types';

// =============================================================================
// TYPES
// =============================================================================

interface BreachExposureCardProps {
  domain: string;
  breachData?: DomainBreachResult | null;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

const severityColors = {
  low: 'bg-green-500/10 text-green-700 border-green-200',
  medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  high: 'bg-orange-500/10 text-orange-700 border-orange-200',
  critical: 'bg-red-500/10 text-red-700 border-red-200',
};

const dataClassIcons: Record<string, typeof Key> = {
  Passwords: Key,
  'Email addresses': Mail,
  'Credit cards': CreditCard,
  Usernames: User,
};

function formatCount(count: number): string {
  if (count >= 1000000000) return `${(count / 1000000000).toFixed(1)}B`;
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

// =============================================================================
// BREACH ITEM
// =============================================================================

function BreachItem({ breach }: { breach: BreachSummary }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        'border rounded-lg p-3',
        severityColors[breach.severity].split(' ').slice(0, 2).join(' ')
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">{breach.name}</h4>
            <Badge
              variant="outline"
              className={cn('text-xs', severityColors[breach.severity])}
            >
              {breach.severity}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(breach.breachDate).toLocaleDateString()} ·{' '}
            {formatCount(breach.pwnCount)} accounts
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-600 mb-2">Data exposed:</p>
          <div className="flex flex-wrap gap-1">
            {breach.dataClasses.map((dc) => {
              const Icon = dataClassIcons[dc] || AlertTriangle;
              return (
                <span
                  key={dc}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white/50 rounded text-xs"
                >
                  <Icon className="h-3 w-3" />
                  {dc}
                </span>
              );
            })}
          </div>
          <a
            href={`https://haveibeenpwned.com/PwnedWebsites#${breach.name.replace(/\s+/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline mt-3"
          >
            View on HIBP <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BreachExposureCard({
  domain,
  breachData,
  onRefresh,
  isLoading = false,
  className,
}: BreachExposureCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const loading = isLoading || isRefreshing;
  const hasBreaches = (breachData?.breachCount || 0) > 0;
  const severity = breachData?.severity || 'low';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'p-2 rounded-lg',
                hasBreaches
                  ? severityColors[severity].split(' ').slice(0, 2).join(' ')
                  : 'bg-green-500/10'
              )}
            >
              {hasBreaches ? (
                <ShieldAlert className="h-5 w-5" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">Breach Exposure</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">{domain}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {breachData && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  hasBreaches ? severityColors[severity] : 'bg-green-500/10 text-green-700'
                )}
              >
                {hasBreaches
                  ? `${breachData.breachCount} breach${breachData.breachCount !== 1 ? 'es' : ''}`
                  : 'No breaches'}
              </Badge>
            )}

            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <div className="py-8 text-center">
            <RefreshCw className="h-8 w-8 text-gray-300 animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Checking breach database...</p>
          </div>
        ) : !breachData ? (
          <div className="py-8 text-center">
            <ShieldAlert className="h-8 w-8 text-gray-300 mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Not checked yet</p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-3"
              >
                Check now
              </Button>
            )}
          </div>
        ) : !hasBreaches ? (
          <div className="py-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
              <ShieldCheck className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-green-700">No Known Breaches</p>
            <p className="text-xs text-gray-500 mt-1">
              This domain has not been found in any known data breaches
            </p>
            {breachData.checkedAt && (
              <p className="text-xs text-gray-400 mt-3">
                Last checked{' '}
                {formatDistanceToNow(new Date(breachData.checkedAt), {
                  addSuffix: true,
                })}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary */}
            <div
              className={cn(
                'p-3 rounded-lg',
                severityColors[severity].split(' ').slice(0, 2).join(' ')
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {formatCount(breachData.totalPwned)}
                  </p>
                  <p className="text-xs opacity-80">Total accounts exposed</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{breachData.breachCount}</p>
                  <p className="text-xs opacity-80">
                    Breach{breachData.breachCount !== 1 ? 'es' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Breach list */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {breachData.breaches.slice(0, 5).map((breach) => (
                <BreachItem key={breach.name} breach={breach} />
              ))}
            </div>

            {breachData.breaches.length > 5 && (
              <p className="text-xs text-center text-gray-500">
                +{breachData.breaches.length - 5} more breaches
              </p>
            )}

            {/* Footer */}
            <div className="pt-2 border-t text-center">
              <p className="text-xs text-gray-400">
                Data from{' '}
                <a
                  href="https://haveibeenpwned.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  Have I Been Pwned
                </a>
              </p>
              {breachData.checkedAt && (
                <p className="text-xs text-gray-400 mt-1">
                  Last checked{' '}
                  {formatDistanceToNow(new Date(breachData.checkedAt), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
