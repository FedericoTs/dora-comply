'use client';

import { AlertTriangle, Shield, Info, Bug, Server, User, Cloud, HelpCircle, Zap } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { WizardData } from './index';
import type { IncidentClassification, IncidentType } from '@/lib/incidents/types';

interface StepClassificationProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  errors: Record<string, string[]>;
}

const CLASSIFICATIONS: Array<{
  value: IncidentClassification;
  label: string;
  description: string;
  icon: typeof AlertTriangle;
  color: string;
  deadline: string;
}> = [
  {
    value: 'major',
    label: 'Major',
    description: 'Significant impact on critical services or data breach',
    icon: AlertTriangle,
    color: 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    deadline: 'Report within 4 hours',
  },
  {
    value: 'significant',
    label: 'Significant',
    description: 'Moderate impact on services or operations',
    icon: Shield,
    color: 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    deadline: 'Report within 72 hours',
  },
  {
    value: 'minor',
    label: 'Minor',
    description: 'Limited impact, quickly resolved',
    icon: Info,
    color: 'border-slate-400 bg-slate-50 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400',
    deadline: 'Internal tracking only',
  },
];

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

export function StepClassification({ data, updateData, errors }: StepClassificationProps) {
  return (
    <div className="space-y-8">
      {/* Classification */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Incident Classification</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Select the severity level based on DORA Article 19 criteria
          </p>
        </div>

        <RadioGroup
          value={data.classification}
          onValueChange={(value) => updateData({ classification: value as IncidentClassification })}
          className="grid gap-4 md:grid-cols-3"
        >
          {CLASSIFICATIONS.map((classification) => (
            <Label
              key={classification.value}
              htmlFor={`classification-${classification.value}`}
              className={cn(
                'relative flex cursor-pointer flex-col rounded-lg border-2 p-4 transition-colors hover:bg-accent/50',
                data.classification === classification.value
                  ? classification.color
                  : 'border-muted'
              )}
            >
              <RadioGroupItem
                value={classification.value}
                id={`classification-${classification.value}`}
                className="sr-only"
              />
              <div className="flex items-center gap-3 mb-2">
                <classification.icon className="h-5 w-5" />
                <span className="font-semibold">{classification.label}</span>
              </div>
              <p className="text-sm opacity-80">{classification.description}</p>
              <p className="text-xs mt-2 font-medium">{classification.deadline}</p>
            </Label>
          ))}
        </RadioGroup>

        {errors.classification && (
          <p className="text-sm text-destructive">{errors.classification[0]}</p>
        )}
      </div>

      {/* Incident Type */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Incident Type</Label>
          <p className="text-sm text-muted-foreground mt-1">
            What caused this incident?
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

      {/* Classification guidance */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="font-medium text-sm mb-2">DORA Classification Criteria</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Major:</strong> Affects &gt;10% of clients, &gt;€1M impact, critical function disruption, or data breach</li>
          <li>• <strong>Significant:</strong> Affects 5-10% of clients, €100K-€1M impact, or prolonged service degradation</li>
          <li>• <strong>Minor:</strong> Limited scope, quickly contained, minimal business impact</li>
        </ul>
      </div>
    </div>
  );
}
