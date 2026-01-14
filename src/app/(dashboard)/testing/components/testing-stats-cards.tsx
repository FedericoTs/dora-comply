/**
 * Testing Stats Cards Component
 *
 * Displays key testing metrics in a grid of stat cards
 */

import { Calendar, CheckCircle2, Bug, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getTestingStats } from '@/lib/testing/queries';

interface TestingStatsCardsProps {
  tlptRequired: boolean;
}

export async function TestingStatsCards({ tlptRequired }: TestingStatsCardsProps) {
  const { data: stats } = await getTestingStats();

  if (!stats) {
    return null;
  }

  // Build stat cards based on entity classification
  const statCards = [
    {
      title: 'Active Programmes',
      value: stats.active_programmes,
      icon: Calendar,
      description: `${stats.total_programmes} total programmes`,
    },
    {
      title: 'Tests Completed',
      value: stats.completed_tests_this_year,
      icon: CheckCircle2,
      description: 'This year',
    },
    {
      title: 'Open Findings',
      value: stats.open_findings,
      icon: Bug,
      description: `${stats.critical_open_findings} critical`,
      variant: stats.critical_open_findings > 0 ? 'destructive' : 'default',
    },
    // Show TLPT status differently based on whether it's required
    tlptRequired
      ? {
          title: 'TLPT Status',
          value: stats.tlpt_overdue > 0 ? 'Action Needed' : 'On Track',
          icon: Target,
          description: `${stats.tlpt_due_soon} due soon`,
          variant: stats.tlpt_overdue > 0 ? 'destructive' : 'default',
          textValue: true,
        }
      : {
          title: 'TLPT',
          value: 'N/A',
          icon: Target,
          description: 'Not required for your entity',
          variant: 'default',
          textValue: true,
        },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.variant === 'destructive' ? 'text-destructive' : ''}`}>
              {stat.textValue ? stat.value : stat.value}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
