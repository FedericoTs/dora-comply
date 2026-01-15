'use client';

import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, FileText, Info, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { calculateClassification } from '@/lib/incidents/validation';
import { ThresholdList, ClassificationBadge } from './threshold-indicator';
import type { ImpactData, IncidentClassification } from '@/lib/incidents/types';

interface ClassificationCalculatorProps {
  impactData: ImpactData;
  detectionDateTime?: string;
  selectedClassification: IncidentClassification;
  isOverride: boolean;
  overrideJustification: string;
  onClassificationChange: (classification: IncidentClassification) => void;
  onOverrideChange: (isOverride: boolean) => void;
  onJustificationChange: (justification: string) => void;
  errors?: Record<string, string[]>;
}

/**
 * Classification Calculator Component
 *
 * Displays auto-calculated DORA classification based on impact data
 * with option to override with justification
 */
export function ClassificationCalculator({
  impactData,
  detectionDateTime,
  selectedClassification,
  isOverride,
  overrideJustification,
  onClassificationChange,
  onOverrideChange,
  onJustificationChange,
  errors = {},
}: ClassificationCalculatorProps) {
  const result = useMemo(
    () => calculateClassification(impactData, detectionDateTime),
    [impactData, detectionDateTime]
  );

  const hasTriggeredThresholds = result.triggeredThresholds.length > 0;
  const classificationMismatch = isOverride && selectedClassification !== result.calculated;

  return (
    <div className="space-y-6">
      {/* Calculated Classification Display */}
      <Card className={cn(
        'border-2',
        result.calculated === 'major' && 'border-destructive/50 bg-destructive/5',
        result.calculated === 'significant' && 'border-warning/50 bg-warning/5',
        result.calculated === 'minor' && 'border-border'
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                DORA Classification Assessment
              </CardTitle>
              <CardDescription>
                Based on your impact data, this incident qualifies as:
              </CardDescription>
            </div>
            <ClassificationBadge classification={result.calculated} size="lg" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Triggered Thresholds */}
          {hasTriggeredThresholds && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
                <CheckCircle2 className="h-4 w-4" />
                Triggered Thresholds
              </h4>
              <ThresholdList thresholds={result.triggeredThresholds} compact />
            </div>
          )}

          {/* Not Triggered Thresholds (collapsed by default) */}
          {result.notTriggeredThresholds.length > 0 && (
            <details className="group">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <span className="ml-1">
                  {result.notTriggeredThresholds.length} thresholds not triggered
                </span>
              </summary>
              <div className="mt-2 pl-4 border-l-2 border-muted">
                <ThresholdList thresholds={result.notTriggeredThresholds} compact />
              </div>
            </details>
          )}

          {/* No thresholds triggered */}
          {!hasTriggeredThresholds && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Minor Classification</AlertTitle>
              <AlertDescription>
                No DORA thresholds were triggered based on the impact data provided.
                This incident is classified as Minor and does not require regulatory reporting.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Reporting Requirements */}
      {result.requiresReporting && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              DORA Reporting Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {result.calculated === 'major' && (
                <DeadlineCard
                  title="Initial Report"
                  deadline={result.deadlines?.initial ?? null}
                  hours={4}
                  urgent
                />
              )}
              <DeadlineCard
                title="Intermediate Report"
                deadline={result.deadlines?.intermediate ?? null}
                hours={72}
              />
              <DeadlineCard
                title="Final Report"
                deadline={null}
                description="Within 1 month of resolution"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Override Option */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Classification Override</CardTitle>
          <CardDescription>
            Override the calculated classification if you believe the automated assessment
            is incorrect. A justification is required for audit purposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="override"
              checked={isOverride}
              onCheckedChange={(checked) => {
                onOverrideChange(checked === true);
                if (!checked) {
                  onClassificationChange(result.calculated);
                }
              }}
            />
            <div className="space-y-1">
              <Label
                htmlFor="override"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                I need to override this classification
              </Label>
              <p className="text-xs text-muted-foreground">
                Select this if the automated classification does not reflect the true severity
              </p>
            </div>
          </div>

          {isOverride && (
            <div className="space-y-4 pl-6 border-l-2 border-muted">
              {/* Classification Selection */}
              <div className="space-y-2">
                <Label>Select Classification</Label>
                <RadioGroup
                  value={selectedClassification}
                  onValueChange={(value) => onClassificationChange(value as IncidentClassification)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="major" id="class-major" />
                    <Label htmlFor="class-major" className="cursor-pointer">
                      <Badge variant="destructive">Major</Badge>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="significant" id="class-significant" />
                    <Label htmlFor="class-significant" className="cursor-pointer">
                      <Badge className="bg-warning text-warning-foreground hover:bg-warning/80">
                        Significant
                      </Badge>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minor" id="class-minor" />
                    <Label htmlFor="class-minor" className="cursor-pointer">
                      <Badge variant="secondary">Minor</Badge>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Justification */}
              <div className="space-y-2">
                <Label htmlFor="justification">
                  Justification <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="justification"
                  value={overrideJustification}
                  onChange={(e) => onJustificationChange(e.target.value)}
                  placeholder="Explain why you are overriding the calculated classification (minimum 50 characters)..."
                  rows={3}
                  className={cn(
                    errors.classification_override_justification && 'border-destructive'
                  )}
                />
                <div className="flex justify-between text-xs">
                  <span className={cn(
                    'text-muted-foreground',
                    overrideJustification.length < 50 && 'text-destructive'
                  )}>
                    {overrideJustification.length}/50 characters minimum
                  </span>
                  {errors.classification_override_justification && (
                    <span className="text-destructive">
                      {errors.classification_override_justification[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Warning about classification change */}
              {classificationMismatch && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Classification Override</AlertTitle>
                  <AlertDescription>
                    You are overriding the calculated classification from{' '}
                    <strong className="capitalize">{result.calculated}</strong> to{' '}
                    <strong className="capitalize">{selectedClassification}</strong>.
                    {selectedClassification === 'minor' && result.calculated !== 'minor' && (
                      <span className="block mt-1">
                        This will remove regulatory reporting requirements. Ensure this is
                        justified and documented.
                      </span>
                    )}
                    {selectedClassification === 'major' && result.calculated === 'minor' && (
                      <span className="block mt-1">
                        This will activate regulatory reporting requirements with strict deadlines.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface DeadlineCardProps {
  title: string;
  deadline: Date | null;
  hours?: number;
  description?: string;
  urgent?: boolean;
}

function DeadlineCard({ title, deadline, hours, description, urgent }: DeadlineCardProps) {
  const formatDeadline = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff < 0) {
      return { text: 'Overdue', urgent: true };
    }

    if (hoursRemaining < 1) {
      return { text: `${minutesRemaining}m remaining`, urgent: true };
    }

    if (hoursRemaining < 4) {
      return { text: `${hoursRemaining}h ${minutesRemaining}m remaining`, urgent: true };
    }

    return {
      text: date.toLocaleDateString('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      urgent: false,
    };
  };

  const deadlineInfo = deadline ? formatDeadline(deadline) : null;

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        urgent && 'border-destructive/50 bg-destructive/5'
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className={cn('h-4 w-4', urgent && 'text-destructive')} />
        {title}
      </div>
      {deadline ? (
        <p
          className={cn(
            'text-sm mt-1',
            deadlineInfo?.urgent ? 'text-destructive font-medium' : 'text-muted-foreground'
          )}
        >
          {deadlineInfo?.text}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground mt-1">
          {description || `Within ${hours} hours`}
        </p>
      )}
    </div>
  );
}

/**
 * Compact classification preview for showing in other steps
 */
interface ClassificationPreviewProps {
  impactData: ImpactData;
  className?: string;
}

export function ClassificationPreview({ impactData, className }: ClassificationPreviewProps) {
  const result = useMemo(() => calculateClassification(impactData), [impactData]);
  const triggeredCount = result.triggeredThresholds.length;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <ClassificationBadge classification={result.calculated} size="sm" />
      {triggeredCount > 0 && (
        <span className="text-xs text-muted-foreground">
          {triggeredCount} threshold{triggeredCount !== 1 ? 's' : ''} triggered
        </span>
      )}
    </div>
  );
}
