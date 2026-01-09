'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Camera,
  Settings,
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  History,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { MaturityTrendChart } from './components/maturity-trend-chart';
import { PillarProgressCards } from './components/pillar-progress-cards';
import { SnapshotHistory } from './components/snapshot-history';
import { SnapshotSettingsDialog } from './components/snapshot-settings-dialog';
import {
  createMaturitySnapshot,
  getMaturitySnapshots,
  analyzeTrends,
  getSnapshotSettings,
} from '@/lib/compliance/maturity-history';
import type {
  MaturitySnapshot,
  TrendAnalysis,
  MaturitySnapshotSettings,
} from '@/lib/compliance/maturity-history-types';

type TimeRange = '30' | '90' | '180' | '365';

export function MaturityTrendsDashboard() {
  const [snapshots, setSnapshots] = useState<MaturitySnapshot[]>([]);
  const [trends, setTrends] = useState<TrendAnalysis | null>(null);
  const [settings, setSettings] = useState<MaturitySnapshotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('90');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const days = parseInt(timeRange);
      const [snapshotsResult, trendsResult, settingsResult] = await Promise.all([
        getMaturitySnapshots(50),
        analyzeTrends(days),
        getSnapshotSettings(),
      ]);

      if (snapshotsResult.success && snapshotsResult.data) {
        setSnapshots(snapshotsResult.data);
      }

      if (trendsResult.success && trendsResult.data) {
        setTrends(trendsResult.data);
      }

      if (settingsResult.success && settingsResult.data !== undefined) {
        setSettings(settingsResult.data);
      }

      if (isRefresh) {
        toast.success('Data refreshed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      if (isRefresh) {
        toast.error('Failed to refresh data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateSnapshot = async () => {
    setCreatingSnapshot(true);
    try {
      const result = await createMaturitySnapshot('manual');
      if (result.success) {
        toast.success('Snapshot created successfully');
        fetchData(true);
      } else {
        toast.error(result.error || 'Failed to create snapshot');
      }
    } catch (err) {
      toast.error('Failed to create snapshot');
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTrendBadge = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Improving</Badge>;
      case 'declining':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Declining</Badge>;
      default:
        return <Badge variant="secondary">Stable</Badge>;
    }
  };

  const latestSnapshot = snapshots[0];

  if (loading) {
    return null; // Suspense fallback handles this
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="text-red-500 text-lg">{error}</div>
        <Button onClick={() => fetchData()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state when no snapshots exist
  if (snapshots.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header - Always show */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Compliance Trends</h1>
              <p className="text-sm text-muted-foreground">
                Track DORA maturity progression and compliance journey over time
              </p>
            </div>
          </div>
        </div>

        {/* Empty State Card */}
        <Card className="card-premium">
          <CardContent className="pt-6">
            <EmptyState
              icon={Camera}
              title="No compliance snapshots yet"
              description="Take your first compliance snapshot to start tracking maturity progress over time. Snapshots capture your current DORA readiness state and help visualize improvement trends."
              action={{
                label: 'Take First Snapshot',
                onClick: handleCreateSnapshot,
              }}
              secondaryAction={{
                label: 'Run Assessment First',
                href: '/maturity',
                variant: 'outline',
              }}
            />
          </CardContent>
        </Card>

        {/* Getting Started Guide */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base">How Compliance Tracking Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Complete Assessment</p>
                  <p className="text-xs text-muted-foreground">Run a maturity assessment to evaluate your DORA readiness</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Take Snapshots</p>
                  <p className="text-xs text-muted-foreground">Capture your maturity state periodically (manual or automatic)</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Track Progress</p>
                  <p className="text-xs text-muted-foreground">Visualize trends and projected compliance dates</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t">
              <Link
                href="/maturity"
                className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                Go to Maturity Assessment
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Compliance Trends</h1>
            <p className="text-sm text-muted-foreground">
              Track DORA maturity progression and compliance journey over time
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            onClick={handleCreateSnapshot}
            disabled={creatingSnapshot}
          >
            <Camera className={`h-4 w-4 mr-2 ${creatingSnapshot ? 'animate-pulse' : ''}`} />
            {creatingSnapshot ? 'Creating...' : 'Take Snapshot'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Current Maturity Level */}
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Maturity
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                L{latestSnapshot?.overall_maturity_level ?? 0}
              </span>
              <span className="text-sm text-muted-foreground">
                {latestSnapshot?.overall_maturity_label?.split(' - ')[1] || 'Not Assessed'}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {latestSnapshot?.overall_readiness_percent?.toFixed(1) ?? 0}% readiness
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Trend Direction */}
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {timeRange}-Day Trend
            </CardTitle>
            {trends && getTrendIcon(trends.trend_direction)}
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              {trends && getTrendBadge(trends.trend_direction)}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              {trends && trends.overall_change !== 0 && (
                <span className={trends.overall_change > 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {trends.overall_change > 0 ? '+' : ''}{trends.overall_change} level{Math.abs(trends.overall_change) !== 1 ? 's' : ''}
                </span>
              )}
              <span className="text-muted-foreground">
                from {snapshots.length} snapshots
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Gaps Progress */}
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gap Progress
            </CardTitle>
            {trends && trends.gaps_closed > 0 ? (
              <ArrowDownRight className="h-4 w-4 text-emerald-500" />
            ) : trends && trends.gaps_opened > 0 ? (
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-gray-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {latestSnapshot?.critical_gaps_count ?? 0}
              </span>
              <span className="text-sm text-muted-foreground">critical gaps</span>
            </div>
            <div className="mt-2 text-sm">
              {trends && trends.gaps_closed > 0 && (
                <span className="text-emerald-600">
                  {trends.gaps_closed} closed
                </span>
              )}
              {trends && trends.gaps_opened > 0 && (
                <span className="text-red-600">
                  {trends.gaps_opened} new
                </span>
              )}
              {trends && trends.gaps_closed === 0 && trends.gaps_opened === 0 && (
                <span className="text-muted-foreground">No change</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Projected L3 */}
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projected L3 Date
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              {trends?.projected_l3_date ? (
                <>
                  <span className="text-xl font-bold">
                    {new Date(trends.projected_l3_date).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </>
              ) : latestSnapshot && latestSnapshot.overall_maturity_level >= 3 ? (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  L3 Achieved
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">
                  More data needed
                </span>
              )}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {trends?.projected_l3_date
                ? 'Based on current progress'
                : latestSnapshot && latestSnapshot.overall_maturity_level >= 3
                ? 'Well-Defined maturity'
                : 'Keep tracking progress'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Trend Chart */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Maturity Trend
              </CardTitle>
              <CardDescription>
                Overall and pillar maturity levels over time
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MaturityTrendChart
            snapshots={snapshots}
            timeRange={parseInt(timeRange)}
          />
        </CardContent>
      </Card>

      {/* Pillar Progress Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Pillar Progress</h2>
        <PillarProgressCards
          latestSnapshot={latestSnapshot}
          trends={trends}
        />
      </div>

      {/* Snapshot History Table */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle>Snapshot History</CardTitle>
          <CardDescription>
            All compliance maturity snapshots with change tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SnapshotHistory snapshots={snapshots} />
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      {showSettings && (
        <SnapshotSettingsDialog
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSaved={() => {
            setShowSettings(false);
            fetchData(true);
          }}
        />
      )}
    </div>
  );
}
