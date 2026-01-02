'use client';

import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { WizardData } from './index';
import { calculateDeadline, getReportDeadlineHours } from '@/lib/incidents/types';

interface StepTimelineProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  errors: Record<string, string[]>;
}

export function StepTimeline({ data, updateData, errors }: StepTimelineProps) {
  const detectionDate = data.detection_datetime ? new Date(data.detection_datetime) : null;

  const deadlines = detectionDate ? {
    initial: calculateDeadline(detectionDate, 'initial'),
    intermediate: calculateDeadline(detectionDate, 'intermediate'),
    final: calculateDeadline(detectionDate, 'final'),
  } : null;

  const formatDeadline = (date: Date) => {
    return date.toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isDeadlinePassed = (deadline: Date) => deadline < new Date();

  return (
    <div className="space-y-8">
      {/* Detection DateTime */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="detection_datetime" className="text-base font-medium">
            Detection Date & Time *
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            When was the incident first detected? This triggers regulatory deadlines.
          </p>
        </div>
        <div className="relative max-w-md">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="detection_datetime"
            type="datetime-local"
            className={cn('pl-10', errors.detection_datetime && 'border-destructive')}
            value={data.detection_datetime}
            onChange={(e) => updateData({ detection_datetime: e.target.value })}
          />
        </div>
        {errors.detection_datetime && (
          <p className="text-sm text-destructive">{errors.detection_datetime[0]}</p>
        )}
      </div>

      {/* Occurrence DateTime */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="occurrence_datetime" className="text-base font-medium">
            Occurrence Date & Time
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            When did the incident actually occur? (if different from detection)
          </p>
        </div>
        <div className="relative max-w-md">
          <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="occurrence_datetime"
            type="datetime-local"
            className="pl-10"
            value={data.occurrence_datetime || ''}
            max={data.detection_datetime}
            onChange={(e) => updateData({ occurrence_datetime: e.target.value || undefined })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Leave blank if the incident was detected immediately when it occurred.
        </p>
      </div>

      {/* Deadline Preview */}
      {deadlines && data.classification === 'major' && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <h4 className="font-medium">Regulatory Reporting Deadlines</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Based on the detection time, here are your DORA Article 19 deadlines:
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div
              className={cn(
                'rounded-lg border p-3',
                isDeadlinePassed(deadlines.initial)
                  ? 'border-destructive bg-destructive/10'
                  : 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
              )}
            >
              <p className="text-xs font-medium text-muted-foreground">Initial Report</p>
              <p className="font-mono text-sm mt-1">
                {getReportDeadlineHours('initial')} hours
              </p>
              <p className="text-xs mt-2">
                {isDeadlinePassed(deadlines.initial) ? (
                  <span className="text-destructive font-medium">OVERDUE</span>
                ) : (
                  formatDeadline(deadlines.initial)
                )}
              </p>
            </div>
            <div
              className={cn(
                'rounded-lg border p-3',
                isDeadlinePassed(deadlines.intermediate)
                  ? 'border-destructive bg-destructive/10'
                  : 'bg-background'
              )}
            >
              <p className="text-xs font-medium text-muted-foreground">Intermediate Report</p>
              <p className="font-mono text-sm mt-1">
                {getReportDeadlineHours('intermediate')} hours
              </p>
              <p className="text-xs mt-2">
                {isDeadlinePassed(deadlines.intermediate) ? (
                  <span className="text-destructive font-medium">OVERDUE</span>
                ) : (
                  formatDeadline(deadlines.intermediate)
                )}
              </p>
            </div>
            <div className="rounded-lg border p-3 bg-background">
              <p className="text-xs font-medium text-muted-foreground">Final Report</p>
              <p className="font-mono text-sm mt-1">1 month</p>
              <p className="text-xs mt-2">{formatDeadline(deadlines.final)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Timeline */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Timeline Preview</Label>
        <div className="relative pl-6 border-l-2 border-muted space-y-6">
          {data.occurrence_datetime && data.occurrence_datetime !== data.detection_datetime && (
            <div className="relative">
              <div className="absolute -left-[25px] h-4 w-4 rounded-full border-2 border-muted bg-background" />
              <div>
                <p className="text-sm font-medium">Incident Occurred</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(data.occurrence_datetime).toLocaleString('en-GB')}
                </p>
              </div>
            </div>
          )}

          {detectionDate && (
            <div className="relative">
              <div className="absolute -left-[25px] h-4 w-4 rounded-full border-2 border-primary bg-primary" />
              <div>
                <p className="text-sm font-medium">Incident Detected</p>
                <p className="text-xs text-muted-foreground">
                  {detectionDate.toLocaleString('en-GB')}
                </p>
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute -left-[25px] h-4 w-4 rounded-full border-2 border-dashed border-muted bg-background" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Incident Created</p>
              <p className="text-xs text-muted-foreground">Now</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
        <h4 className="font-medium text-sm text-blue-900 dark:text-blue-300 mb-2">
          About DORA Reporting Timelines
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• <strong>Initial notification:</strong> Within 4 hours of classification as major</li>
          <li>• <strong>Intermediate report:</strong> Within 72 hours, with updates on recovery</li>
          <li>• <strong>Final report:</strong> Within 1 month, including root cause analysis</li>
        </ul>
      </div>
    </div>
  );
}
