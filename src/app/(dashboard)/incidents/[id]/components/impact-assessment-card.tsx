/**
 * Impact Assessment Card Component
 *
 * Displays impact metrics for an incident
 */

import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { IncidentData } from './types';

interface ImpactAssessmentCardProps {
  incident: IncidentData;
}

export function ImpactAssessmentCard({ incident }: ImpactAssessmentCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Impact Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {incident.clients_affected_count !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Clients Affected</span>
            <span className="font-medium">
              {incident.clients_affected_count.toLocaleString()}
              {incident.clients_affected_percentage !== null &&
                ` (${incident.clients_affected_percentage}%)`}
            </span>
          </div>
        )}
        {incident.transactions_affected_count !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transactions</span>
            <span className="font-medium">
              {incident.transactions_affected_count.toLocaleString()}
            </span>
          </div>
        )}
        {incident.transactions_value_affected !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Value Affected</span>
            <span className="font-medium">
              €{incident.transactions_value_affected.toLocaleString()}
            </span>
          </div>
        )}
        {incident.economic_impact !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Economic Impact</span>
            <span className="font-medium">
              €{incident.economic_impact.toLocaleString()}
            </span>
          </div>
        )}
        {incident.data_breach && incident.data_records_affected !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Data Records</span>
            <span className="font-medium text-destructive">
              {incident.data_records_affected.toLocaleString()}
            </span>
          </div>
        )}
        {incident.reputational_impact && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Reputational</span>
            <Badge variant="outline" className="capitalize">
              {incident.reputational_impact}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
