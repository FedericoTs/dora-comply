/**
 * TLPT Info Card Component
 *
 * Main information display for TLPT engagements
 */

import Link from 'next/link';
import {
  Target,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getTLPTFrameworkLabel,
  getTLPTStatusLabel,
  getTLPTComplianceStatus,
  getDaysUntilDue,
} from '@/lib/testing/types';
import type { TLPTComponentProps } from './types';

export function TLPTInfoCard({ tlpt }: TLPTComponentProps) {
  const complianceStatus = getTLPTComplianceStatus(tlpt.next_tlpt_due);
  const daysUntil = getDaysUntilDue(tlpt.next_tlpt_due);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {tlpt.name}
            </CardTitle>
            <CardDescription className="font-mono">{tlpt.tlpt_ref}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getTLPTFrameworkLabel(tlpt.framework)}</Badge>
            <Badge
              variant={
                tlpt.status === 'completed'
                  ? 'default'
                  : tlpt.status === 'planning'
                  ? 'outline'
                  : 'secondary'
              }
            >
              {getTLPTStatusLabel(tlpt.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compliance Status */}
        <div
          className={`p-4 rounded-lg ${
            complianceStatus === 'overdue'
              ? 'bg-destructive/10 border border-destructive/30'
              : complianceStatus === 'due_soon'
              ? 'bg-orange-500/10 border border-orange-500/30'
              : complianceStatus === 'compliant'
              ? 'bg-primary/10 border border-primary/30'
              : 'bg-muted'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {complianceStatus === 'overdue' ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : complianceStatus === 'due_soon' ? (
                <Clock className="h-5 w-5 text-orange-500" />
              ) : complianceStatus === 'compliant' ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Calendar className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-medium">
                {complianceStatus === 'overdue'
                  ? 'Overdue'
                  : complianceStatus === 'due_soon'
                  ? 'Due Soon'
                  : complianceStatus === 'compliant'
                  ? 'Compliant'
                  : 'Not Scheduled'}
              </span>
            </div>
            {daysUntil !== null && (
              <span
                className={`text-sm ${
                  daysUntil < 0
                    ? 'text-destructive'
                    : daysUntil < 180
                    ? 'text-orange-500'
                    : 'text-muted-foreground'
                }`}
              >
                {daysUntil < 0
                  ? `${Math.abs(daysUntil)} days overdue`
                  : `${daysUntil} days remaining`}
              </span>
            )}
          </div>
          {tlpt.next_tlpt_due && (
            <p className="text-sm text-muted-foreground mt-2">
              Next TLPT due: {new Date(tlpt.next_tlpt_due).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Key Dates */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Last TLPT</p>
            <p className="text-sm flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {tlpt.last_tlpt_date
                ? new Date(tlpt.last_tlpt_date).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Scenarios Tested</p>
            <p className="text-sm font-medium">{tlpt.scenarios_tested || 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
            <p className="text-sm font-medium">
              {tlpt.scenarios_tested > 0
                ? `${Math.round((tlpt.scenarios_successful / tlpt.scenarios_tested) * 100)}%`
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Findings</p>
            <p className="text-sm font-medium flex items-center gap-1">
              {tlpt.findings_count || 0}
              {tlpt.critical_findings_count > 0 && (
                <Badge variant="destructive" className="text-xs ml-1">
                  {tlpt.critical_findings_count} critical
                </Badge>
              )}
            </p>
          </div>
        </div>

        {/* Programme Link */}
        {tlpt.programme && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-1">Programme</p>
            <Link
              href={`/testing/programmes/${tlpt.programme.id}`}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <FileText className="h-3.5 w-3.5" />
              {tlpt.programme.name}
            </Link>
          </div>
        )}

        {/* Scope */}
        {(tlpt.scope_systems?.length > 0 || tlpt.scope_critical_functions?.length > 0) && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Scope</h4>
            {tlpt.scope_systems && tlpt.scope_systems.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">Systems in Scope</p>
                <div className="flex flex-wrap gap-1">
                  {tlpt.scope_systems.map((sys) => (
                    <Badge key={sys} variant="outline" className="text-xs">
                      {sys}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {tlpt.scope_critical_functions && tlpt.scope_critical_functions.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Critical Functions</p>
                <div className="flex flex-wrap gap-1">
                  {tlpt.scope_critical_functions.map((func) => (
                    <Badge key={func} variant="secondary" className="text-xs">
                      {func}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
