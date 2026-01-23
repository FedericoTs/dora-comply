'use client';

/**
 * Monitoring Alerts Dashboard
 *
 * Centralized view for all vendor security monitoring alerts
 * with filtering, acknowledgment, and resolution capabilities.
 */

import { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Building2,
  TrendingDown,
  Shield,
  Bell,
  Loader2,
  Eye,
  CheckCheck,
  X,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  getActiveAlerts,
  acknowledgeAlert,
  dismissAlert,
  resolveAlert,
} from '@/lib/vendors/monitoring-actions';

// =============================================================================
// Types
// =============================================================================

interface MonitoringAlert {
  id: string;
  vendor_id: string;
  alert_type: string;
  severity: string;
  previous_score: number | null;
  current_score: number | null;
  previous_grade: string | null;
  current_grade: string | null;
  score_change: number | null;
  title: string;
  message: string | null;
  status: string;
  created_at: string;
}

type FilterSeverity = 'all' | 'critical' | 'high' | 'medium' | 'low';
type FilterType = 'all' | 'score_drop' | 'grade_change' | 'threshold_breach';
type FilterStatus = 'active' | 'acknowledged' | 'all';

// =============================================================================
// Configuration
// =============================================================================

const SEVERITY_CONFIG: Record<string, { icon: typeof AlertTriangle; color: string; bg: string; border: string }> = {
  critical: {
    icon: AlertCircle,
    color: 'text-error',
    bg: 'bg-error/10',
    border: 'border-error/30',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
  },
  medium: {
    icon: AlertCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  low: {
    icon: Bell,
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/30',
  },
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  score_drop: 'Score Drop',
  grade_change: 'Grade Change',
  threshold_breach: 'Threshold Breach',
};

// =============================================================================
// Component
// =============================================================================

export default function MonitoringAlertsPage() {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [severityFilter, setSeverityFilter] = useState<FilterSeverity>('all');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('active');

  // Load alerts
  const loadAlerts = useCallback(async () => {
    try {
      const result = await getActiveAlerts();
      if (result.success && result.data) {
        setAlerts(result.data);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
      toast.error('Failed to load monitoring alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    loadAlerts();
  };

  // Handle acknowledge
  const handleAcknowledge = (alertId: string) => {
    startTransition(async () => {
      const result = await acknowledgeAlert(alertId);
      if (result.success) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, status: 'acknowledged' } : a))
        );
        toast.success('Alert acknowledged');
      } else {
        toast.error(result.error || 'Failed to acknowledge alert');
      }
    });
  };

  // Handle dismiss
  const handleDismiss = (alertId: string) => {
    startTransition(async () => {
      const result = await dismissAlert(alertId);
      if (result.success) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        toast.success('Alert dismissed');
      } else {
        toast.error(result.error || 'Failed to dismiss alert');
      }
    });
  };

  // Handle resolve
  const handleResolve = (alertId: string) => {
    startTransition(async () => {
      const result = await resolveAlert(alertId);
      if (result.success) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        toast.success('Alert resolved');
      } else {
        toast.error(result.error || 'Failed to resolve alert');
      }
    });
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && alert.alert_type !== typeFilter) return false;
    if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
    return true;
  });

  // Stats
  const stats = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monitoring Alerts</h1>
          <p className="text-muted-foreground">
            Security monitoring alerts from continuous vendor surveillance
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-error/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-error" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.critical}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.high}</p>
                <p className="text-xs text-muted-foreground">High Severity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.acknowledged}</p>
                <p className="text-xs text-muted-foreground">Acknowledged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as FilterSeverity)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as FilterType)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Alert Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="score_drop">Score Drop</SelectItem>
                <SelectItem value="grade_change">Grade Change</SelectItem>
                <SelectItem value="threshold_breach">Threshold Breach</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="all">All Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alert List */}
      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No Alerts Found</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {alerts.length === 0
                  ? 'No monitoring alerts at this time. Enable monitoring on vendors to receive security alerts.'
                  : 'No alerts match your current filters. Try adjusting the filter criteria.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const severityConfig = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
            const SeverityIcon = severityConfig.icon;

            return (
              <Card
                key={alert.id}
                className={cn(
                  'transition-all duration-200',
                  alert.status === 'acknowledged' && 'opacity-70',
                  severityConfig.border
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Severity Icon */}
                    <div className={cn('p-2 rounded-lg shrink-0', severityConfig.bg)}>
                      <SeverityIcon className={cn('h-5 w-5', severityConfig.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium">{alert.title}</h4>
                          {alert.message && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {alert.message}
                            </p>
                          )}
                        </div>

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isPending}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/vendors/${alert.vendor_id}?tab=monitoring`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Vendor
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {alert.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleAcknowledge(alert.id)}>
                                <CheckCheck className="h-4 w-4 mr-2" />
                                Acknowledge
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleResolve(alert.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark Resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDismiss(alert.id)}
                              className="text-muted-foreground"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Dismiss
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="outline" className={cn(severityConfig.color)}>
                          {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                        </Badge>
                        <Badge variant="secondary">
                          {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                        </Badge>
                        {alert.status === 'acknowledged' && (
                          <Badge variant="outline" className="text-info border-info/30">
                            Acknowledged
                          </Badge>
                        )}

                        {/* Score Change */}
                        {alert.score_change !== null && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <TrendingDown className="h-3 w-3" />
                            {alert.previous_score} → {alert.current_score}
                            <span className="text-error">({alert.score_change})</span>
                          </span>
                        )}

                        {/* Grade Change */}
                        {alert.previous_grade && alert.current_grade && (
                          <span className="text-muted-foreground">
                            Grade: {alert.previous_grade} → {alert.current_grade}
                          </span>
                        )}

                        {/* Timestamp */}
                        <span className="text-muted-foreground flex items-center gap-1 ml-auto">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
