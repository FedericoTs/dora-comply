'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RefreshCw, Clock, CheckCircle2, AlertTriangle, Database } from 'lucide-react';

interface VendorGleifStatusProps {
  gleifFetchedAt?: string | null;
  leiVerifiedAt?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

function getTimeSince(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getFreshnessStatus(dateStr: string | null | undefined): {
  status: 'fresh' | 'stale' | 'old';
  color: string;
  message: string;
} {
  if (!dateStr) {
    return {
      status: 'old',
      color: 'text-muted-foreground',
      message: 'Never fetched',
    };
  }

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 1) {
    return {
      status: 'fresh',
      color: 'text-success',
      message: 'Data is current',
    };
  }
  if (diffDays < 7) {
    return {
      status: 'stale',
      color: 'text-warning',
      message: 'Consider refreshing',
    };
  }
  return {
    status: 'old',
    color: 'text-error',
    message: 'Data may be outdated',
  };
}

export function VendorGleifStatus({
  gleifFetchedAt,
  leiVerifiedAt,
  onRefresh,
  isRefreshing,
}: VendorGleifStatusProps) {
  const freshness = getFreshnessStatus(gleifFetchedAt);
  const FreshnessIcon = freshness.status === 'fresh' ? CheckCircle2 :
    freshness.status === 'stale' ? Clock : AlertTriangle;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted`}>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">GLEIF Data</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className={`gap-1 ${freshness.color}`}>
                        <FreshnessIcon className="h-3 w-3" />
                        {freshness.status === 'fresh' ? 'Current' :
                          freshness.status === 'stale' ? 'Stale' : 'Outdated'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{freshness.message}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {gleifFetchedAt ? (
                  <>Last fetched: {getTimeSince(gleifFetchedAt)}</>
                ) : (
                  <>Never fetched from GLEIF</>
                )}
                {leiVerifiedAt && gleifFetchedAt !== leiVerifiedAt && (
                  <> • LEI verified: {getTimeSince(leiVerifiedAt)}</>
                )}
              </div>
            </div>
          </div>

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
