/**
 * SOC 2 Executive Summary Component
 *
 * Header section with report info and key metrics.
 */

import { Shield, Building2, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MaturityLevelBadge } from '@/components/compliance';
import type { OpinionType } from '@/lib/soc2/soc2-types';
import { OPINION_CONFIG } from '@/lib/soc2/soc2-types';
import type { DORAComplianceResult } from '@/lib/compliance/dora-types';

interface Soc2ExecutiveSummaryProps {
  reportType: 'type1' | 'type2';
  opinion: OpinionType;
  filename: string;
  vendor: { id: string; name: string } | null;
  periodStart: string;
  periodEnd: string;
  criteria: string[];
  doraCompliance: DORAComplianceResult;
  exceptionsCount: number;
  subserviceOrgsCount: number;
}

export function Soc2ExecutiveSummary({
  reportType,
  opinion,
  filename,
  vendor,
  periodStart,
  periodEnd,
  criteria,
  doraCompliance,
  exceptionsCount,
  subserviceOrgsCount,
}: Soc2ExecutiveSummaryProps) {
  const opinionConfig = OPINION_CONFIG[opinion];
  const OpinionIcon = opinionConfig.icon;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-background via-background to-muted/30 p-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-info/5 rounded-full translate-y-24 -translate-x-24" />

      <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* Left: Report Info */}
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary/10 p-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                SOC 2 Type {reportType === 'type2' ? 'II' : 'I'} Analysis
              </h1>
              <Badge className={cn(opinionConfig.color, 'gap-1')}>
                <OpinionIcon className="h-3 w-3" />
                {opinionConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-xl">{filename}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {vendor && (
                <Badge variant="outline" className="gap-1">
                  <Building2 className="h-3 w-3" />
                  {vendor.name}
                </Badge>
              )}
              <Badge variant="secondary" className="gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(periodStart).toLocaleDateString()} -{' '}
                {new Date(periodEnd).toLocaleDateString()}
              </Badge>
              {criteria?.map((c) => (
                <Badge key={c} variant="secondary" className="capitalize">
                  {c.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 lg:gap-6">
          <div className="text-center">
            <MaturityLevelBadge
              level={doraCompliance.overallMaturity}
              size="lg"
              showDescription
            />
            <div className="text-xs text-muted-foreground mt-1">DORA Readiness</div>
          </div>
          <div className="text-center">
            <div
              className={cn(
                'text-3xl font-bold',
                doraCompliance.overallPercentage >= 70
                  ? 'text-success'
                  : doraCompliance.overallPercentage >= 40
                    ? 'text-warning'
                    : 'text-destructive'
              )}
            >
              {doraCompliance.overallPercentage}%
            </div>
            <div className="text-xs text-muted-foreground">DORA Coverage</div>
          </div>
          <div className="text-center">
            <div
              className={cn(
                'text-3xl font-bold',
                doraCompliance.criticalGaps.length > 0 ? 'text-destructive' : 'text-success'
              )}
            >
              {doraCompliance.criticalGaps.length}
            </div>
            <div className="text-xs text-muted-foreground">Critical Gaps</div>
          </div>
          <div className="text-center">
            <div
              className={cn(
                'text-3xl font-bold',
                exceptionsCount > 0 ? 'text-warning' : 'text-muted-foreground'
              )}
            >
              {exceptionsCount}
            </div>
            <div className="text-xs text-muted-foreground">Exceptions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-info">{subserviceOrgsCount}</div>
            <div className="text-xs text-muted-foreground">4th Parties</div>
          </div>
        </div>
      </div>
    </div>
  );
}
