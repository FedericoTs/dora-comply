/**
 * Subservice Organizations Tab Content Component
 *
 * Displays fourth-party service organizations with DORA implications.
 */

import { Network, Building2, Info, AlertTriangle, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ParsedSubserviceOrg } from '@/lib/soc2/soc2-types';

interface SubserviceOrgsTabContentProps {
  subserviceOrgs: ParsedSubserviceOrg[];
}

export function SubserviceOrgsTabContent({ subserviceOrgs }: SubserviceOrgsTabContentProps) {
  if (subserviceOrgs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No Subservice Organizations</p>
          <p className="text-sm text-muted-foreground">
            This service organization manages all services in-house
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-info/5 border-info/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-info mt-0.5" />
            <div>
              <p className="font-medium text-info">Fourth-Party Risk (DORA Art. 28)</p>
              <p className="text-sm text-muted-foreground mt-1">
                DORA requires financial entities to monitor ICT service provider supply chains.
                Subservice organizations listed here may require additional due diligence.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {subserviceOrgs.map((org, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-info" />
                  {org.name}
                </CardTitle>
                <Badge
                  variant={org.inclusionMethod === 'carve_out' ? 'outline' : 'secondary'}
                  className={org.inclusionMethod === 'carve_out' ? 'border-warning text-warning' : ''}
                >
                  {org.inclusionMethod === 'carve_out' ? 'Carved Out' : 'Inclusive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{org.serviceDescription}</p>
              {org.controlsSupported && org.controlsSupported.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Controls Supported
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {org.controlsSupported.slice(0, 5).map((c) => (
                      <Badge key={c} variant="outline" className="font-mono">
                        {c}
                      </Badge>
                    ))}
                    {org.controlsSupported.length > 5 && (
                      <Badge variant="outline">+{org.controlsSupported.length - 5} more</Badge>
                    )}
                  </div>
                </div>
              )}
              {org.hasOwnSoc2 && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <Award className="h-4 w-4" />
                  Has own SOC 2 report
                </div>
              )}
              {org.inclusionMethod === 'carve_out' && (
                <div className="flex items-center gap-2 text-sm text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Carved out - requires separate assurance
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
