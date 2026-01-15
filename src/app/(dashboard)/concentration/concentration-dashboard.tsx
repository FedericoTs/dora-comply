'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Network, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConcentrationOverview } from './components/concentration-overview';
import { ConcentrationHeatMap } from './components/concentration-heat-map';
import { SpofDetector } from './components/spof-detector';
import { ConcentrationAlertBanner, ConcentrationAlerts } from './components/concentration-alerts';
import { MetricsGrid } from './components/metrics-grid';
import { FourthPartyCards } from './components/fourth-party-cards';
import { SupplyChainVisualization } from './components/supply-chain-visualization';
import { toast } from 'sonner';
import type {
  ConcentrationMetrics,
  ConcentrationOverviewResponse,
  HeatMapResponse,
  SinglePointOfFailure,
  ConcentrationAlert,
  DependencyGraph,
} from '@/lib/concentration/types';
import type { AggregateChainMetrics } from '@/lib/concentration/chain-utils';

interface ConcentrationData {
  overview: ConcentrationOverviewResponse;
  heatMap: HeatMapResponse;
  metrics: ConcentrationMetrics;
  spofs: SinglePointOfFailure[];
  alerts: ConcentrationAlert[];
  supplyChain: {
    graph: DependencyGraph;
    chainMetrics: AggregateChainMetrics;
  };
}

interface ConcentrationDashboardProps {
  showHeader?: boolean;
}

export function ConcentrationDashboard({ showHeader = true }: ConcentrationDashboardProps) {
  const [data, setData] = useState<ConcentrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/concentration');
      if (!response.ok) {
        throw new Error('Failed to fetch concentration data');
      }
      const result = await response.json();
      setData(result);
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
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/board/report?format=pdf');
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Concentration-Risk-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
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
        <Button onClick={() => fetchData()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { overview, heatMap, metrics, spofs, alerts, supplyChain } = data;

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      {showHeader && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Concentration Risk
              </h1>
              <p className="text-muted-foreground">
                DORA Article 28-29 ICT third-party concentration monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className={`mr-2 h-4 w-4 ${exporting ? 'animate-pulse' : ''}`} />
              {exporting ? 'Exporting...' : 'Export Report'}
            </Button>
          </div>
        </div>
      )}

      {/* Alert Banner (Top Priority Alert) */}
      {alerts.length > 0 && (
        <ConcentrationAlertBanner alerts={alerts} />
      )}

      {/* Risk Level Overview Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Risk Overview</h2>
        <ConcentrationOverview riskLevels={overview.risk_levels} />
      </div>

      {/* Fourth-Party Risk Summary */}
      {supplyChain.chainMetrics.totalFourthParties > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Fourth-Party Risk</h2>
          <FourthPartyCards metrics={supplyChain.chainMetrics} />
        </div>
      )}

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

      {/* Supply Chain Graph */}
      {supplyChain.graph.nodes.length > 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Supply Chain Visualization</h2>
          <SupplyChainVisualization
            graph={supplyChain.graph}
            metrics={supplyChain.chainMetrics}
          />
        </div>
      )}

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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
    </div>
  );
}
