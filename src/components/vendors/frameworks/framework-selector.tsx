'use client';

/**
 * Framework Selector Component
 *
 * Displays 4 clickable cards for selecting a compliance framework.
 * Shows framework name, icon, compliance score, and status.
 */

import { Shield, Layers, FileText, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FrameworkCode, ComplianceStatus } from '@/lib/compliance/framework-types';

interface FrameworkSelectorProps {
  selectedFramework: FrameworkCode;
  complianceScores: Record<FrameworkCode, number>;
  complianceStatuses: Record<FrameworkCode, ComplianceStatus>;
  onSelect: (framework: FrameworkCode) => void;
}

const FRAMEWORK_CONFIG: Record<
  FrameworkCode,
  {
    name: string;
    shortName: string;
    icon: typeof Shield;
    description: string;
  }
> = {
  dora: {
    name: 'DORA',
    shortName: 'DORA',
    icon: Shield,
    description: 'Digital Operational Resilience Act',
  },
  nis2: {
    name: 'NIS2 Directive',
    shortName: 'NIS2',
    icon: Layers,
    description: 'Network & Information Security',
  },
  gdpr: {
    name: 'GDPR Art. 32',
    shortName: 'GDPR',
    icon: FileText,
    description: 'Data Protection Security',
  },
  iso27001: {
    name: 'ISO 27001',
    shortName: 'ISO',
    icon: Target,
    description: 'Information Security Management',
  },
};

const STATUS_STYLES: Record<ComplianceStatus, { bg: string; text: string; label: string }> = {
  compliant: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'Compliant' },
  partially_compliant: { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'Partial' },
  non_compliant: { bg: 'bg-red-500/10', text: 'text-red-600', label: 'Gaps' },
  not_assessed: { bg: 'bg-slate-500/10', text: 'text-slate-500', label: 'Not Assessed' },
  not_applicable: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'N/A' },
};

export function FrameworkSelector({
  selectedFramework,
  complianceScores,
  complianceStatuses,
  onSelect,
}: FrameworkSelectorProps) {
  const frameworks: FrameworkCode[] = ['dora', 'nis2', 'gdpr', 'iso27001'];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {frameworks.map((framework) => {
        const config = FRAMEWORK_CONFIG[framework];
        const Icon = config.icon;
        const score = complianceScores[framework] ?? 0;
        const status = complianceStatuses[framework] ?? 'not_assessed';
        const statusStyle = STATUS_STYLES[status];
        const isSelected = selectedFramework === framework;

        return (
          <Card
            key={framework}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              isSelected && 'ring-2 ring-primary shadow-md'
            )}
            onClick={() => onSelect(framework)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className={cn('text-xs', statusStyle.bg, statusStyle.text)}
                >
                  {statusStyle.label}
                </Badge>
              </div>

              <div className="mt-3">
                <p className="font-semibold">{config.name}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{score}</span>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      score >= 80 && 'bg-emerald-500',
                      score >= 60 && score < 80 && 'bg-amber-500',
                      score < 60 && 'bg-red-500'
                    )}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export { FRAMEWORK_CONFIG, STATUS_STYLES };
