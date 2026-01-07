'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  RefreshCw,
  Shield,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { gradeToColor, gradeToLabel, type SSCGrade } from '@/lib/external/securityscorecard-types';
import { syncVendorScore } from '@/lib/vendors/monitoring-actions';
import { cn } from '@/lib/utils';

interface ExternalScoreCardProps {
  vendorId: string;
  vendorName: string;
  score?: number | null;
  grade?: SSCGrade | null;
  provider?: string | null;
  lastUpdated?: string | null;
  domain?: string | null;
  monitoringEnabled?: boolean;
  previousScore?: number | null;
  onSetupClick?: () => void;
  onRefresh?: () => void;
  compact?: boolean;
}

function getTimeSince(dateStr: string): string {
  const date = new Date(dateStr);
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

function ScoreChange({ current, previous }: { current: number; previous?: number | null }) {
  if (!previous) return null;

  const change = current - previous;
  if (change === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        No change
      </span>
    );
  }

  const isPositive = change > 0;
  return (
    <span className={cn(
      'flex items-center gap-1 text-xs font-medium',
      isPositive ? 'text-success' : 'text-error'
    )}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{change} pts
    </span>
  );
}

function GradeBadge({ grade, size = 'default' }: { grade: SSCGrade; size?: 'default' | 'large' }) {
  const color = gradeToColor(grade);
  const sizeClasses = size === 'large'
    ? 'w-16 h-16 text-3xl font-bold'
    : 'w-10 h-10 text-lg font-semibold';

  return (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center text-white shadow-sm',
        sizeClasses
      )}
      style={{ backgroundColor: color }}
    >
      {grade}
    </div>
  );
}

export function ExternalScoreCard({
  vendorId,
  vendorName,
  score,
  grade,
  provider,
  lastUpdated,
  domain,
  monitoringEnabled,
  previousScore,
  onSetupClick,
  onRefresh,
  compact = false,
}: ExternalScoreCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncVendorScore(vendorId);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to sync score:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Not configured state
  if (!monitoringEnabled || !domain) {
    return (
      <Card className={cn(compact && 'shadow-none border-dashed')}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <span className="text-sm font-medium">External Risk Monitoring</span>
                <p className="text-xs text-muted-foreground">
                  Not configured - Enable to track security score
                </p>
              </div>
            </div>
            {onSetupClick && (
              <Button variant="outline" size="sm" onClick={onSetupClick} className="gap-2">
                <Settings className="h-4 w-4" />
                Configure
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Has score - show full display
  if (score !== null && score !== undefined && grade) {
    if (compact) {
      return (
        <Card className="shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <GradeBadge grade={grade} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">{score}</span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                    <ScoreChange current={score} previous={previousScore} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {gradeToLabel(grade)} • {domain}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lastUpdated && (
                  <span className="text-xs text-muted-foreground">
                    {getTimeSince(lastUpdated)}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              External Risk Score
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                    <a
                      href={`https://securityscorecard.com/company/${domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {provider || 'SecurityScorecard'}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  View full report on SecurityScorecard
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-start gap-4">
            <GradeBadge grade={grade} size="large" />
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{score}</span>
                <span className="text-muted-foreground">/ 100</span>
              </div>
              <p className="text-sm font-medium mt-1" style={{ color: gradeToColor(grade) }}>
                {gradeToLabel(grade)}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <ScoreChange current={score} previous={previousScore} />
                {lastUpdated && (
                  <span className="text-xs text-muted-foreground">
                    Updated {getTimeSince(lastUpdated)}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              Sync
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Monitoring: {domain}</span>
              {onSetupClick && (
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onSetupClick}>
                  Configure
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Monitoring enabled but no score yet
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <AlertCircle className="h-4 w-4 text-warning" />
            </div>
            <div>
              <span className="text-sm font-medium">Awaiting Score</span>
              <p className="text-xs text-muted-foreground">
                Monitoring {domain} - sync to fetch score
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Syncing...' : 'Fetch Score'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
