'use client';

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Bell,
  Activity,
  Users,
  Share2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
  MaturitySnapshot,
  TrendAnalysis,
  DORAPllar,
} from '@/lib/compliance/maturity-history-types';

interface PillarProgressCardsProps {
  latestSnapshot: MaturitySnapshot | undefined;
  trends: TrendAnalysis | null;
}

interface PillarInfo {
  key: DORAPllar;
  label: string;
  snapshotKey: keyof MaturitySnapshot;
  percentKey: keyof MaturitySnapshot;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const PILLARS: PillarInfo[] = [
  {
    key: 'ict_risk_management',
    label: 'ICT Risk Management',
    snapshotKey: 'pillar_ict_risk_mgmt',
    percentKey: 'pillar_ict_risk_mgmt_percent',
    icon: <Shield className="h-5 w-5" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    key: 'incident_reporting',
    label: 'Incident Reporting',
    snapshotKey: 'pillar_incident_reporting',
    percentKey: 'pillar_incident_reporting_percent',
    icon: <Bell className="h-5 w-5" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    key: 'resilience_testing',
    label: 'Resilience Testing',
    snapshotKey: 'pillar_resilience_testing',
    percentKey: 'pillar_resilience_testing_percent',
    icon: <Activity className="h-5 w-5" />,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  },
  {
    key: 'third_party_risk',
    label: 'Third-Party Risk',
    snapshotKey: 'pillar_third_party_risk',
    percentKey: 'pillar_third_party_risk_percent',
    icon: <Users className="h-5 w-5" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  {
    key: 'information_sharing',
    label: 'Information Sharing',
    snapshotKey: 'pillar_info_sharing',
    percentKey: 'pillar_info_sharing_percent',
    icon: <Share2 className="h-5 w-5" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
];

const MATURITY_LABELS: Record<number, string> = {
  0: 'Not Performed',
  1: 'Informal',
  2: 'Planned & Tracked',
  3: 'Well-Defined',
  4: 'Quant. Managed',
};

function getTrendIcon(trend: 'improving' | 'stable' | 'declining') {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    case 'declining':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-gray-500" />;
  }
}

function getProgressColor(level: number): string {
  if (level >= 3) return 'bg-emerald-500';
  if (level >= 2) return 'bg-blue-500';
  if (level >= 1) return 'bg-amber-500';
  return 'bg-red-500';
}

export function PillarProgressCards({ latestSnapshot, trends }: PillarProgressCardsProps) {
  if (!latestSnapshot) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PILLARS.map((pillar) => (
          <Card key={pillar.key} className="card-elevated opacity-50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <div className={`p-2 rounded-lg ${pillar.bgColor}`}>
                  <span className={pillar.color}>{pillar.icon}</span>
                </div>
                <span className="truncate">{pillar.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-4">
                No data available
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {PILLARS.map((pillar) => {
        const level = (latestSnapshot[pillar.snapshotKey] as number) ?? 0;
        const percent = (latestSnapshot[pillar.percentKey] as number) ?? 0;
        const trend = trends?.pillar_trends[pillar.key] ?? 'stable';

        return (
          <Card key={pillar.key} className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${pillar.bgColor}`}>
                    <span className={pillar.color}>{pillar.icon}</span>
                  </div>
                  <span className="truncate">{pillar.label}</span>
                </div>
                {getTrendIcon(trend)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">L{level}</span>
                  <span className="text-xs text-muted-foreground">
                    {MATURITY_LABELS[level]}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Readiness</span>
                  <span className="font-medium">{percent.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all ${getProgressColor(level)}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {level >= 3 ? (
                <Badge className="w-full justify-center bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  DORA Ready
                </Badge>
              ) : (
                <Badge variant="secondary" className="w-full justify-center">
                  {3 - level} level{3 - level > 1 ? 's' : ''} to L3
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
