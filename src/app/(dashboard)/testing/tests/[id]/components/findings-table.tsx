/**
 * Findings Table Component
 *
 * Displays test findings in a table format
 */

import Link from 'next/link';
import { Bug, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getFindingSeverityLabel,
  getFindingStatusLabel,
} from '@/lib/testing/types';
import type { FindingsTableProps } from './types';

export function FindingsTable({ findings, testId }: FindingsTableProps) {
  if (findings.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bug className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No Findings</CardTitle>
          <CardDescription>
            No issues were found during this test, or findings haven&apos;t been recorded yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button asChild>
            <Link href={`/testing/tests/${testId}/findings/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Finding
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Group findings by severity for summary
  const severityCounts = findings.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Findings
            </CardTitle>
            <CardDescription>
              {findings.length} finding{findings.length !== 1 ? 's' : ''} recorded
            </CardDescription>
          </div>
          <Button size="sm" asChild>
            <Link href={`/testing/tests/${testId}/findings/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Finding
            </Link>
          </Button>
        </div>
        {/* Severity summary */}
        <div className="flex gap-2 pt-2">
          {severityCounts.critical && (
            <Badge variant="destructive">{severityCounts.critical} Critical</Badge>
          )}
          {severityCounts.high && (
            <Badge className="bg-orange-500">{severityCounts.high} High</Badge>
          )}
          {severityCounts.medium && (
            <Badge className="bg-yellow-500 text-black">{severityCounts.medium} Medium</Badge>
          )}
          {severityCounts.low && (
            <Badge variant="secondary">{severityCounts.low} Low</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {findings.map((finding) => {
              const isOverdue =
                finding.status !== 'remediated' &&
                finding.status !== 'risk_accepted' &&
                finding.remediation_deadline &&
                new Date(finding.remediation_deadline) < new Date();

              return (
                <TableRow key={finding.id}>
                  <TableCell className="font-mono text-sm">{finding.finding_ref}</TableCell>
                  <TableCell>
                    <span className="font-medium">{finding.title}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        finding.severity === 'critical'
                          ? 'destructive'
                          : finding.severity === 'high'
                          ? 'default'
                          : 'secondary'
                      }
                      className={
                        finding.severity === 'high'
                          ? 'bg-orange-500'
                          : finding.severity === 'medium'
                          ? 'bg-yellow-500 text-black'
                          : ''
                      }
                    >
                      {getFindingSeverityLabel(finding.severity)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        finding.status === 'remediated'
                          ? 'default'
                          : finding.status === 'in_remediation'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {getFindingStatusLabel(finding.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {finding.remediation_deadline ? (
                      <div className="flex items-center gap-1">
                        <Clock className={`h-3.5 w-3.5 ${isOverdue ? 'text-destructive' : ''}`} />
                        <span className={isOverdue ? 'text-destructive' : ''}>
                          {new Date(finding.remediation_deadline).toLocaleDateString()}
                        </span>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs ml-1">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/testing/tests/${testId}/findings/${finding.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
