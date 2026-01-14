/**
 * Affected Systems Card Component
 *
 * Displays services, critical functions, and geographic spread
 */

import { Activity, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { IncidentData } from './types';

interface AffectedSystemsCardProps {
  incident: IncidentData;
}

export function AffectedSystemsCard({ incident }: AffectedSystemsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Affected Systems
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {incident.services_affected.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Services</p>
            <div className="flex flex-wrap gap-1">
              {incident.services_affected.map((service) => (
                <Badge key={service} variant="secondary">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {incident.critical_functions_affected.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Critical Functions</p>
            <div className="flex flex-wrap gap-1">
              {incident.critical_functions_affected.map((fn) => (
                <Badge key={fn} variant="outline" className="border-amber-500">
                  {fn}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {incident.geographic_spread.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Geographic Spread</p>
            <div className="flex flex-wrap gap-1">
              {incident.geographic_spread.map((region) => (
                <Badge key={region} variant="outline">
                  <Globe className="h-3 w-3 mr-1" />
                  {region}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
