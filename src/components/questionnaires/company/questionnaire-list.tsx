'use client';

/**
 * QuestionnaireList Component
 *
 * Displays a list of questionnaires with status, progress, and actions
 */

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Clock,
  CheckCircle2,
  Send,
  AlertCircle,
  Sparkles,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
  Trash2,
  Building2,
  Mail,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { QuestionnaireSummary, QuestionnaireStatus } from '@/lib/nis2-questionnaire/types';
import { cn } from '@/lib/utils';

interface QuestionnaireListProps {
  questionnaires: QuestionnaireSummary[];
}

const statusConfig: Record<
  QuestionnaireStatus,
  { label: string; icon: typeof Clock; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  draft: { label: 'Draft', icon: Clock, variant: 'outline' },
  sent: { label: 'Sent', icon: Send, variant: 'secondary' },
  in_progress: { label: 'In Progress', icon: Clock, variant: 'default' },
  submitted: { label: 'Submitted', icon: AlertCircle, variant: 'default' },
  approved: { label: 'Approved', icon: CheckCircle2, variant: 'secondary' },
  rejected: { label: 'Rejected', icon: AlertCircle, variant: 'destructive' },
  expired: { label: 'Expired', icon: Clock, variant: 'outline' },
};

function QuestionnaireStatusBadge({ status }: { status: QuestionnaireStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function QuestionnaireCard({ questionnaire }: { questionnaire: QuestionnaireSummary }) {
  const q = questionnaire;
  const aiPercentage = q.questions_total > 0
    ? Math.round((q.questions_ai_filled / q.questions_total) * 100)
    : 0;

  const isOverdue = q.alert_status === 'Overdue';
  const isDueSoon = q.alert_status === 'Due Soon';

  return (
    <Card className={cn(
      'transition-colors hover:border-primary/30',
      isOverdue && 'border-destructive/50',
      isDueSoon && 'border-amber-500/50'
    )}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Vendor Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/questionnaires/${q.id}`}
                className="font-medium text-foreground hover:underline truncate"
              >
                {q.vendor_company_name || q.vendor_name || 'Unknown Vendor'}
              </Link>
              {q.alert_status && (
                <Badge
                  variant={isOverdue ? 'destructive' : 'outline'}
                  className="shrink-0 text-xs"
                >
                  {q.alert_status}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {q.vendor_email}
              </span>
              {q.template_name && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {q.template_name}
                </span>
              )}
              {q.due_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due {new Date(q.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Center: Progress */}
          <div className="flex items-center gap-4 sm:w-48">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  {q.questions_answered}/{q.questions_total} answered
                </span>
                <span className="font-medium">{q.progress_percentage}%</span>
              </div>
              <Progress value={q.progress_percentage} className="h-1.5" />
            </div>

            {aiPercentage > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="shrink-0 gap-1">
                    <Sparkles className="h-3 w-3" />
                    {aiPercentage}%
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {aiPercentage}% of answers were AI-assisted
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Right: Status & Actions */}
          <div className="flex items-center gap-2">
            <QuestionnaireStatusBadge status={q.status} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/questionnaires/${q.id}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                {['sent', 'in_progress'].includes(q.status) && (
                  <DropdownMenuItem>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Email
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {q.status === 'draft' && (
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Sent/Submitted timestamps */}
        <div className="mt-3 pt-3 border-t flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {q.sent_at && (
            <span>Sent {formatDistanceToNow(new Date(q.sent_at), { addSuffix: true })}</span>
          )}
          {q.submitted_at && (
            <span>
              Submitted {formatDistanceToNow(new Date(q.submitted_at), { addSuffix: true })}
            </span>
          )}
          {!q.sent_at && q.created_at && (
            <span>Created {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function QuestionnaireList({ questionnaires }: QuestionnaireListProps) {
  if (questionnaires.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No questionnaires found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questionnaires.map((q) => (
        <QuestionnaireCard key={q.id} questionnaire={q} />
      ))}
    </div>
  );
}
