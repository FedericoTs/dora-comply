'use client';

/**
 * Finding Card Component
 *
 * Reusable card for displaying test finding summary.
 * Used in test detail pages and finding lists.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  Calendar,
  User,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { TestFinding, FindingSeverity, FindingStatus } from '@/lib/testing/types';
import {
  getFindingSeverityLabel,
  getFindingSeverityColor,
  getFindingStatusLabel,
} from '@/lib/testing/types';

interface FindingCardProps {
  finding: TestFinding;
  testId?: string;
  variant?: 'default' | 'compact';
  showActions?: boolean;
  onStatusChange?: (findingId: string, status: FindingStatus) => Promise<void>;
  onDelete?: (findingId: string) => Promise<void>;
}

const severityIcons: Record<FindingSeverity, typeof AlertTriangle> = {
  critical: AlertTriangle,
  high: AlertCircle,
  medium: AlertCircle,
  low: Info,
  informational: Info,
};

const severityColors: Record<FindingSeverity, string> = {
  critical: 'text-error bg-error/10',
  high: 'text-orange-500 bg-orange-500/10',
  medium: 'text-yellow-500 bg-yellow-500/10',
  low: 'text-blue-500 bg-blue-500/10',
  informational: 'text-muted-foreground bg-muted',
};

export function FindingCard({
  finding,
  testId,
  variant = 'default',
  showActions = false,
  onStatusChange,
  onDelete,
}: FindingCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const SeverityIcon = severityIcons[finding.severity];
  const severityColor = severityColors[finding.severity];

  const isOverdue =
    finding.remediation_deadline &&
    isPast(new Date(finding.remediation_deadline)) &&
    !['remediated', 'verified', 'risk_accepted', 'false_positive'].includes(finding.status);

  const getStatusBadgeStyle = (status: FindingStatus) => {
    switch (status) {
      case 'open':
        return 'bg-error/10 text-error';
      case 'in_remediation':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'remediated':
        return 'bg-blue-500/10 text-blue-600';
      case 'verified':
        return 'bg-success/10 text-success';
      case 'risk_accepted':
        return 'bg-purple-500/10 text-purple-600';
      case 'false_positive':
        return 'bg-muted text-muted-foreground';
      case 'deferred':
        return 'bg-muted text-muted-foreground';
      default:
        return '';
    }
  };

  // Compact variant for tables/lists
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors',
          isOverdue && 'border-error/50'
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', severityColor)}>
            <SeverityIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{finding.title}</p>
            <p className="text-xs text-muted-foreground">
              {finding.finding_ref}
              {finding.cvss_score && ` · CVSS ${finding.cvss_score.toFixed(1)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isOverdue && (
            <Badge variant="destructive" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              Overdue
            </Badge>
          )}
          <Badge variant="secondary" className={cn('text-xs', severityColor)}>
            {getFindingSeverityLabel(finding.severity)}
          </Badge>
          <Badge variant="secondary" className={cn('text-xs capitalize', getStatusBadgeStyle(finding.status))}>
            {getFindingStatusLabel(finding.status)}
          </Badge>
        </div>
      </div>
    );
  }

  // Default expandable card variant
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(isOverdue && 'border-error/50')}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', severityColor)}>
                <SeverityIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="secondary" className={cn('text-xs', severityColor)}>
                    {getFindingSeverityLabel(finding.severity)}
                  </Badge>
                  <Badge variant="secondary" className={cn('text-xs capitalize', getStatusBadgeStyle(finding.status))}>
                    {getFindingStatusLabel(finding.status)}
                  </Badge>
                  {finding.cvss_score && (
                    <Badge variant="outline" className="text-xs">
                      CVSS {finding.cvss_score.toFixed(1)}
                    </Badge>
                  )}
                  {isOverdue && (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      Overdue
                    </Badge>
                  )}
                </div>
                {testId ? (
                  <Link
                    href={`/testing/tests/${testId}/findings/${finding.id}`}
                    className="hover:underline"
                  >
                    <h3 className="font-semibold">{finding.title}</h3>
                  </Link>
                ) : (
                  <h3 className="font-semibold">{finding.title}</h3>
                )}
                <p className="text-sm text-muted-foreground">{finding.finding_ref}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {testId && (
                      <DropdownMenuItem asChild>
                        <Link href={`/testing/tests/${testId}/findings/${finding.id}`}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href={`/testing/tests/${testId}/findings/${finding.id}/edit`}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Finding
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {finding.status === 'open' && onStatusChange && (
                      <DropdownMenuItem onClick={() => onStatusChange(finding.id, 'in_remediation')}>
                        <Clock className="h-4 w-4 mr-2" />
                        Start Remediation
                      </DropdownMenuItem>
                    )}
                    {finding.status === 'in_remediation' && onStatusChange && (
                      <DropdownMenuItem onClick={() => onStatusChange(finding.id, 'remediated')}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Remediated
                      </DropdownMenuItem>
                    )}
                    {finding.status === 'remediated' && onStatusChange && (
                      <DropdownMenuItem onClick={() => onStatusChange(finding.id, 'verified')}>
                        <Shield className="h-4 w-4 mr-2" />
                        Verify Fix
                      </DropdownMenuItem>
                    )}
                    {!['verified', 'risk_accepted', 'false_positive'].includes(finding.status) && onStatusChange && (
                      <>
                        <DropdownMenuItem onClick={() => onStatusChange(finding.id, 'risk_accepted')}>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Accept Risk
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(finding.id, 'false_positive')}>
                          <XCircle className="h-4 w-4 mr-2" />
                          False Positive
                        </DropdownMenuItem>
                      </>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-error focus:text-error"
                          onClick={() => onDelete(finding.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Description */}
            {finding.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {finding.description}
                </p>
              </div>
            )}

            {/* Affected Systems */}
            {finding.affected_systems && finding.affected_systems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Affected Systems</h4>
                <div className="flex flex-wrap gap-1">
                  {finding.affected_systems.map((system, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {system}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* CVE/CWE IDs */}
            {((finding.cve_ids && finding.cve_ids.length > 0) || (finding.cwe_ids && finding.cwe_ids.length > 0)) && (
              <div className="flex gap-6">
                {finding.cve_ids && finding.cve_ids.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">CVE IDs</h4>
                    <div className="flex flex-wrap gap-1">
                      {finding.cve_ids.map((cve, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-mono">
                          {cve}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {finding.cwe_ids && finding.cwe_ids.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">CWE IDs</h4>
                    <div className="flex flex-wrap gap-1">
                      {finding.cwe_ids.map((cwe, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-mono">
                          {cwe}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recommendation */}
            {finding.recommendation && (
              <div>
                <h4 className="text-sm font-medium mb-1">Recommendation</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {finding.recommendation}
                </p>
              </div>
            )}

            {/* Remediation Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t">
              {finding.remediation_deadline && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                  <div className={cn('flex items-center gap-1.5 text-sm', isOverdue && 'text-error')}>
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(finding.remediation_deadline), 'MMM d, yyyy')}
                  </div>
                </div>
              )}
              {finding.remediation_owner && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Owner</p>
                  <div className="flex items-center gap-1.5 text-sm">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {finding.remediation_owner}
                  </div>
                </div>
              )}
              {finding.remediation_date && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Remediated</p>
                  <div className="flex items-center gap-1.5 text-sm text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {format(new Date(finding.remediation_date), 'MMM d, yyyy')}
                  </div>
                </div>
              )}
              {finding.verified_date && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Verified</p>
                  <div className="flex items-center gap-1.5 text-sm text-success">
                    <Shield className="h-3.5 w-3.5" />
                    {format(new Date(finding.verified_date), 'MMM d, yyyy')}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
