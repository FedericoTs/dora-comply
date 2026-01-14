/**
 * Exceptions Tab Content Component
 *
 * Displays SOC 2 control exceptions with impact levels.
 */

import { CheckCircle2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ParsedException } from '@/lib/soc2/soc2-types';
import { getImpactBadgeProps } from '@/lib/soc2/soc2-types';

interface ExceptionsTabContentProps {
  exceptions: ParsedException[];
}

export function ExceptionsTabContent({ exceptions }: ExceptionsTabContentProps) {
  if (exceptions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
          <p className="text-lg font-medium">No Exceptions Found</p>
          <p className="text-sm text-muted-foreground">
            All tested controls are operating effectively
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {exceptions.map((exception, idx) => {
        const impactProps = getImpactBadgeProps(exception.impact);

        return (
          <Card
            key={idx}
            className={cn(
              'border-l-4',
              exception.impact === 'high'
                ? 'border-l-destructive'
                : exception.impact === 'medium'
                  ? 'border-l-warning'
                  : 'border-l-muted-foreground'
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="font-mono">{exception.controlId}</span>
                  {exception.controlArea && (
                    <span className="text-muted-foreground font-normal">
                      - {exception.controlArea}
                    </span>
                  )}
                </CardTitle>
                <Badge variant={impactProps.variant} className={impactProps.className}>
                  {exception.impact} impact
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                  Exception Description
                </p>
                <p className="text-sm">{exception.exceptionDescription}</p>
              </div>
              {exception.managementResponse && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Management Response
                  </p>
                  <p className="text-sm text-muted-foreground">{exception.managementResponse}</p>
                </div>
              )}
              {exception.remediationDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Remediation: {new Date(exception.remediationDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
