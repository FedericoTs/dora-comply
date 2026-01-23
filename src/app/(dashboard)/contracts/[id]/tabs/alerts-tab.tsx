/**
 * Contract Alerts Tab
 * Displays contract alerts with management actions
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Bell,
  Check,
  Clock,
  Calendar,
  MoreHorizontal,
  Eye,
  BellOff,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { ContractDetail } from '@/lib/contracts/queries';
import type { ContractAlert } from '@/lib/contracts/types';
import {
  ALERT_TYPE_INFO,
  ALERT_PRIORITY_INFO,
  ALERT_STATUS_INFO,
} from '@/lib/contracts/types';
import {
  acknowledgeAlert,
  resolveAlert,
  dismissAlert,
  snoozeAlert,
} from '@/lib/contracts/actions';

interface ContractAlertsTabProps {
  contract: ContractDetail;
}

export function ContractAlertsTab({ contract }: ContractAlertsTabProps) {
  const router = useRouter();
  const alerts = contract.alerts || [];

  const handleRefresh = () => {
    router.refresh();
  };

  // Group alerts by status
  const activeAlerts = alerts.filter(
    (a) => a.status === 'triggered' || a.status === 'acknowledged'
  );
  const scheduledAlerts = alerts.filter((a) => a.status === 'scheduled');
  const resolvedAlerts = alerts.filter(
    (a) => a.status === 'resolved' || a.status === 'dismissed'
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-error" />
              <div>
                <p className="text-2xl font-semibold">{activeAlerts.length}</p>
                <p className="text-xs text-muted-foreground">Active Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-semibold">{scheduledAlerts.length}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-success" />
              <div>
                <p className="text-2xl font-semibold">{resolvedAlerts.length}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-semibold">{alerts.length}</p>
                <p className="text-xs text-muted-foreground">Total Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-error">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <AlertRow key={alert.id} alert={alert} onRefresh={handleRefresh} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Alerts */}
      {scheduledAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Scheduled Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledAlerts.map((alert) => (
                <AlertRow key={alert.id} alert={alert} onRefresh={handleRefresh} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <Check className="h-5 w-5" />
              Resolved Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resolvedAlerts.slice(0, 5).map((alert) => (
                <AlertRow key={alert.id} alert={alert} onRefresh={handleRefresh} />
              ))}
              {resolvedAlerts.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  + {resolvedAlerts.length - 5} more resolved alerts
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {alerts.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Alerts</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Contract alerts will appear here when triggered
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface AlertRowProps {
  alert: ContractAlert;
  onRefresh: () => void;
}

function AlertRow({ alert, onRefresh }: AlertRowProps) {
  const [isPending, startTransition] = useTransition();
  const [showSnoozeDialog, setShowSnoozeDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [snoozeDays, setSnoozeDays] = useState('7');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleAcknowledge = () => {
    startTransition(async () => {
      const result = await acknowledgeAlert(alert.id);
      if (result.success) {
        toast.success('Alert acknowledged');
        onRefresh();
      } else {
        toast.error(result.error?.message || 'Failed to acknowledge alert');
      }
    });
  };

  const handleSnooze = () => {
    startTransition(async () => {
      const result = await snoozeAlert(alert.id, parseInt(snoozeDays));
      if (result.success) {
        toast.success(`Alert snoozed for ${snoozeDays} days`);
        setShowSnoozeDialog(false);
        onRefresh();
      } else {
        toast.error(result.error?.message || 'Failed to snooze alert');
      }
    });
  };

  const handleResolve = () => {
    startTransition(async () => {
      const result = await resolveAlert(alert.id, resolutionNotes || undefined);
      if (result.success) {
        toast.success('Alert resolved');
        setShowResolveDialog(false);
        setResolutionNotes('');
        onRefresh();
      } else {
        toast.error(result.error?.message || 'Failed to resolve alert');
      }
    });
  };

  const handleDismiss = () => {
    startTransition(async () => {
      const result = await dismissAlert(alert.id);
      if (result.success) {
        toast.success('Alert dismissed');
        onRefresh();
      } else {
        toast.error(result.error?.message || 'Failed to dismiss alert');
      }
    });
  };

  return (
    <>
      <div className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
        <div className="flex items-start gap-3">
          {/* Priority Indicator */}
          <span
            className={`mt-1 h-3 w-3 rounded-full shrink-0 ${
              alert.priority === 'critical'
                ? 'bg-error'
                : alert.priority === 'high'
                ? 'bg-orange-500'
                : alert.priority === 'medium'
                ? 'bg-warning'
                : 'bg-blue-500'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{alert.title}</span>
              <Badge variant="outline" className={ALERT_STATUS_INFO[alert.status]?.color || ''}>
                {ALERT_STATUS_INFO[alert.status]?.label}
              </Badge>
              {alert.snoozed_until && new Date(alert.snoozed_until) > new Date() && (
                <Badge variant="outline" className="bg-muted">
                  Snoozed until {new Date(alert.snoozed_until).toLocaleDateString()}
                </Badge>
              )}
            </div>
            {alert.description && (
              <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {alert.status === 'scheduled'
                  ? `Triggers: ${new Date(alert.trigger_date).toLocaleDateString()}`
                  : alert.triggered_at
                  ? `Triggered: ${new Date(alert.triggered_at).toLocaleDateString()}`
                  : new Date(alert.trigger_date).toLocaleDateString()}
              </span>
              <Badge variant="outline" className={ALERT_PRIORITY_INFO[alert.priority]?.color}>
                {ALERT_PRIORITY_INFO[alert.priority]?.label}
              </Badge>
              <span>{ALERT_TYPE_INFO[alert.alert_type]?.label}</span>
            </div>
            {alert.resolution_notes && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                Resolution: {alert.resolution_notes}
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {alert.status === 'triggered' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAcknowledge}>
                  <Check className="h-4 w-4 mr-2" />
                  Acknowledge
                </DropdownMenuItem>
              </>
            )}
            {(alert.status === 'triggered' || alert.status === 'acknowledged') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowSnoozeDialog(true)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Snooze
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowResolveDialog(true)}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark Resolved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDismiss} className="text-muted-foreground">
                  <BellOff className="h-4 w-4 mr-2" />
                  Dismiss
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Snooze Dialog */}
      <Dialog open={showSnoozeDialog} onOpenChange={setShowSnoozeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Snooze Alert</DialogTitle>
            <DialogDescription>
              Select how long to snooze this alert. You'll be reminded again after the snooze period.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="snooze-days">Snooze Duration</Label>
            <Select value={snoozeDays} onValueChange={setSnoozeDays}>
              <SelectTrigger id="snooze-days" className="mt-2">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">1 week</SelectItem>
                <SelectItem value="14">2 weeks</SelectItem>
                <SelectItem value="30">1 month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSnoozeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSnooze} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Snooze Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Mark this alert as resolved. Optionally add notes about how it was addressed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="resolution-notes">Resolution Notes (optional)</Label>
            <Textarea
              id="resolution-notes"
              placeholder="Describe how this alert was addressed..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
