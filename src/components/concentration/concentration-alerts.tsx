'use client';

/**
 * Concentration Alerts Dashboard
 *
 * Displays alerts when vendor concentration exceeds configured thresholds.
 * Shows critical and warning level alerts for DORA compliance.
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Settings,
  TrendingUp,
  Building2,
  Globe,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useConcentrationData } from './use-concentration-data';
import { MetricCard } from './metric-card';
import { AlertCard } from './alert-card';
import { ThresholdSettingsDialog } from './threshold-settings-dialog';
import { TopConcentrationsList } from './top-concentrations-list';

interface ConcentrationAlertsDashboardProps {
  className?: string;
}

export function ConcentrationAlertsDashboard({
  className,
}: ConcentrationAlertsDashboardProps) {
  const {
    alerts,
    metrics,
    thresholds,
    loading,
    saving,
    saveThresholds,
  } = useConcentrationData();

  const [settingsOpen, setSettingsOpen] = useState(false);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Concentration Risk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Concentration Risk
              </CardTitle>
              <CardDescription>
                DORA requires monitoring concentration risk in ICT service providers
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Thresholds
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              icon={<Building2 className="h-5 w-5" />}
              title="Vendor"
              value={metrics?.vendorConcentration || 0}
              threshold={thresholds}
            />
            <MetricCard
              icon={<Globe className="h-5 w-5" />}
              title="Geographic"
              value={metrics?.geographicConcentration || 0}
              threshold={thresholds}
            />
            <MetricCard
              icon={<Layers className="h-5 w-5" />}
              title="Service"
              value={metrics?.serviceConcentration || 0}
              threshold={thresholds}
            />
          </div>

          {/* Alerts */}
          {alerts.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-600">No concentration alerts</p>
                <p className="text-sm text-muted-foreground">
                  All concentration metrics are within acceptable thresholds
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Active Alerts ({alerts.length})
              </h4>

              {criticalAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}

              {warningAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}

          {/* Top Concentrations */}
          {metrics && <TopConcentrationsList metrics={metrics} />}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <ThresholdSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        thresholds={thresholds}
        onSave={saveThresholds}
        saving={saving}
      />
    </>
  );
}
