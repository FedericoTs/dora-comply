'use client';

/**
 * Step 4: Review
 *
 * Final review of the plan before creation.
 */

import { format } from 'date-fns';
import {
  FileText,
  Calendar,
  User,
  AlertCircle,
  Target,
  Tag,
  Euro,
  CheckCircle2,
  Edit2,
  ListChecks,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  SOURCE_TYPE_INFO,
  PRIORITY_INFO,
  ACTION_TYPE_INFO,
  type Framework,
} from '@/lib/remediation/types';
import type { WizardData } from './index';

interface StepReviewProps {
  data: WizardData;
  vendors: Array<{ id: string; name: string }>;
  teamMembers: Array<{ id: string; full_name: string; email: string }>;
  goToStep: (step: number) => void;
}

const FRAMEWORK_LABELS: Record<Framework, string> = {
  nis2: 'NIS2',
  dora: 'DORA',
  iso27001: 'ISO 27001',
  soc2: 'SOC 2',
  gdpr: 'GDPR',
  general: 'General',
};

export function StepReview({
  data,
  vendors,
  teamMembers,
  goToStep,
}: StepReviewProps) {
  const vendor = vendors.find((v) => v.id === data.vendor_id);
  const owner = teamMembers.find((m) => m.id === data.owner_id);

  const priorityInfo = PRIORITY_INFO[data.priority];
  const sourceInfo = SOURCE_TYPE_INFO[data.source_type];

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <div className="p-4 rounded-lg bg-success/5 border border-success/20">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <div>
            <p className="font-medium text-success">Ready to Create</p>
            <p className="text-sm text-muted-foreground">
              Review the details below and click &quot;Create Plan&quot; to continue
            </p>
          </div>
        </div>
      </div>

      {/* Plan Details Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Plan Details
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => goToStep(0)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div>
            <p className="text-sm text-muted-foreground">Title</p>
            <p className="font-medium">{data.title}</p>
          </div>

          {/* Description */}
          {data.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm whitespace-pre-wrap">{data.description}</p>
            </div>
          )}

          <Separator />

          {/* Source and Framework */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Source</p>
              <Badge variant="secondary">{sourceInfo.label}</Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Framework</p>
              <Badge variant="outline">
                {data.framework ? FRAMEWORK_LABELS[data.framework] : 'General'}
              </Badge>
            </div>

            {vendor && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Vendor</p>
                <p className="font-medium text-sm">{vendor.name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Priority & Timeline Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Priority & Timeline
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => goToStep(1)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Priority */}
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
              </div>
            </div>

            {/* Risk Level */}
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Risk Level</p>
                <p className="font-medium text-sm capitalize">
                  {data.risk_level || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Target Date */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Target Date</p>
                <p className="font-medium text-sm">
                  {data.target_date
                    ? format(new Date(data.target_date), 'MMM d, yyyy')
                    : 'Not set'}
                </p>
              </div>
            </div>

            {/* Owner */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-medium text-sm">
                  {owner?.full_name || 'Not assigned'}
                </p>
              </div>
            </div>
          </div>

          {/* Cost and Tags */}
          {(data.estimated_cost || data.tags.length > 0) && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-6">
                {data.estimated_cost && (
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Cost</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: data.cost_currency,
                          minimumFractionDigits: 0,
                        }).format(data.estimated_cost)}
                      </p>
                    </div>
                  </div>
                )}

                {data.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {data.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Notes */}
          {data.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Initial Actions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Initial Actions
            <Badge variant="secondary" className="ml-1">
              {data.actions.length}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => goToStep(2)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          {data.actions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No initial actions defined. You can add actions after creating the plan.
            </p>
          ) : (
            <div className="space-y-3">
              {data.actions.map((action, index) => {
                const actionPriority = PRIORITY_INFO[action.priority];
                const actionType = ACTION_TYPE_INFO[action.action_type];

                return (
                  <div
                    key={action.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{action.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {actionType.label}
                        </Badge>
                        <Badge className={cn('text-xs', actionPriority.color)}>
                          {actionPriority.label}
                        </Badge>
                      </div>
                      {action.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {action.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {action.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(action.due_date), 'MMM d')}
                          </span>
                        )}
                        {action.estimated_hours && (
                          <span>{action.estimated_hours}h estimated</span>
                        )}
                        {action.requires_evidence && (
                          <span className="text-warning">Evidence required</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
