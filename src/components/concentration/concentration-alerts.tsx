'use client';

/**
 * Concentration Alerts Dashboard
 *
 * Displays alerts when vendor concentration exceeds configured thresholds.
 * Shows critical and warning level alerts for DORA compliance.
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertTriangle,
  AlertCircle,
  Settings,
  TrendingUp,
  Building2,
  Globe,
  Layers,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ConcentrationAlert {
  id: string;
  type: 'vendor' | 'geographic' | 'service';
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  percentage: number;
  threshold: number;
  affectedItems: string[];
  createdAt: string;
}

interface ConcentrationThresholds {
  critical: number;
  warning: number;
}

interface ConcentrationMetrics {
  vendorConcentration: number;
  geographicConcentration: number;
  serviceConcentration: number;
  topVendors: Array<{ name: string; percentage: number }>;
  topCountries: Array<{ country: string; percentage: number }>;
  topServices: Array<{ service: string; percentage: number }>;
}

interface ConcentrationAlertsDashboardProps {
  className?: string;
}

interface VendorRecord {
  id: string;
  name: string;
  headquarters_country: string | null;
  service_types: string[] | null;
  tier: string | null;
  supports_critical_function: boolean | null;
}

const ALERT_TYPE_ICONS: Record<string, React.ReactNode> = {
  vendor: <Building2 className="h-4 w-4" />,
  geographic: <Globe className="h-4 w-4" />,
  service: <Layers className="h-4 w-4" />,
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  vendor: 'Vendor Concentration',
  geographic: 'Geographic Concentration',
  service: 'Service Concentration',
};

export function ConcentrationAlertsDashboard({
  className,
}: ConcentrationAlertsDashboardProps) {
  const [alerts, setAlerts] = useState<ConcentrationAlert[]>([]);
  const [metrics, setMetrics] = useState<ConcentrationMetrics | null>(null);
  const [thresholds, setThresholds] = useState<ConcentrationThresholds>({
    critical: 40,
    warning: 25,
  });
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editThresholds, setEditThresholds] = useState(thresholds);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const supabase = createClient();

    try {
      // Get organization thresholds
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData) return;

      const { data: orgData } = await supabase
        .from('organizations')
        .select('concentration_threshold_critical, concentration_threshold_warning')
        .eq('id', userData.organization_id)
        .single();

      if (orgData) {
        const newThresholds = {
          critical: orgData.concentration_threshold_critical || 40,
          warning: orgData.concentration_threshold_warning || 25,
        };
        setThresholds(newThresholds);
        setEditThresholds(newThresholds);
      }

      // Get vendors for concentration analysis
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('id, name, headquarters_country, service_types, tier, supports_critical_function')
        .eq('organization_id', userData.organization_id)
        .is('deleted_at', null);

      const vendors = (vendorsData || []) as VendorRecord[];

      if (vendors.length === 0) {
        setMetrics(null);
        setAlerts([]);
        setLoading(false);
        return;
      }

      // Calculate concentration metrics
      const totalVendors = vendors.length;
      const criticalVendors = vendors.filter(v => v.tier === 'critical' || v.supports_critical_function);

      // Vendor concentration (critical vendors as % of total)
      const vendorConcentration = (criticalVendors.length / totalVendors) * 100;

      // Geographic concentration
      const countryCount: Record<string, number> = {};
      vendors.forEach(v => {
        const country = v.headquarters_country || 'Unknown';
        countryCount[country] = (countryCount[country] || 0) + 1;
      });
      const topCountry = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0];
      const geographicConcentration = topCountry ? (topCountry[1] / totalVendors) * 100 : 0;

      // Service concentration
      const serviceCount: Record<string, number> = {};
      vendors.forEach(v => {
        (v.service_types || []).forEach((s: string) => {
          serviceCount[s] = (serviceCount[s] || 0) + 1;
        });
      });
      const topService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0];
      const serviceConcentration = topService ? (topService[1] / totalVendors) * 100 : 0;

      // Build metrics
      const calculatedMetrics: ConcentrationMetrics = {
        vendorConcentration,
        geographicConcentration,
        serviceConcentration,
        topVendors: criticalVendors.slice(0, 5).map(v => ({
          name: v.name,
          percentage: (1 / criticalVendors.length) * 100,
        })),
        topCountries: Object.entries(countryCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([country, count]) => ({
            country,
            percentage: (count / totalVendors) * 100,
          })),
        topServices: Object.entries(serviceCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([service, count]) => ({
            service,
            percentage: (count / totalVendors) * 100,
          })),
      };

      setMetrics(calculatedMetrics);

      // Generate alerts based on thresholds
      const newAlerts: ConcentrationAlert[] = [];
      const currentThresholds = orgData ? {
        critical: orgData.concentration_threshold_critical || 40,
        warning: orgData.concentration_threshold_warning || 25,
      } : thresholds;

      // Vendor concentration alert
      if (vendorConcentration >= currentThresholds.critical) {
        newAlerts.push({
          id: 'vendor-critical',
          type: 'vendor',
          severity: 'critical',
          title: 'Critical Vendor Concentration',
          description: `${criticalVendors.length} of ${totalVendors} vendors are marked as critical or support critical functions`,
          percentage: vendorConcentration,
          threshold: currentThresholds.critical,
          affectedItems: criticalVendors.map(v => v.name),
          createdAt: new Date().toISOString(),
        });
      } else if (vendorConcentration >= currentThresholds.warning) {
        newAlerts.push({
          id: 'vendor-warning',
          type: 'vendor',
          severity: 'warning',
          title: 'Vendor Concentration Warning',
          description: `${criticalVendors.length} of ${totalVendors} vendors are marked as critical or support critical functions`,
          percentage: vendorConcentration,
          threshold: currentThresholds.warning,
          affectedItems: criticalVendors.map(v => v.name),
          createdAt: new Date().toISOString(),
        });
      }

      // Geographic concentration alert
      if (geographicConcentration >= currentThresholds.critical) {
        newAlerts.push({
          id: 'geo-critical',
          type: 'geographic',
          severity: 'critical',
          title: 'Critical Geographic Concentration',
          description: `${topCountry[1]} of ${totalVendors} vendors are headquartered in ${topCountry[0]}`,
          percentage: geographicConcentration,
          threshold: currentThresholds.critical,
          affectedItems: [topCountry[0]],
          createdAt: new Date().toISOString(),
        });
      } else if (geographicConcentration >= currentThresholds.warning) {
        newAlerts.push({
          id: 'geo-warning',
          type: 'geographic',
          severity: 'warning',
          title: 'Geographic Concentration Warning',
          description: `${topCountry[1]} of ${totalVendors} vendors are headquartered in ${topCountry[0]}`,
          percentage: geographicConcentration,
          threshold: currentThresholds.warning,
          affectedItems: [topCountry[0]],
          createdAt: new Date().toISOString(),
        });
      }

      // Service concentration alert
      if (serviceConcentration >= currentThresholds.critical && topService) {
        newAlerts.push({
          id: 'service-critical',
          type: 'service',
          severity: 'critical',
          title: 'Critical Service Concentration',
          description: `${topService[1]} vendors provide "${topService[0]}" services`,
          percentage: serviceConcentration,
          threshold: currentThresholds.critical,
          affectedItems: [topService[0]],
          createdAt: new Date().toISOString(),
        });
      } else if (serviceConcentration >= currentThresholds.warning && topService) {
        newAlerts.push({
          id: 'service-warning',
          type: 'service',
          severity: 'warning',
          title: 'Service Concentration Warning',
          description: `${topService[1]} vendors provide "${topService[0]}" services`,
          percentage: serviceConcentration,
          threshold: currentThresholds.warning,
          affectedItems: [topService[0]],
          createdAt: new Date().toISOString(),
        });
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error fetching concentration data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveThresholds() {
    setSaving(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData) throw new Error('No organization');

      const { error } = await supabase
        .from('organizations')
        .update({
          concentration_threshold_critical: editThresholds.critical,
          concentration_threshold_warning: editThresholds.warning,
        })
        .eq('id', userData.organization_id);

      if (error) throw error;

      setThresholds(editThresholds);
      setSettingsOpen(false);
      toast.success('Thresholds updated');

      // Refresh data to recalculate alerts
      fetchData();
    } catch (error) {
      console.error('Error saving thresholds:', error);
      toast.error('Failed to save thresholds');
    } finally {
      setSaving(false);
    }
  }

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
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <h4 className="text-sm font-medium mb-2">Top Countries</h4>
                <div className="space-y-2">
                  {metrics.topCountries.slice(0, 3).map((c, i) => (
                    <div key={c.country} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{c.country}</span>
                      <Badge variant="secondary">{c.percentage.toFixed(0)}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Top Services</h4>
                <div className="space-y-2">
                  {metrics.topServices.slice(0, 3).map((s, i) => (
                    <div key={s.service} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate">{s.service}</span>
                      <Badge variant="secondary">{s.percentage.toFixed(0)}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Critical Vendors</h4>
                <div className="space-y-2">
                  {metrics.topVendors.slice(0, 3).map((v, i) => (
                    <div key={v.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate">{v.name}</span>
                      <Badge variant="outline">Critical</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concentration Thresholds</DialogTitle>
            <DialogDescription>
              Set the percentage thresholds for concentration alerts.
              Alerts trigger when any concentration metric exceeds these values.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="critical" className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Critical Threshold (%)
              </Label>
              <Input
                id="critical"
                type="number"
                min="1"
                max="100"
                value={editThresholds.critical}
                onChange={(e) =>
                  setEditThresholds({ ...editThresholds, critical: Number(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">
                Triggers critical alerts when concentration exceeds this value
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="warning" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Warning Threshold (%)
              </Label>
              <Input
                id="warning"
                type="number"
                min="1"
                max="100"
                value={editThresholds.warning}
                onChange={(e) =>
                  setEditThresholds({ ...editThresholds, warning: Number(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">
                Triggers warning alerts when concentration exceeds this value
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveThresholds} disabled={saving}>
              {saving ? 'Saving...' : 'Save Thresholds'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MetricCard({
  icon,
  title,
  value,
  threshold,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  threshold: ConcentrationThresholds;
}) {
  const severity = value >= threshold.critical ? 'critical' : value >= threshold.warning ? 'warning' : 'ok';

  return (
    <div
      className={cn('p-4 rounded-lg border', {
        'bg-red-500/10 border-red-500/30': severity === 'critical',
        'bg-amber-500/10 border-amber-500/30': severity === 'warning',
        'bg-muted/30 border-border': severity === 'ok',
      })}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn('p-1.5 rounded', {
            'bg-red-500/20 text-red-600': severity === 'critical',
            'bg-amber-500/20 text-amber-600': severity === 'warning',
            'bg-muted text-muted-foreground': severity === 'ok',
          })}
        >
          {icon}
        </div>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold">{value.toFixed(0)}%</span>
        <Badge
          variant="outline"
          className={cn('text-xs', {
            'border-red-500 text-red-600': severity === 'critical',
            'border-amber-500 text-amber-600': severity === 'warning',
            'border-emerald-500 text-emerald-600': severity === 'ok',
          })}
        >
          {severity === 'ok' ? 'OK' : severity}
        </Badge>
      </div>
      <Progress
        value={value}
        className={cn('mt-2 h-1.5', {
          '[&>div]:bg-red-500': severity === 'critical',
          '[&>div]:bg-amber-500': severity === 'warning',
          '[&>div]:bg-emerald-500': severity === 'ok',
        })}
      />
    </div>
  );
}

function AlertCard({ alert }: { alert: ConcentrationAlert }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn('p-4 rounded-lg border', {
        'bg-red-500/10 border-red-500/30': alert.severity === 'critical',
        'bg-amber-500/10 border-amber-500/30': alert.severity === 'warning',
      })}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn('p-2 rounded-lg', {
            'bg-red-500/20 text-red-600': alert.severity === 'critical',
            'bg-amber-500/20 text-amber-600': alert.severity === 'warning',
          })}
        >
          {alert.severity === 'critical' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{alert.title}</span>
            <Badge
              variant="outline"
              className={cn('text-xs', {
                'border-red-500 text-red-600': alert.severity === 'critical',
                'border-amber-500 text-amber-600': alert.severity === 'warning',
              })}
            >
              {alert.percentage.toFixed(0)}% (threshold: {alert.threshold}%)
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
          {alert.affectedItems.length > 3 && (
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto mt-1"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show less' : `Show all ${alert.affectedItems.length} items`}
            </Button>
          )}
          {expanded && (
            <div className="mt-2 flex flex-wrap gap-1">
              {alert.affectedItems.map((item) => (
                <Badge key={item} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
