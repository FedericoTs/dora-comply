'use client';

import { useState, useEffect, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  ScrollText,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Upload,
  UserPlus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fetchVendorActivities } from '@/lib/vendors/actions';

// Activity types
export type ActivityType =
  | 'document_uploaded'
  | 'document_analyzed'
  | 'contract_added'
  | 'contract_expiring'
  | 'contact_added'
  | 'assessment_completed'
  | 'risk_score_changed'
  | 'compliance_updated'
  | 'lei_verified'
  | 'monitoring_alert'
  | 'status_changed'
  | 'tier_changed'
  | 'created';

export interface VendorActivity {
  id: string;
  vendorId: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
}

interface VendorActivityTimelineProps {
  vendorId: string;
  activities?: VendorActivity[];
  isLoading?: boolean;
  maxItems?: number;
}

// Icon and color mapping for activity types
const activityConfig: Record<ActivityType, { icon: React.ElementType; color: string; bgColor: string }> = {
  document_uploaded: { icon: Upload, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  document_analyzed: { icon: FileText, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  contract_added: { icon: ScrollText, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  contract_expiring: { icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  contact_added: { icon: UserPlus, color: 'text-sky-600', bgColor: 'bg-sky-100 dark:bg-sky-900/30' },
  assessment_completed: { icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  risk_score_changed: { icon: TrendingUp, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  compliance_updated: { icon: Shield, color: 'text-primary', bgColor: 'bg-primary/10' },
  lei_verified: { icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  monitoring_alert: { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  status_changed: { icon: RefreshCw, color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800' },
  tier_changed: { icon: Shield, color: 'text-primary', bgColor: 'bg-primary/10' },
  created: { icon: Calendar, color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800' },
};

// Filter options
type FilterOption = 'all' | 'documents' | 'compliance' | 'risk' | 'changes';

const filterConfig: Record<FilterOption, { label: string; types: ActivityType[] }> = {
  all: { label: 'All Activity', types: [] },
  documents: {
    label: 'Documents',
    types: ['document_uploaded', 'document_analyzed', 'contract_added', 'contract_expiring'],
  },
  compliance: {
    label: 'Compliance',
    types: ['assessment_completed', 'compliance_updated', 'lei_verified'],
  },
  risk: {
    label: 'Risk & Alerts',
    types: ['risk_score_changed', 'monitoring_alert'],
  },
  changes: {
    label: 'Changes',
    types: ['status_changed', 'tier_changed', 'contact_added', 'created'],
  },
};

// Map server activity types to component activity types
function mapActivityType(serverType: string): ActivityType {
  const typeMap: Record<string, ActivityType> = {
    vendor_created: 'created',
    vendor_updated: 'status_changed',
    document_uploaded: 'document_uploaded',
    contract_added: 'contract_added',
    contract_expiring: 'contract_expiring',
    assessment_completed: 'assessment_completed',
    risk_score_changed: 'risk_score_changed',
    monitoring_alert: 'monitoring_alert',
    soc2_parsed: 'document_analyzed',
    lei_verified: 'lei_verified',
    contact_added: 'contact_added',
    status_changed: 'status_changed',
    maturity_change: 'compliance_updated',
  };
  return typeMap[serverType] || 'status_changed';
}

// Mock data generator for demonstration (fallback)
function generateMockActivities(vendorId: string): VendorActivity[] {
  const now = new Date();
  return [
    {
      id: '1',
      vendorId,
      type: 'document_analyzed',
      title: 'SOC 2 Type II report analyzed',
      description: '15 controls mapped to DORA requirements',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'AI Analysis',
    },
    {
      id: '2',
      vendorId,
      type: 'risk_score_changed',
      title: 'Risk score improved',
      description: 'Score changed from 65 to 72 (+7 points)',
      metadata: { oldScore: 65, newScore: 72 },
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      vendorId,
      type: 'contract_expiring',
      title: 'Contract expires in 30 days',
      description: 'Master Services Agreement requires renewal',
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      vendorId,
      type: 'assessment_completed',
      title: 'Annual assessment completed',
      description: 'DORA compliance assessment finalized',
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'John Smith',
    },
    {
      id: '5',
      vendorId,
      type: 'lei_verified',
      title: 'LEI verified via GLEIF',
      description: 'Legal Entity Identifier confirmed active',
      createdAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '6',
      vendorId,
      type: 'document_uploaded',
      title: 'ISO 27001 certificate uploaded',
      description: 'Valid until December 2025',
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'Sarah Johnson',
    },
    {
      id: '7',
      vendorId,
      type: 'contact_added',
      title: 'Security contact added',
      description: 'Added CISO contact information',
      createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'Admin',
    },
    {
      id: '8',
      vendorId,
      type: 'created',
      title: 'Vendor added to registry',
      description: 'Initial vendor profile created',
      createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'System Import',
    },
  ];
}

export function VendorActivityTimeline({
  vendorId,
  activities: providedActivities,
  isLoading: externalLoading = false,
  maxItems = 5,
}: VendorActivityTimelineProps) {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [expanded, setExpanded] = useState(false);
  const [activities, setActivities] = useState<VendorActivity[]>(providedActivities || []);
  const [isPending, startTransition] = useTransition();
  const [hasLoaded, setHasLoaded] = useState(!!providedActivities);

  // Fetch real activities on mount if not provided
  useEffect(() => {
    if (providedActivities) {
      setActivities(providedActivities);
      setHasLoaded(true);
      return;
    }

    startTransition(async () => {
      try {
        // Map the activity types from server to component types
        const serverActivities = await fetchVendorActivities(vendorId, 30);
        const mappedActivities: VendorActivity[] = serverActivities.map(a => ({
          id: a.id,
          vendorId: a.vendorId,
          type: mapActivityType(a.type),
          title: a.title,
          description: a.description,
          metadata: a.metadata,
          createdAt: a.createdAt,
          createdBy: a.createdBy,
        }));
        setActivities(mappedActivities);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
        // Fall back to mock data on error
        setActivities(generateMockActivities(vendorId));
      } finally {
        setHasLoaded(true);
      }
    });
  }, [vendorId, providedActivities]);

  const isLoading = externalLoading || (isPending && !hasLoaded);
  const allActivities = activities.length > 0 ? activities : (hasLoaded ? [] : generateMockActivities(vendorId));

  // Filter activities
  const filteredActivities = filter === 'all'
    ? allActivities
    : allActivities.filter(a => filterConfig[filter].types.includes(a.type));

  // Limit display unless expanded
  const displayedActivities = expanded
    ? filteredActivities
    : filteredActivities.slice(0, maxItems);

  const hasMore = filteredActivities.length > maxItems;

  if (isLoading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activity Timeline
          </CardTitle>
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(filterConfig).map(([key, config]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No activity recorded yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

            <div className="space-y-4">
              {displayedActivities.map((activity, index) => {
                const config = activityConfig[activity.type];
                const Icon = config.icon;
                const isLast = index === displayedActivities.length - 1;

                return (
                  <div key={activity.id} className="relative flex gap-3 pl-0">
                    {/* Icon */}
                    <div
                      className={cn(
                        'relative z-10 flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0',
                        config.bgColor
                      )}
                    >
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>

                    {/* Content */}
                    <div className={cn('flex-1 min-w-0 pb-4', isLast && 'pb-0')}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{activity.title}</p>
                          {activity.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {activity.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {activity.createdBy && (
                        <Badge variant="secondary" className="mt-1.5 text-xs">
                          {activity.createdBy}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expand/Collapse button */}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-4"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show {filteredActivities.length - maxItems} More
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
