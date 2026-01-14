'use client';

import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle } from 'lucide-react';
import type { ConcentrationThresholds } from './types';

interface ThresholdSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thresholds: ConcentrationThresholds;
  onSave: (thresholds: ConcentrationThresholds) => Promise<void>;
  saving: boolean;
}

export function ThresholdSettingsDialog({
  open,
  onOpenChange,
  thresholds,
  onSave,
  saving,
}: ThresholdSettingsDialogProps) {
  const [editThresholds, setEditThresholds] = useState(thresholds);

  // Sync with prop changes
  useEffect(() => {
    setEditThresholds(thresholds);
  }, [thresholds]);

  const handleSave = async () => {
    await onSave(editThresholds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Thresholds'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
