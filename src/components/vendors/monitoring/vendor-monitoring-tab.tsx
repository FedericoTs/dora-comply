'use client';

import { useState, useEffect } from 'react';
import { ExternalScoreCard } from './external-score-card';
import { FactorBreakdown } from './factor-breakdown';
import { ScoreTrendChart } from './score-trend-chart';
import { MonitoringSetupDialog } from './monitoring-setup-dialog';
import { getScoreHistory } from '@/lib/vendors/monitoring-actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, ExternalLink, Info } from 'lucide-react';
import type { SSCGrade, SSCFactor } from '@/lib/external/securityscorecard-types';

// Flexible type for factors coming from JSON storage
type FactorData = {
  name: string;
  score: number;
  grade: string;
  issueCount: number;
};

interface VendorMonitoringTabProps {
  vendorId: string;
  vendorName: string;
  score?: number | null;
  grade?: SSCGrade | null;
  provider?: string | null;
  lastUpdated?: string | null;
  domain?: string | null;
  monitoringEnabled?: boolean;
  alertThreshold?: number | null;
  factors?: FactorData[] | null;
}

interface ScoreHistoryEntry {
  id: string;
  score: number;
  grade: string;
  recorded_at: string;
}

export function VendorMonitoringTab({
  vendorId,
  vendorName,
  score,
  grade,
  provider,
  lastUpdated,
  domain,
  monitoringEnabled,
  alertThreshold,
  factors,
}: VendorMonitoringTabProps) {
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load score history when monitoring is enabled
  // Intentional: data fetching pattern requires setState in useEffect
  useEffect(() => {
    if (monitoringEnabled && vendorId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoadingHistory(true);
      getScoreHistory(vendorId, 30)
        .then((result) => {
          if (result.success && result.data) {
            setHistory(result.data);
          }
        })
        .finally(() => setIsLoadingHistory(false));
    }
  }, [vendorId, monitoringEnabled, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  // Not configured state
  if (!monitoringEnabled || !domain) {
    return (
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            External monitoring is not configured for this vendor. Enable monitoring to track
            their security posture using SecurityScorecard.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Get Started with Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              SecurityScorecard provides continuous external cyber risk ratings based on
              publicly observable security signals. Enable monitoring to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Track vendor security scores (A-F grades, 0-100 numeric)</li>
              <li>Monitor 10 risk factor categories</li>
              <li>Receive alerts when scores drop below threshold</li>
              <li>View historical score trends</li>
            </ul>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => setSetupDialogOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Enable Monitoring
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://securityscorecard.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn More
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <MonitoringSetupDialog
          open={setupDialogOpen}
          onOpenChange={setSetupDialogOpen}
          vendorId={vendorId}
          vendorName={vendorName}
          currentDomain={domain}
          currentEnabled={monitoringEnabled}
          currentThreshold={alertThreshold}
          onSuccess={handleRefresh}
        />
      </div>
    );
  }

  // Configured - show full monitoring view
  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <ExternalScoreCard
        vendorId={vendorId}
        vendorName={vendorName}
        score={score}
        grade={grade as SSCGrade}
        provider={provider}
        lastUpdated={lastUpdated}
        domain={domain}
        monitoringEnabled={monitoringEnabled}
        onSetupClick={() => setSetupDialogOpen(true)}
        onRefresh={handleRefresh}
      />

      {/* Two Column Layout: Factors & Trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Factor Breakdown */}
        {factors && factors.length > 0 ? (
          <FactorBreakdown factors={factors as SSCFactor[]} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk Factor Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Factor data not available. Try syncing the score.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Score Trend */}
        {isLoadingHistory ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score Trend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ) : history.length > 0 ? (
          <ScoreTrendChart history={history} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Not enough history for trend analysis. Score history will build over time.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Monitoring Configuration</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSetupDialogOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Domain</p>
              <p className="mt-1 font-mono text-sm">{domain}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Provider</p>
              <p className="mt-1 text-sm">{provider || 'SecurityScorecard'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Alert Threshold</p>
              <p className="mt-1 text-sm">
                {alertThreshold ? `Score below ${alertThreshold}` : 'Not set'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <MonitoringSetupDialog
        open={setupDialogOpen}
        onOpenChange={setSetupDialogOpen}
        vendorId={vendorId}
        vendorName={vendorName}
        currentDomain={domain}
        currentEnabled={monitoringEnabled}
        currentThreshold={alertThreshold}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
