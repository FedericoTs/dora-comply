/**
 * Reports Tab Component
 *
 * Displays regulatory reports for an incident
 */

import Link from 'next/link';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getReportTypeLabel } from '@/lib/incidents/types';
import type { IncidentData, ReportData, NextReportInfo } from './types';

interface ReportsTabProps {
  incidentId: string;
  incident: IncidentData;
  reports: ReportData;
  nextReport: NextReportInfo | null;
}

export function ReportsTab({ incidentId, incident, reports, nextReport }: ReportsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Regulatory Reports</h3>
        {nextReport && (
          <Button size="sm" asChild>
            <Link href={`/incidents/${incidentId}/reports/new?type=${nextReport.type}`}>
              <Plus className="mr-2 h-4 w-4" />
              Create Report
            </Link>
          </Button>
        )}
      </div>

      {reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium">No Reports Yet</h3>
            <p className="text-sm text-muted-foreground text-center mt-1 max-w-sm">
              {incident.classification === 'major'
                ? 'Major incidents require initial, intermediate, and final reports.'
                : 'Minor incidents do not require regulatory reporting.'}
            </p>
            {nextReport && (
              <Button className="mt-4" asChild>
                <Link href={`/incidents/${incidentId}/reports/new?type=${nextReport.type}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create {getReportTypeLabel(nextReport.type as 'initial' | 'intermediate' | 'final')}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {getReportTypeLabel(report.report_type)}
                  </CardTitle>
                  <Badge
                    variant={
                      report.status === 'submitted' || report.status === 'acknowledged'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {report.status}
                  </Badge>
                </div>
                <CardDescription>Version {report.version}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline</span>
                    <span>{new Date(report.deadline).toLocaleDateString('en-GB')}</span>
                  </div>
                  {report.submitted_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Submitted</span>
                      <span>
                        {new Date(report.submitted_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
