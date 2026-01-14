/**
 * Analysis & Response Card Component
 *
 * Displays root cause, remediation actions, and lessons learned
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { IncidentData } from './types';

interface AnalysisResponseCardProps {
  incident: IncidentData;
}

export function AnalysisResponseCard({ incident }: AnalysisResponseCardProps) {
  if (!incident.root_cause && !incident.remediation_actions && !incident.lessons_learned) {
    return null;
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Analysis & Response</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {incident.root_cause && (
          <div>
            <p className="text-sm font-medium mb-1">Root Cause</p>
            <p className="text-sm text-muted-foreground">{incident.root_cause}</p>
          </div>
        )}
        {incident.remediation_actions && (
          <div>
            <p className="text-sm font-medium mb-1">Remediation Actions</p>
            <p className="text-sm text-muted-foreground">
              {incident.remediation_actions}
            </p>
          </div>
        )}
        {incident.lessons_learned && (
          <div>
            <p className="text-sm font-medium mb-1">Lessons Learned</p>
            <p className="text-sm text-muted-foreground">{incident.lessons_learned}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
