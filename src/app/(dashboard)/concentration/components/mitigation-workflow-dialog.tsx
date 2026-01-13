'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Info,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Users,
  MapPin,
  Layers,
  Link2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import type { ConcentrationAlert, RiskLevel } from '@/lib/concentration/types';

interface MitigationWorkflowDialogProps {
  alert: ConcentrationAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ActionItem {
  id: string;
  label: string;
  description: string;
  link?: string;
  linkLabel?: string;
  completed: boolean;
}

interface AlertWorkflow {
  title: string;
  description: string;
  icon: React.ElementType;
  actions: Omit<ActionItem, 'id' | 'completed'>[];
}

const ALERT_CONFIG: Record<RiskLevel, {
  icon: React.ElementType;
  bgClass: string;
  borderClass: string;
  iconClass: string;
  titleClass: string;
}> = {
  critical: {
    icon: AlertCircle,
    bgClass: 'bg-red-500/5 dark:bg-red-500/10',
    borderClass: 'border-red-500/30',
    iconClass: 'text-red-500',
    titleClass: 'text-red-700 dark:text-red-400',
  },
  high: {
    icon: AlertTriangle,
    bgClass: 'bg-orange-500/5 dark:bg-orange-500/10',
    borderClass: 'border-orange-500/30',
    iconClass: 'text-orange-500',
    titleClass: 'text-orange-700 dark:text-orange-400',
  },
  medium: {
    icon: Info,
    bgClass: 'bg-yellow-500/5 dark:bg-yellow-500/10',
    borderClass: 'border-yellow-500/30',
    iconClass: 'text-yellow-600 dark:text-yellow-500',
    titleClass: 'text-yellow-700 dark:text-yellow-400',
  },
  low: {
    icon: Bell,
    bgClass: 'bg-blue-500/5 dark:bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    iconClass: 'text-blue-500',
    titleClass: 'text-blue-700 dark:text-blue-400',
  },
};

// Define workflows for each alert type
const ALERT_WORKFLOWS: Record<string, AlertWorkflow> = {
  spof_detected: {
    title: 'Single Point of Failure Remediation',
    description: 'Critical functions depend on a single vendor. Follow these steps to mitigate the risk.',
    icon: AlertCircle,
    actions: [
      {
        label: 'Review affected vendor details',
        description: 'Understand the vendor\'s criticality, services provided, and current contract terms.',
        link: '/vendors/{vendorId}',
        linkLabel: 'Open Vendor',
      },
      {
        label: 'Conduct substitutability assessment',
        description: 'Evaluate if the vendor can be replaced and identify potential alternatives.',
        link: '/vendors/{vendorId}?tab=risk',
        linkLabel: 'Assess Substitutability',
      },
      {
        label: 'Identify alternative vendors',
        description: 'Research and document at least 2 potential replacement vendors for the affected function.',
        link: '/vendors/new',
        linkLabel: 'Add Alternative Vendor',
      },
      {
        label: 'Review exit strategy provisions',
        description: 'Check existing contract for exit clauses, notice periods, and data portability terms.',
        link: '/vendors/{vendorId}?tab=contracts',
        linkLabel: 'View Contracts',
      },
      {
        label: 'Document recovery procedures',
        description: 'Create or update the business continuity plan for this critical function.',
        link: '/vendors/{vendorId}?tab=documents',
        linkLabel: 'Upload Documentation',
      },
    ],
  },
  geographic_concentration: {
    title: 'Geographic Concentration Remediation',
    description: 'Too many vendors are concentrated in a single region. Diversify to reduce regional risk.',
    icon: MapPin,
    actions: [
      {
        label: 'Review current geographic distribution',
        description: 'Analyze the concentration heat map to understand which regions are over-represented.',
        link: '/concentration',
        linkLabel: 'View Heat Map',
      },
      {
        label: 'Identify vendors in concentrated regions',
        description: 'List all vendors headquartered in the over-concentrated region.',
        link: '/vendors?sort=country',
        linkLabel: 'Filter Vendors',
      },
      {
        label: 'Evaluate vendors in alternative regions',
        description: 'Research vendors in under-represented regions that could provide similar services.',
        link: '/vendors/new',
        linkLabel: 'Add New Vendor',
      },
      {
        label: 'Assess data residency requirements',
        description: 'Review DORA and GDPR data residency requirements that may affect vendor selection.',
      },
      {
        label: 'Update business continuity plan',
        description: 'Document regional failover procedures in case of geographic disruption.',
        link: '/documents',
        linkLabel: 'Upload BCP Document',
      },
    ],
  },
  service_concentration: {
    title: 'Service Concentration Remediation',
    description: 'A single service type dominates your vendor portfolio. Diversify to reduce service-specific risk.',
    icon: Layers,
    actions: [
      {
        label: 'Review service distribution metrics',
        description: 'Analyze the HHI (Herfindahl-Hirschman Index) to understand concentration levels.',
        link: '/concentration',
        linkLabel: 'View Metrics',
      },
      {
        label: 'Identify dominant service providers',
        description: 'List vendors providing the over-concentrated service type.',
        link: '/vendors',
        linkLabel: 'View Vendors',
      },
      {
        label: 'Evaluate service alternatives',
        description: 'Research whether the dominant service could be split across multiple providers.',
      },
      {
        label: 'Review SLAs for concentrated services',
        description: 'Ensure robust SLAs are in place for the concentrated service type.',
        link: '/vendors?tab=contracts',
        linkLabel: 'Review Contracts',
      },
      {
        label: 'Document vendor lock-in mitigation',
        description: 'Create exit strategies for each vendor in the concentrated service area.',
      },
    ],
  },
  threshold_breach: {
    title: 'Fourth-Party Risk Remediation',
    description: 'Subcontractor chains exceed acceptable depth. Improve visibility and oversight.',
    icon: Link2,
    actions: [
      {
        label: 'Identify deep chain vendors',
        description: 'Review which vendors have the deepest subcontractor chains.',
        link: '/concentration',
        linkLabel: 'View Supply Chain',
      },
      {
        label: 'Request subcontractor information',
        description: 'Send requests to affected vendors for complete subcontractor disclosure (DORA requirement).',
        link: '/vendors',
        linkLabel: 'Contact Vendors',
      },
      {
        label: 'Assess critical function exposure',
        description: 'Determine which critical functions are exposed through deep chains.',
      },
      {
        label: 'Update vendor contracts',
        description: 'Add subcontractor notification and approval clauses to vendor contracts.',
        link: '/vendors?tab=contracts',
        linkLabel: 'Review Contracts',
      },
      {
        label: 'Implement ongoing monitoring',
        description: 'Set up periodic reviews of subcontractor chains for affected vendors.',
        link: '/settings/integrations',
        linkLabel: 'Configure Monitoring',
      },
    ],
  },
  substitutability_gap: {
    title: 'Substitutability Assessment Remediation',
    description: 'Critical vendors lack substitutability assessments. Complete assessments to ensure exit readiness.',
    icon: Users,
    actions: [
      {
        label: 'List vendors without assessments',
        description: 'Identify all critical and important vendors missing substitutability assessments.',
        link: '/vendors?filter=no-substitutability',
        linkLabel: 'View Unassessed Vendors',
      },
      {
        label: 'Prioritize by criticality',
        description: 'Start with critical tier vendors, then move to important tier.',
      },
      {
        label: 'Complete substitutability assessments',
        description: 'For each vendor, evaluate market alternatives, switching costs, and transition timeline.',
        link: '/vendors/{vendorId}?tab=risk',
        linkLabel: 'Start Assessment',
      },
      {
        label: 'Document alternative providers',
        description: 'For each assessed vendor, document at least 2 viable alternatives.',
      },
      {
        label: 'Update exit strategies',
        description: 'Based on assessments, update or create exit strategies for critical vendors.',
        link: '/documents',
        linkLabel: 'Upload Exit Strategy',
      },
    ],
  },
};

// Local storage key for action completion tracking
const STORAGE_KEY = 'concentration-alert-actions';

interface StoredActions {
  [alertId: string]: {
    completedActions: string[];
    lastUpdated: string;
  };
}

export function MitigationWorkflowDialog({
  alert,
  open,
  onOpenChange,
}: MitigationWorkflowDialogProps) {
  const router = useRouter();
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [expandedSection, setExpandedSection] = useState<string>('actions');

  // Load completed actions from localStorage
  const loadStoredActions = useCallback((alertId: string): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredActions = JSON.parse(stored);
        return parsed[alertId]?.completedActions || [];
      }
    } catch (e) {
      console.error('Failed to load stored actions:', e);
    }
    return [];
  }, []);

  // Save completed actions to localStorage
  const saveStoredActions = useCallback((alertId: string, completedActions: string[]) => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed: StoredActions = stored ? JSON.parse(stored) : {};
      parsed[alertId] = {
        completedActions,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.error('Failed to save stored actions:', e);
    }
  }, []);

  // Initialize action items when alert changes
  useEffect(() => {
    if (!alert) return;

    const workflow = ALERT_WORKFLOWS[alert.type];
    if (!workflow) return;

    const completedActions = loadStoredActions(alert.id);
    const vendorId = alert.affected_vendors[0] || '';

    const items: ActionItem[] = workflow.actions.map((action, index) => ({
      id: `${alert.id}-action-${index}`,
      label: action.label,
      description: action.description,
      link: action.link?.replace('{vendorId}', vendorId),
      linkLabel: action.linkLabel,
      completed: completedActions.includes(`${alert.id}-action-${index}`),
    }));

    setActionItems(items);
  }, [alert, loadStoredActions]);

  if (!alert) return null;

  const config = ALERT_CONFIG[alert.severity];
  const Icon = config.icon;
  const workflow = ALERT_WORKFLOWS[alert.type];
  const WorkflowIcon = workflow?.icon || FileText;

  const completedCount = actionItems.filter((a) => a.completed).length;
  const totalCount = actionItems.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleAction = (actionId: string) => {
    setActionItems((prev) => {
      const updated = prev.map((item) =>
        item.id === actionId ? { ...item, completed: !item.completed } : item
      );

      // Save to localStorage
      const completedIds = updated.filter((a) => a.completed).map((a) => a.id);
      saveStoredActions(alert.id, completedIds);

      return updated;
    });
  };

  const handleNavigate = (link: string) => {
    router.push(link);
    onOpenChange(false);
  };

  const handleMarkAllComplete = () => {
    setActionItems((prev) => {
      const updated = prev.map((item) => ({ ...item, completed: true }));
      const completedIds = updated.map((a) => a.id);
      saveStoredActions(alert.id, completedIds);
      return updated;
    });
    toast.success('All actions marked as complete');
  };

  const handleResetProgress = () => {
    setActionItems((prev) => prev.map((item) => ({ ...item, completed: false })));
    saveStoredActions(alert.id, []);
    toast.info('Progress reset');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.bgClass)}>
              <Icon className={cn('h-5 w-5', config.iconClass)} />
            </div>
            <div className="flex-1">
              <DialogTitle className={config.titleClass}>{alert.title}</DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[10px] uppercase',
                    alert.severity === 'critical' && 'bg-red-100 text-red-700',
                    alert.severity === 'high' && 'bg-orange-100 text-orange-700',
                    alert.severity === 'medium' && 'bg-yellow-100 text-yellow-700',
                    alert.severity === 'low' && 'bg-blue-100 text-blue-700'
                  )}
                >
                  {alert.severity}
                </Badge>
                <span className="text-xs">{alert.type.replace(/_/g, ' ')}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Progress Overview */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WorkflowIcon className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">
                  {workflow?.title || 'Mitigation Workflow'}
                </span>
              </div>
              <span className="text-sm font-medium">
                {completedCount}/{totalCount} complete
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {workflow?.description || alert.description}
            </p>
          </div>

          {/* Affected Resources */}
          <Accordion
            type="single"
            collapsible
            value={expandedSection}
            onValueChange={setExpandedSection}
          >
            {/* Affected Vendors */}
            {alert.affected_vendors.length > 0 && (
              <AccordionItem value="vendors">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Affected Vendors ({alert.affected_vendors.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pt-2">
                    {alert.affected_vendors.slice(0, 5).map((vendorId) => (
                      <Button
                        key={vendorId}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between h-8 text-xs"
                        onClick={() => handleNavigate(`/vendors/${vendorId}`)}
                      >
                        <span className="truncate">{vendorId}</span>
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    ))}
                    {alert.affected_vendors.length > 5 && (
                      <p className="text-xs text-muted-foreground pl-2 pt-1">
                        +{alert.affected_vendors.length - 5} more vendors
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Affected Functions */}
            {alert.affected_functions && alert.affected_functions.length > 0 && (
              <AccordionItem value="functions">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Affected Functions ({alert.affected_functions.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {alert.affected_functions.map((func) => (
                      <Badge key={func} variant="outline">
                        {func}
                      </Badge>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Action Items */}
            <AccordionItem value="actions">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Action Items ({completedCount}/{totalCount})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {actionItems.map((action, index) => (
                    <div
                      key={action.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                        action.completed
                          ? 'bg-green-500/5 border-green-500/20'
                          : 'bg-muted/30 hover:bg-muted/50'
                      )}
                    >
                      <Checkbox
                        id={action.id}
                        checked={action.completed}
                        onCheckedChange={() => handleToggleAction(action.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={action.id}
                          className={cn(
                            'text-sm font-medium cursor-pointer',
                            action.completed && 'line-through text-muted-foreground'
                          )}
                        >
                          {index + 1}. {action.label}
                        </label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {action.description}
                        </p>
                        {action.link && !action.completed && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-6 px-0 text-xs mt-1"
                            onClick={() => handleNavigate(action.link!)}
                          >
                            {action.linkLabel || 'Go to page'}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                      {action.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetProgress}
                disabled={completedCount === 0}
              >
                Reset Progress
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllComplete}
                disabled={completedCount === totalCount}
              >
                Mark All Complete
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {progressPercentage === 100 && (
                <Button
                  onClick={() => {
                    toast.success('Alert resolved! Great job completing all actions.');
                    onOpenChange(false);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
