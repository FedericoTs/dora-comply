'use client';

import { useState } from 'react';
import { Settings, Bell, Clock, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { updateSnapshotSettings } from '@/lib/compliance/maturity-history';
import type { MaturitySnapshotSettings } from '@/lib/compliance/maturity-history-types';

interface SnapshotSettingsDialogProps {
  settings: MaturitySnapshotSettings | null;
  onClose: () => void;
  onSaved: () => void;
}

type SnapshotFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

const FREQUENCY_OPTIONS: { value: SnapshotFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const DAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const RETENTION_OPTIONS = [
  { value: 6, label: '6 months' },
  { value: 12, label: '1 year' },
  { value: 24, label: '2 years' },
  { value: 36, label: '3 years' },
  { value: 60, label: '5 years' },
];

export function SnapshotSettingsDialog({
  settings,
  onClose,
  onSaved,
}: SnapshotSettingsDialogProps) {
  const [saving, setSaving] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(settings?.auto_snapshot_enabled ?? true);
  const [frequency, setFrequency] = useState<SnapshotFrequency>(
    (settings?.snapshot_frequency as SnapshotFrequency) ?? 'weekly'
  );
  const [dayOfWeek, setDayOfWeek] = useState(settings?.snapshot_day_of_week ?? 1);
  const [dayOfMonth, setDayOfMonth] = useState(settings?.snapshot_day_of_month ?? 1);
  const [notifyImprovement, setNotifyImprovement] = useState(
    settings?.notify_on_improvement ?? true
  );
  const [notifyRegression, setNotifyRegression] = useState(
    settings?.notify_on_regression ?? true
  );
  const [thresholdChange, setThresholdChange] = useState(
    settings?.notify_threshold_change ?? 1
  );
  const [retention, setRetention] = useState(settings?.retention_months ?? 24);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateSnapshotSettings({
        auto_snapshot_enabled: autoEnabled,
        snapshot_frequency: frequency,
        snapshot_day_of_week: frequency === 'weekly' ? dayOfWeek : null,
        snapshot_day_of_month: frequency === 'monthly' ? dayOfMonth : null,
        notify_on_improvement: notifyImprovement,
        notify_on_regression: notifyRegression,
        notify_threshold_change: thresholdChange,
        retention_months: retention,
      });

      if (result.success) {
        toast.success('Settings saved');
        onSaved();
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Snapshot Settings
          </DialogTitle>
          <DialogDescription>
            Configure automatic snapshots and notifications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Auto Snapshot Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="auto-snapshot">Automatic Snapshots</Label>
              </div>
              <Switch
                id="auto-snapshot"
                checked={autoEnabled}
                onCheckedChange={setAutoEnabled}
              />
            </div>

            {autoEnabled && (
              <div className="ml-6 space-y-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={frequency} onValueChange={(v) => setFrequency(v as SnapshotFrequency)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {frequency === 'weekly' && (
                  <div className="space-y-2">
                    <Label>Day of Week</Label>
                    <Select
                      value={dayOfWeek.toString()}
                      onValueChange={(v) => setDayOfWeek(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {frequency === 'monthly' && (
                  <div className="space-y-2">
                    <Label>Day of Month</Label>
                    <Select
                      value={dayOfMonth.toString()}
                      onValueChange={(v) => setDayOfMonth(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Notifications Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bell className="h-4 w-4 text-muted-foreground" />
              Notifications
            </div>

            <div className="ml-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-improvement" className="text-sm font-normal">
                  Notify on improvement
                </Label>
                <Switch
                  id="notify-improvement"
                  checked={notifyImprovement}
                  onCheckedChange={setNotifyImprovement}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notify-regression" className="text-sm font-normal">
                  Notify on regression
                </Label>
                <Switch
                  id="notify-regression"
                  checked={notifyRegression}
                  onCheckedChange={setNotifyRegression}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-normal">
                  Notification threshold (level change)
                </Label>
                <Select
                  value={thresholdChange.toString()}
                  onValueChange={(v) => setThresholdChange(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Any change (1+ level)</SelectItem>
                    <SelectItem value="2">Significant (2+ levels)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Retention Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Archive className="h-4 w-4 text-muted-foreground" />
              Data Retention
            </div>

            <div className="ml-6 space-y-2">
              <Label className="text-sm font-normal">Keep snapshots for</Label>
              <Select
                value={retention.toString()}
                onValueChange={(v) => setRetention(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETENTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Older snapshots will be automatically archived
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
