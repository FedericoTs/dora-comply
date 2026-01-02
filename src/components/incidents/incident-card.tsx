import Link from 'next/link';
import {
  AlertTriangle,
  Shield,
  Info,
  Server,
  User,
  Bug,
  Cloud,
  HelpCircle,
  Calendar,
  Building2,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  type IncidentListItem,
  type IncidentClassification,
  type IncidentType,
  type IncidentStatus,
  getClassificationLabel,
  getStatusLabel,
  getIncidentTypeLabel,
} from '@/lib/incidents/types';
import { DeadlineBadgeStatic } from './deadline-badge';

interface IncidentCardProps {
  incident: IncidentListItem;
  className?: string;
}

function getClassificationIcon(classification: IncidentClassification) {
  switch (classification) {
    case 'major':
      return <AlertTriangle className="h-4 w-4" />;
    case 'significant':
      return <Shield className="h-4 w-4" />;
    case 'minor':
      return <Info className="h-4 w-4" />;
  }
}

function getClassificationStyles(classification: IncidentClassification) {
  switch (classification) {
    case 'major':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400';
    case 'significant':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400';
    case 'minor':
      return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/30 dark:text-slate-400';
  }
}

function getTypeIcon(type: IncidentType) {
  switch (type) {
    case 'cyber_attack':
      return <Bug className="h-3.5 w-3.5" />;
    case 'system_failure':
      return <Server className="h-3.5 w-3.5" />;
    case 'human_error':
      return <User className="h-3.5 w-3.5" />;
    case 'third_party_failure':
      return <Cloud className="h-3.5 w-3.5" />;
    case 'natural_disaster':
      return <AlertTriangle className="h-3.5 w-3.5" />;
    case 'other':
      return <HelpCircle className="h-3.5 w-3.5" />;
  }
}

function getStatusStyles(status: IncidentStatus) {
  switch (status) {
    case 'draft':
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    case 'detected':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'initial_submitted':
    case 'intermediate_submitted':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'final_submitted':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'closed':
      return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500';
  }
}

export function IncidentCard({ incident, className }: IncidentCardProps) {
  const detectionDate = new Date(incident.detection_datetime);
  const formattedDate = detectionDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link href={`/incidents/${incident.id}`}>
      <Card
        className={cn(
          'group transition-all hover:shadow-md hover:border-primary/50 cursor-pointer',
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {incident.incident_ref}
                </span>
                <Badge
                  variant="outline"
                  className={cn('text-xs', getStatusStyles(incident.status))}
                >
                  {getStatusLabel(incident.status)}
                </Badge>
              </div>
              <h3 className="font-medium leading-tight group-hover:text-primary transition-colors truncate">
                {incident.title}
              </h3>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 gap-1',
                getClassificationStyles(incident.classification)
              )}
            >
              {getClassificationIcon(incident.classification)}
              {getClassificationLabel(incident.classification)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              {getTypeIcon(incident.incident_type)}
              <span>{getIncidentTypeLabel(incident.incident_type)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
            {incident.vendor_name && (
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                <span className="truncate max-w-[150px]">{incident.vendor_name}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>{incident.reports_count} report{incident.reports_count !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {incident.next_deadline && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Next deadline:</span>
                <DeadlineBadgeStatic deadline={incident.next_deadline} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// Compact version for dashboard widget
export function IncidentCardCompact({
  incident,
  className,
}: IncidentCardProps) {
  return (
    <Link href={`/incidents/${incident.id}`}>
      <div
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors',
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              incident.classification === 'major'
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : incident.classification === 'significant'
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            )}
          >
            {getClassificationIcon(incident.classification)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{incident.title}</p>
            <p className="text-xs text-muted-foreground">
              {incident.incident_ref} · {getStatusLabel(incident.status)}
            </p>
          </div>
        </div>
        {incident.next_deadline && (
          <DeadlineBadgeStatic deadline={incident.next_deadline} className="shrink-0" />
        )}
      </div>
    </Link>
  );
}
