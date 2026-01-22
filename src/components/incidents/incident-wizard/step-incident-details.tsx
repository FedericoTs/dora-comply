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
  Building2,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDateTimeLocal } from '@/lib/date-utils';
import type { WizardData } from './index';
import type { IncidentType } from '@/lib/incidents/types';

interface StepIncidentDetailsProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  errors: Record<string, string[]>;
  vendors: Array<{ id: string; name: string }>;
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

export function StepIncidentDetails({ data, updateData, errors, vendors }: StepIncidentDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Incident Type */}
      <div className="space-y-3">
        <div>
          <Label className="text-base font-medium">
            Incident Type <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Select the primary cause or category
          </p>
        </div>

        <RadioGroup
          value={data.incident_type}
          onValueChange={(value) => updateData({ incident_type: value as IncidentType })}
          className="grid gap-2 md:grid-cols-2"
        >
          {INCIDENT_TYPES.map((type) => (
            <Label
              key={type.value}
              htmlFor={`type-${type.value}`}
              className={cn(
                'relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50',
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
                  <span className="font-medium text-sm">{type.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
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
            Clear, concise title that summarizes what happened
          </p>
        )}
      </div>

      {/* Detection DateTime */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="detection_datetime" className="text-base font-medium">
              Detection Time <span className="text-destructive">*</span>
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
              DORA deadlines start from this time
            </p>
          )}
        </div>

        {/* Occurrence DateTime (Optional) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="occurrence_datetime" className="text-base font-medium">
              Occurrence Time
            </Label>
          </div>
          <Input
            id="occurrence_datetime"
            type="datetime-local"
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
            If different from detection
          </p>
        </div>
      </div>

      {/* Brief Description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="description" className="text-base font-medium">
            Description
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
          Provide initial context. More details can be added later.
        </p>
      </div>

      {/* Linked Vendor */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="vendor" className="text-base font-medium">
            Related Vendor
          </Label>
        </div>
        <Select
          value={data.vendor_id || 'none'}
          onValueChange={(value) =>
            updateData({ vendor_id: value === 'none' ? undefined : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a vendor (if applicable)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No vendor involved</SelectItem>
            {vendors.map((vendor) => (
              <SelectItem key={vendor.id} value={vendor.id}>
                {vendor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Link to a third-party vendor if applicable
        </p>
      </div>
    </div>
  );
}
