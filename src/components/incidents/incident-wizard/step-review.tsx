'use client';

import {
  AlertTriangle,
  Shield,
  Info,
  Calendar,
  Edit,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { WizardData } from './index';
import {
  getClassificationLabel,
  getIncidentTypeLabel,
  calculateDeadline,
} from '@/lib/incidents/types';

interface StepReviewProps {
  data: WizardData;
  goToStep: (step: number) => void;
}

function SectionHeader({
  title,
  step,
  onEdit,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-medium">{title}</h3>
      <Button variant="ghost" size="sm" onClick={() => onEdit(step)}>
        <Edit className="h-3 w-3 mr-1" />
        Edit
      </Button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export function StepReview({ data, goToStep }: StepReviewProps) {
  const detectionDate = new Date(data.detection_datetime);
  const classificationIcon =
    data.classification === 'major' ? AlertTriangle :
    data.classification === 'significant' ? Shield : Info;
  const ClassificationIcon = classificationIcon;

  const deadlines = {
    initial: calculateDeadline(detectionDate, 'initial'),
    intermediate: calculateDeadline(detectionDate, 'intermediate'),
    final: calculateDeadline(detectionDate, 'final'),
  };

  const requiresReporting = data.classification === 'major' || data.classification === 'significant';
  const isOverride = data.classification_override === true;
  const classificationMismatch = isOverride && data.classification !== data.classification_calculated;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
            data.classification === 'major'
              ? 'bg-red-100 text-red-600'
              : data.classification === 'significant'
              ? 'bg-amber-100 text-amber-600'
              : 'bg-slate-100 text-slate-600'
          )}
        >
          <ClassificationIcon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">{data.title || 'Untitled Incident'}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge
              variant="outline"
              className={cn(
                data.classification === 'major'
                  ? 'border-red-500 text-red-700'
                  : data.classification === 'significant'
                  ? 'border-amber-500 text-amber-700'
                  : 'border-slate-400 text-slate-700'
              )}
            >
              {getClassificationLabel(data.classification)}
              {isOverride && ' (Override)'}
            </Badge>
            <Badge variant="outline">{getIncidentTypeLabel(data.incident_type)}</Badge>
            {data.data_breach && (
              <Badge variant="destructive">Data Breach</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Override Warning */}
      {classificationMismatch && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Classification has been overridden from{' '}
            <strong className="capitalize">{data.classification_calculated}</strong> to{' '}
            <strong className="capitalize">{data.classification}</strong>.
            {data.classification_override_justification && (
              <span className="block mt-1 text-xs">
                Justification: {data.classification_override_justification}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Step 0: Incident Details */}
      <div className="space-y-3">
        <SectionHeader title="Incident Details" step={0} onEdit={goToStep} />
        <div className="rounded-lg border p-4 space-y-1">
          <InfoRow label="Title" value={data.title} />
          <InfoRow
            label="Incident Type"
            value={getIncidentTypeLabel(data.incident_type)}
          />
          <InfoRow
            label="Detection Time"
            value={detectionDate.toLocaleString('en-GB')}
          />
          {data.occurrence_datetime && (
            <InfoRow
              label="Occurrence Time"
              value={new Date(data.occurrence_datetime).toLocaleString('en-GB')}
            />
          )}
          <InfoRow label="Related Vendor" value={data.vendor_id ? 'Selected' : 'None'} />
          {data.description && (
            <div className="pt-2 border-t mt-2">
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{data.description}</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Step 1: Impact & Classification */}
      <div className="space-y-3">
        <SectionHeader title="Impact & Classification" step={1} onEdit={goToStep} />
        <div className="rounded-lg border p-4 space-y-2">
          {/* Classification Summary */}
          <div className="flex items-center justify-between pb-2 border-b">
            <span className="text-sm font-medium">DORA Classification</span>
            <Badge
              className={cn(
                data.classification === 'major'
                  ? 'bg-destructive'
                  : data.classification === 'significant'
                  ? 'bg-warning text-warning-foreground'
                  : 'bg-secondary'
              )}
            >
              {getClassificationLabel(data.classification)}
              {isOverride && ' (Override)'}
            </Badge>
          </div>

          {/* Impact Details */}
          {data.critical_functions_affected.length > 0 && (
            <InfoRow
              label="Critical Functions"
              value={`${data.critical_functions_affected.length} function(s)`}
            />
          )}
          <InfoRow
            label="Clients Affected"
            value={
              data.clients_affected_percentage !== undefined && data.clients_affected_percentage > 0
                ? `${data.clients_affected_percentage}%`
                : undefined
            }
          />
          <InfoRow
            label="Transaction Value"
            value={
              data.transactions_value_affected
                ? `EUR ${data.transactions_value_affected.toLocaleString()}`
                : undefined
            }
          />
          <InfoRow
            label="Data Breach"
            value={
              data.data_breach
                ? `Yes - ${data.data_records_affected?.toLocaleString() ?? 'unknown'} records`
                : 'No'
            }
          />
          {data.geographic_spread.length > 0 && (
            <InfoRow
              label="Geographic Spread"
              value={data.geographic_spread.join(', ')}
            />
          )}

          {isOverride && data.classification_override_justification && (
            <div className="pt-2 border-t mt-2">
              <p className="text-sm text-muted-foreground mb-1">Override Justification</p>
              <p className="text-sm text-xs">{data.classification_override_justification}</p>
            </div>
          )}
        </div>

        {/* DORA Reporting Deadlines */}
        {requiresReporting && (
          <div className="space-y-2 mt-3">
            <h4 className="text-sm font-medium text-muted-foreground">DORA Reporting Deadlines</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              {data.classification === 'major' && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Initial Report</p>
                  <p className="text-sm font-mono font-medium mt-1">
                    {deadlines.initial.toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs text-destructive mt-1">Within 4 hours</p>
                </div>
              )}
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Intermediate Report</p>
                <p className="text-sm font-mono font-medium mt-1">
                  {deadlines.intermediate.toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Within 72 hours</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Final Report</p>
                <p className="text-sm font-mono font-medium mt-1">
                  {deadlines.final.toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Within 1 month</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation */}
      <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-4">
        <div className="flex items-start gap-3">
          <Check className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 dark:text-green-300">
              Ready to Create Incident
            </h4>
            <p className="text-sm text-green-800 dark:text-green-400 mt-1">
              Review the information above and click &quot;Create Incident&quot; to save.
              {requiresReporting && (
                <span className="block mt-1">
                  <strong>Note:</strong> This incident requires DORA regulatory reporting.
                  You&apos;ll be able to generate and submit reports after creation.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
