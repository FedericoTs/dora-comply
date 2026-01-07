'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { enableMonitoring, disableMonitoring, updateMonitoringConfig } from '@/lib/vendors/monitoring-actions';
import { isValidDomain, generateMockScorecard } from '@/lib/external/securityscorecard';
import { gradeToColor, gradeToLabel, type SSCGrade } from '@/lib/external/securityscorecard-types';

interface MonitoringSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  vendorName: string;
  currentDomain?: string | null;
  currentEnabled?: boolean;
  currentThreshold?: number | null;
  onSuccess?: () => void;
}

interface PreviewScore {
  score: number;
  grade: SSCGrade;
  mock: boolean;
}

export function MonitoringSetupDialog({
  open,
  onOpenChange,
  vendorId,
  vendorName,
  currentDomain,
  currentEnabled = false,
  currentThreshold = 70,
  onSuccess,
}: MonitoringSetupDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [domain, setDomain] = useState(currentDomain || '');
  const [threshold, setThreshold] = useState(currentThreshold || 70);
  const [enabled, setEnabled] = useState(currentEnabled);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewScore | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleDomainLookup = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }

    if (!isValidDomain(domain)) {
      setError('Invalid domain format. Example: example.com');
      return;
    }

    setIsLookingUp(true);
    setError(null);

    try {
      const response = await fetch(`/api/monitoring/lookup?domain=${encodeURIComponent(domain)}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error?.message || 'Domain not found');
        setPreview(null);
        return;
      }

      setPreview({
        score: data.data.scorecard.score,
        grade: data.data.scorecard.grade,
        mock: data.mock,
      });
    } catch (err) {
      setError('Failed to lookup domain');
      setPreview(null);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = () => {
    setError(null);

    startTransition(async () => {
      try {
        if (enabled) {
          if (!domain.trim()) {
            setError('Domain is required when enabling monitoring');
            return;
          }

          const result = await enableMonitoring(vendorId, domain, threshold);
          if (!result.success) {
            setError(result.error || 'Failed to enable monitoring');
            return;
          }
        } else if (currentEnabled && !enabled) {
          const result = await disableMonitoring(vendorId);
          if (!result.success) {
            setError(result.error || 'Failed to disable monitoring');
            return;
          }
        } else if (currentEnabled && enabled) {
          const result = await updateMonitoringConfig(vendorId, {
            domain,
            alertThreshold: threshold,
          });
          if (!result.success) {
            setError(result.error || 'Failed to update configuration');
            return;
          }
        }

        onSuccess?.();
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            External Risk Monitoring
          </DialogTitle>
          <DialogDescription>
            Configure continuous security monitoring for {vendorName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="monitoring-enabled" className="text-sm font-medium">
                Enable Monitoring
              </Label>
              <p className="text-xs text-muted-foreground">
                Track external security score via SecurityScorecard
              </p>
            </div>
            <Switch
              id="monitoring-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {/* Domain Input */}
          {enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="domain">Vendor Domain</Label>
                <div className="flex gap-2">
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => {
                      setDomain(e.target.value);
                      setPreview(null);
                      setError(null);
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleDomainLookup}
                    disabled={isLookingUp || !domain.trim()}
                  >
                    {isLookingUp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the vendor&apos;s primary domain (without www)
                </p>
              </div>

              {/* Preview Score */}
              {preview && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Score Found</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xl font-bold"
                        style={{ color: gradeToColor(preview.grade) }}
                      >
                        {preview.grade}
                      </span>
                      <span className="text-lg font-semibold">{preview.score}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {gradeToLabel(preview.grade)}
                    {preview.mock && (
                      <Badge variant="outline" className="ml-2 text-xs">Mock Data</Badge>
                    )}
                  </p>
                </div>
              )}

              {/* Alert Threshold */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Alert Threshold</Label>
                  <span className="text-sm font-medium">{threshold}</span>
                </div>
                <Slider
                  value={[threshold]}
                  onValueChange={([value]) => setThreshold(value)}
                  min={0}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Alert when score drops below {threshold}
                </p>
              </div>
            </>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
            <p className="font-medium mb-1">About SecurityScorecard</p>
            <p>
              SecurityScorecard provides external cyber risk ratings (A-F) based on
              publicly observable security signals across 10 risk factors.
            </p>
            <a
              href="https://securityscorecard.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline mt-1"
            >
              Learn more <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : enabled ? (
              'Enable Monitoring'
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
