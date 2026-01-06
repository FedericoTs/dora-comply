'use client';

/**
 * Submission Card Component
 *
 * Visual card representation of a submission with status and actions
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  RefreshCw,
  CheckCircle,
  Send,
  BadgeCheck,
  XCircle,
  Calendar,
  Clock,
  AlertTriangle,
  MessageSquare,
  Download,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Copy,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  type Submission,
  type SubmissionStatus,
  getSubmissionStatusConfig,
  formatRelativeTime,
} from '@/lib/roi/submissions-types';

interface SubmissionCardProps {
  submission: Submission;
  checklistProgress?: number;
  onValidate?: () => void;
  onSubmit?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  className?: string;
}

const statusIcons: Record<SubmissionStatus, React.ComponentType<{ className?: string }>> = {
  draft: FileText,
  validating: RefreshCw,
  ready: CheckCircle,
  submitted: Send,
  acknowledged: BadgeCheck,
  rejected: XCircle,
};

export function SubmissionCard({
  submission,
  checklistProgress = 0,
  onValidate,
  onSubmit,
  onDownload,
  onDelete,
  className,
}: SubmissionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const statusConfig = getSubmissionStatusConfig(submission.status);
  const StatusIcon = statusIcons[submission.status];

  const daysUntilDeadline = Math.ceil(
    (submission.submissionDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const isOverdue = daysUntilDeadline < 0;
  const isUrgent = daysUntilDeadline <= 7 && daysUntilDeadline >= 0;

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isHovered && 'shadow-md',
        submission.status === 'rejected' && 'border-red-200',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                statusConfig.color
              )}
            >
              <StatusIcon
                className={cn(
                  'h-4 w-4',
                  submission.status === 'validating' && 'animate-spin'
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">{submission.reportingPeriod}</h3>
                <Badge
                  variant="secondary"
                  className={cn('text-[10px]', statusConfig.color)}
                >
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {statusConfig.description}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onDownload && (
                <DropdownMenuItem onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Package
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onDelete && submission.status === 'draft' && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Draft
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        {submission.status === 'draft' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Checklist Progress</span>
              <span className="font-medium">{checklistProgress}%</span>
            </div>
            <Progress value={checklistProgress} className="h-1.5" />
          </div>
        )}

        {/* Validation Results */}
        {(submission.validationErrors > 0 || submission.validationWarnings > 0) && (
          <div className="flex items-center gap-3 text-xs">
            {submission.validationErrors > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="h-3 w-3" />
                <span>{submission.validationErrors} errors</span>
              </div>
            )}
            {submission.validationWarnings > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                <span>{submission.validationWarnings} warnings</span>
              </div>
            )}
          </div>
        )}

        {/* ESA Confirmation */}
        {submission.esaConfirmationNumber && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
            <BadgeCheck className="h-4 w-4 text-green-600" />
            <div className="text-xs">
              <p className="font-medium text-green-700">ESA Confirmation</p>
              <p className="text-green-600">{submission.esaConfirmationNumber}</p>
            </div>
          </div>
        )}

        {/* Deadline Info */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                Due: {submission.submissionDeadline.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            {submission.submittedAt && (
              <div className="flex items-center gap-1">
                <Send className="h-3 w-3" />
                <span>Submitted {formatRelativeTime(submission.submittedAt)}</span>
              </div>
            )}
          </div>

          {/* Days Remaining Badge */}
          {submission.status !== 'submitted' && submission.status !== 'acknowledged' && (
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px]',
                isOverdue && 'bg-red-100 text-red-700',
                isUrgent && !isOverdue && 'bg-amber-100 text-amber-700'
              )}
            >
              <Clock className="h-3 w-3 mr-1" />
              {isOverdue
                ? `${Math.abs(daysUntilDeadline)}d overdue`
                : `${daysUntilDeadline}d left`}
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {submission.status === 'draft' && onValidate && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onValidate}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Validate
            </Button>
          )}

          {submission.status === 'ready' && onSubmit && (
            <Button
              size="sm"
              className="flex-1"
              onClick={onSubmit}
            >
              <Send className="h-3 w-3 mr-1" />
              Submit to ESA
            </Button>
          )}

          {submission.status === 'rejected' && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              onClick={onValidate}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Review Issues
            </Button>
          )}

          <Button variant="ghost" size="sm" asChild>
            <Link href={`/roi/submissions/${submission.id}`}>
              Details
              <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Creator Info */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t">
          <span>
            Created by {submission.createdByName || 'Unknown'} • {formatRelativeTime(submission.createdAt)}
          </span>
          {submission.notes && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>Has notes</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact submission status badge for lists
 */
interface CompactSubmissionBadgeProps {
  submission: Submission;
  onClick?: () => void;
}

export function CompactSubmissionBadge({ submission, onClick }: CompactSubmissionBadgeProps) {
  const statusConfig = getSubmissionStatusConfig(submission.status);
  const StatusIcon = statusIcons[submission.status];

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-colors',
        'border hover:bg-muted/50',
        statusConfig.color
      )}
    >
      <StatusIcon className={cn(
        'h-3 w-3',
        submission.status === 'validating' && 'animate-spin'
      )} />
      <span className="font-medium">{submission.reportingPeriod}</span>
      <span className="text-muted-foreground">• {statusConfig.label}</span>
    </button>
  );
}

/**
 * Empty state for no submissions
 */
export function NoSubmissionsState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg mb-1">No submissions yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        Create your first submission to start the RoI reporting process
        for DORA compliance.
      </p>
      {onCreate && (
        <Button onClick={onCreate}>
          <FileText className="h-4 w-4 mr-2" />
          Create First Submission
        </Button>
      )}
    </div>
  );
}
