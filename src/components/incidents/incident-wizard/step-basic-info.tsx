'use client';

import {
  Bug,
  Server,
  User,
  Cloud,
  HelpCircle,
  Zap,
  Calendar,
  FileText,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { WizardData } from './index';
import type { IncidentType } from '@/lib/incidents/types';

interface StepBasicInfoProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  errors: Record<string, string[]>;
}

const INCIDENT_TYPES: Array<{
  value: IncidentType;
  label: string;
  description: string;
  icon: typeof Bug;
}> = [
  {
    value: 'cyber_attack',
    label: 'Cyber Attack',
    description: 'Malicious external attack (malware, ransomware, DDoS)',
    icon: Bug,
  },
  {
    value: 'system_failure',
    label: 'System Failure',
    description: 'Hardware or software malfunction',
    icon: Server,
  },
  {
    value: 'human_error',
    label: 'Human Error',
    description: 'Operational mistake by staff',
    icon: User,
  },
  {
    value: 'third_party_failure',
    label: 'Third-Party Failure',
    description: 'Vendor or supplier service disruption',
    icon: Cloud,
  },
  {
    value: 'natural_disaster',
    label: 'Natural Disaster',
    description: 'Physical event (flood, fire, earthquake)',
    icon: Zap,
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other type of incident',
    icon: HelpCircle,
  },
];

export function StepBasicInfo({ data, updateData, errors }: StepBasicInfoProps) {
  // Format datetime for input
  const formatDateTimeLocal = (isoString: string): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      return date.toISOString().slice(0, 16);
    } catch {
      return isoString.slice(0, 16);
    }
  };

  return (
    <div className="space-y-8">
      {/* Incident Type */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">
            What type of incident is this? <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Select the primary cause or category of this incident
          </p>
        </div>

        <RadioGroup
          value={data.incident_type}
          onValueChange={(value) => updateData({ incident_type: value as IncidentType })}
          className="grid gap-3 md:grid-cols-2"
        >
          {INCIDENT_TYPES.map((type) => (
            <Label
              key={type.value}
              htmlFor={`type-${type.value}`}
              className={cn(
                'relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50',
                data.incident_type === type.value
                  ? 'border-primary bg-primary/5'
                  : 'border-muted'
              )}
            >
              <RadioGroupItem
                value={type.value}
                id={`type-${type.value}`}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <type.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{type.label}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {type.description}
                </p>
              </div>
            </Label>
          ))}
        </RadioGroup>

        {errors.incident_type && (
          <p className="text-sm text-destructive">{errors.incident_type[0]}</p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-medium">
          Incident Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Database server outage affecting trading platform"
          className={cn(errors.title && 'border-destructive')}
          value={data.title}
          onChange={(e) => updateData({ title: e.target.value })}
        />
        {errors.title ? (
          <p className="text-sm text-destructive">{errors.title[0]}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Use a clear, concise title that summarizes what happened
          </p>
        )}
      </div>

      {/* Detection DateTime */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="detection_datetime" className="text-base font-medium">
            When was this incident detected? <span className="text-destructive">*</span>
          </Label>
        </div>
        <Input
          id="detection_datetime"
          type="datetime-local"
          className={cn(errors.detection_datetime && 'border-destructive')}
          value={formatDateTimeLocal(data.detection_datetime)}
          max={new Date().toISOString().slice(0, 16)}
          onChange={(e) => {
            if (e.target.value) {
              updateData({ detection_datetime: new Date(e.target.value).toISOString() });
            }
          }}
        />
        {errors.detection_datetime ? (
          <p className="text-sm text-destructive">{errors.detection_datetime[0]}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            The time when this incident was first identified. DORA reporting deadlines are calculated from this time.
          </p>
        )}
      </div>

      {/* Occurrence DateTime (Optional) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="occurrence_datetime" className="text-base font-medium">
            When did the incident actually occur?
          </Label>
        </div>
        <Input
          id="occurrence_datetime"
          type="datetime-local"
          className={cn(errors.occurrence_datetime && 'border-destructive')}
          value={data.occurrence_datetime ? formatDateTimeLocal(data.occurrence_datetime) : ''}
          max={formatDateTimeLocal(data.detection_datetime)}
          onChange={(e) => {
            updateData({
              occurrence_datetime: e.target.value
                ? new Date(e.target.value).toISOString()
                : undefined,
            });
          }}
        />
        <p className="text-xs text-muted-foreground">
          Optional: If different from detection time, when did the incident actually start?
        </p>
      </div>

      {/* Brief Description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="description" className="text-base font-medium">
            Brief Description
          </Label>
        </div>
        <Textarea
          id="description"
          placeholder="Briefly describe what happened..."
          rows={3}
          value={data.description || ''}
          onChange={(e) => updateData({ description: e.target.value || undefined })}
        />
        <p className="text-xs text-muted-foreground">
          Optional: Provide initial context about the incident. More details can be added later.
        </p>
      </div>

      {/* Quick Tips */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="font-medium text-sm mb-2">Getting Started</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Select the type that best describes the root cause</li>
          <li>• Use a descriptive title that others will understand</li>
          <li>• Detection time is critical for regulatory deadline calculation</li>
          <li>• Classification will be determined in Step 3 based on impact data</li>
        </ul>
      </div>
    </div>
  );
}
