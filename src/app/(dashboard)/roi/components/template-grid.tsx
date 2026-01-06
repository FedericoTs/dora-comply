'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoiTemplateId } from '@/lib/roi/types';
import type { RoiStats } from '@/lib/roi/queries';

interface TemplateGridProps {
  templates: RoiStats[];
}

// Template groupings
const TEMPLATE_GROUPS: Record<string, RoiTemplateId[]> = {
  entity: ['B_01.01', 'B_01.02', 'B_01.03'],
  contracts: ['B_02.01', 'B_02.02', 'B_02.03', 'B_03.01', 'B_03.02', 'B_03.03'],
  services: ['B_04.01', 'B_05.01', 'B_05.02'],
  functions: ['B_06.01', 'B_07.01'],
};

const GROUP_TITLES: Record<string, string> = {
  entity: 'Entity Information',
  contracts: 'Contractual Arrangements',
  services: 'ICT Services & Providers',
  functions: 'Functions & Exit Plans',
};

export function TemplateGrid({ templates }: TemplateGridProps) {
  const templateMap = new Map(templates.map(t => [t.templateId, t]));

  return (
    <div className="space-y-8">
      {Object.entries(TEMPLATE_GROUPS).map(([group, templateIds]) => (
        <div key={group} className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {GROUP_TITLES[group]}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templateIds.map(id => {
              const template = templateMap.get(id);
              if (!template) return null;

              return (
                <TemplateCard key={id} template={template} />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

interface TemplateCardProps {
  template: RoiStats;
}

function TemplateCard({ template }: TemplateCardProps) {
  const statusColor = template.hasData
    ? template.completeness >= 80
      ? 'bg-green-500'
      : template.completeness >= 50
        ? 'bg-yellow-500'
        : 'bg-red-500'
    : 'bg-gray-300';

  const StatusIcon = template.hasData
    ? template.completeness >= 80
      ? CheckCircle2
      : AlertCircle
    : FileSpreadsheet;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('h-2 w-2 rounded-full', statusColor)} />
            <CardTitle className="text-base">{template.templateId}</CardTitle>
          </div>
          <StatusIcon className={cn(
            'h-4 w-4',
            template.hasData
              ? template.completeness >= 80
                ? 'text-green-600'
                : 'text-yellow-600'
              : 'text-muted-foreground'
          )} />
        </div>
        <CardDescription className="line-clamp-1">
          {template.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Records</span>
          <Badge variant={template.hasData ? 'default' : 'secondary'}>
            {template.rowCount}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completeness</span>
            <span className={cn(
              'font-medium',
              template.completeness >= 80 ? 'text-green-600' :
              template.completeness >= 50 ? 'text-yellow-600' :
              'text-red-600'
            )}>
              {template.completeness}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                template.completeness >= 80 ? 'bg-green-600' :
                template.completeness >= 50 ? 'bg-yellow-600' :
                'bg-red-600'
              )}
              style={{ width: `${template.completeness}%` }}
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between group-hover:bg-secondary"
          asChild
        >
          <Link href={`/roi/${template.templateId.toLowerCase().replace('.', '_')}`}>
            View Details
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
