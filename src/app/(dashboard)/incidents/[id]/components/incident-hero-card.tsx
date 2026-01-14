/**
 * Incident Hero Card Component
 *
 * Main hero display for incident with classification badge and key info
 */

import Link from 'next/link';
import { Calendar, Clock, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getClassificationLabel, getIncidentTypeLabel, getReportTypeLabel } from '@/lib/incidents/types';
import { DeadlineBadgeStatic } from '@/components/incidents/deadline-badge';
import { ClassificationIconDisplay } from './classification-icon-display';
import { getClassificationStyles } from './utils';
import type { IncidentData, NextReportInfo } from './types';

interface IncidentHeroCardProps {
  incident: IncidentData;
  detectionDate: Date;
  nextReport: NextReportInfo | null;
}

export function IncidentHeroCard({ incident, detectionDate, nextReport }: IncidentHeroCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Classification Badge */}
          <div
            className={cn(
              'flex h-16 w-16 shrink-0 items-center justify-center rounded-full',
              incident.classification === 'major'
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : incident.classification === 'significant'
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            )}
          >
            <ClassificationIconDisplay classification={incident.classification} className="h-8 w-8" />
          </div>

          {/* Main Info */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={cn('text-sm', getClassificationStyles(incident.classification))}
              >
                {getClassificationLabel(incident.classification)}
              </Badge>
              <Badge variant="outline">{getIncidentTypeLabel(incident.incident_type)}</Badge>
              {incident.data_breach && <Badge variant="destructive">Data Breach</Badge>}
            </div>

            {incident.description && (
              <p className="text-muted-foreground">{incident.description}</p>
            )}

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Detected:{' '}
                  {detectionDate.toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {incident.vendor && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Link
                    href={`/vendors/${incident.vendor.id}`}
                    className="text-primary hover:underline"
                  >
                    {incident.vendor.name}
                  </Link>
                </div>
              )}
              {incident.duration_hours && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{incident.duration_hours}h duration</span>
                </div>
              )}
            </div>
          </div>

          {/* Next Deadline */}
          {nextReport && (
            <div className="lg:text-right">
              <p className="text-xs text-muted-foreground mb-1">Next Deadline</p>
              <DeadlineBadgeStatic deadline={nextReport.deadline} />
              <p className="text-xs text-muted-foreground mt-1">
                {getReportTypeLabel(nextReport.type as 'initial' | 'intermediate' | 'final')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
