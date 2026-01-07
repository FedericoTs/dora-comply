'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConcentrationOverview } from './components/concentration-overview';
import { ConcentrationHeatMap } from './components/concentration-heat-map';
import { SpofDetector } from './components/spof-detector';
import { ConcentrationAlertBanner, ConcentrationAlerts } from './components/concentration-alerts';
import { MetricsGrid } from './components/metrics-grid';
import type {
  ConcentrationMetrics,
  ConcentrationOverviewResponse,
  HeatMapResponse,
  SinglePointOfFailure,
  ConcentrationAlert,
} from '@/lib/concentration/types';

interface ConcentrationData {
  overview: ConcentrationOverviewResponse;
  heatMap: HeatMapResponse;
  metrics: ConcentrationMetrics;
  spofs: SinglePointOfFailure[];
  alerts: ConcentrationAlert[];
}

export function ConcentrationDashboard() {
  const [data, setData] = useState<ConcentrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/concentration');
      if (!response.ok) {
        throw new Error('Failed to fetch concentration data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to Load Data</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { overview, heatMap, metrics, spofs, alerts } = data;

  return (
    <div className="space-y-6">
      {/* Alert Banner (Top Priority Alert) */}
      {alerts.length > 0 && (
        <ConcentrationAlertBanner alerts={alerts} />
      )}

      {/* Risk Level Overview Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Risk Overview</h2>
        <ConcentrationOverview riskLevels={overview.risk_levels} />
      </div>

      {/* Main Content: Heat Map + SPOF Detector */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ConcentrationHeatMap data={heatMap} />
        </div>
        <div>
          <SpofDetector
            spofs={spofs}
            totalCriticalFunctions={metrics.total_critical_functions}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Concentration Metrics</h2>
        <MetricsGrid metrics={metrics} />
      </div>

      {/* All Alerts (Expanded View) */}
      {alerts.length > 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">All Alerts ({alerts.length})</h2>
          <ConcentrationAlerts alerts={alerts} />
        </div>
      )}

      {/* Last Updated */}
      <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
        <p>
          Last updated: {new Date(overview.last_updated).toLocaleString()}
        </p>
        <Button variant="ghost" size="sm" onClick={fetchData}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
