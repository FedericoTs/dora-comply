/**
 * Incidents Page
 *
 * ICT incident reporting and management for DORA compliance
 */

import { AlertTriangle, Clock, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Incidents | DORA Comply',
  description: 'ICT incident reporting and management',
};

export default function IncidentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Incident Management</h1>
          <p className="text-muted-foreground">
            Track and report ICT-related incidents per DORA Article 19
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Report Incident
        </Button>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Incident Reporting Coming Soon</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            The incident management module will enable you to report, track, and manage
            ICT-related incidents in compliance with DORA requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Incident Reports</p>
                <p className="text-xs text-muted-foreground">
                  Create and submit regulatory reports
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Timeline Tracking</p>
                <p className="text-xs text-muted-foreground">
                  Monitor notification deadlines
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Impact Assessment</p>
                <p className="text-xs text-muted-foreground">
                  Classify incident severity
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
