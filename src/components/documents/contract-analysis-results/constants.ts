import { CheckCircle2, AlertCircle, XCircle, HelpCircle } from 'lucide-react';
import type { StatusConfig, ProvisionStatus } from './types';

export const STATUS_CONFIG: Record<ProvisionStatus, StatusConfig> = {
  present: {
    icon: CheckCircle2,
    color: 'text-success',
    bgColor: 'bg-success/10',
    label: 'Present',
  },
  partial: {
    icon: AlertCircle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    label: 'Partial',
  },
  missing: {
    icon: XCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Missing',
  },
  unclear: {
    icon: HelpCircle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: 'Unclear',
  },
  not_analyzed: {
    icon: HelpCircle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: 'Not Analyzed',
  },
};
