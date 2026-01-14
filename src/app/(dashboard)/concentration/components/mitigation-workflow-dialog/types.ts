import type { ConcentrationAlert } from '@/lib/concentration/types';

export interface MitigationWorkflowDialogProps {
  alert: ConcentrationAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface ActionItem {
  id: string;
  label: string;
  description: string;
  link?: string;
  linkLabel?: string;
  completed: boolean;
}

export interface AlertWorkflow {
  title: string;
  description: string;
  icon: React.ElementType;
  actions: Omit<ActionItem, 'id' | 'completed'>[];
}

export interface StoredActions {
  [alertId: string]: {
    completedActions: string[];
    lastUpdated: string;
  };
}
