'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Shield,
  Users,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { GDPRStats, DSRType } from '@/lib/gdpr/types';
import { DSR_TYPE_LABELS } from '@/lib/gdpr/types';

interface GDPRDashboardProps {
  organizationId: string;
}

export function GDPRDashboard({ organizationId }: GDPRDashboardProps) {
  const [stats, setStats] = useState<GDPRStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/data-protection/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch GDPR stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [organizationId]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Get Started with GDPR Compliance</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Start documenting your processing activities and build your GDPR compliance program.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild>
              <Link href="/data-protection/processing-activities">
                <Plus className="h-4 w-4 mr-2" />
                Add Processing Activity
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Processing Activities"
          value={stats.processing_activities.total}
          subtitle={`${stats.processing_activities.active} active`}
          icon={FileText}
          href="/data-protection/processing-activities"
          trend={
            stats.processing_activities.requiring_dpia > 0
              ? `${stats.processing_activities.requiring_dpia} require DPIA`
              : undefined
          }
        />
        <StatCard
          title="Impact Assessments"
          value={stats.dpias.total}
          subtitle={`${stats.dpias.approved} approved`}
          icon={Shield}
          href="/data-protection/dpias"
          alert={stats.dpias.high_risk > 0 ? `${stats.dpias.high_risk} high risk` : undefined}
        />
        <StatCard
          title="Data Subject Requests"
          value={stats.dsr.total}
          subtitle={`${stats.dsr.open} open`}
          icon={Users}
          href="/data-protection/dsr"
          alert={stats.dsr.overdue > 0 ? `${stats.dsr.overdue} overdue` : undefined}
        />
        <StatCard
          title="Data Breaches"
          value={stats.breaches.total}
          subtitle={`${stats.breaches.this_year} this year`}
          icon={AlertTriangle}
          href="/data-protection/breaches"
          alert={stats.breaches.open > 0 ? `${stats.breaches.open} open` : undefined}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Processing Activities Overview */}
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Processing Activities</CardTitle>
                <CardDescription>Record of Processing Activities (RoPA)</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/data-protection/processing-activities">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{stats.processing_activities.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <p className="text-2xl font-bold text-amber-600">
                    {stats.processing_activities.with_special_category}
                  </p>
                  <p className="text-xs text-muted-foreground">Special Category</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.processing_activities.with_international_transfer}
                  </p>
                  <p className="text-xs text-muted-foreground">Int&apos;l Transfers</p>
                </div>
              </div>

              {/* DPIA Required */}
              {stats.processing_activities.requiring_dpia > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">
                      {stats.processing_activities.requiring_dpia} activities require DPIA
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/data-protection/dpias/new">Create DPIA</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* DSR Overview */}
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Data Subject Requests</CardTitle>
                <CardDescription>Track and respond to DSRs within deadlines</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/data-protection/dsr">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status Overview */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{stats.dsr.open}</p>
                  <p className="text-xs text-muted-foreground">Open</p>
                </div>
                <div className={cn(
                  'p-3 rounded-lg',
                  stats.dsr.overdue > 0
                    ? 'bg-red-50 dark:bg-red-950/20'
                    : 'bg-emerald-50 dark:bg-emerald-950/20'
                )}>
                  <p className={cn(
                    'text-2xl font-bold',
                    stats.dsr.overdue > 0 ? 'text-red-600' : 'text-emerald-600'
                  )}>
                    {stats.dsr.overdue}
                  </p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats.dsr.completed_this_month}
                  </p>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </div>
              </div>

              {/* DSR by Type */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  By Type
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.dsr.by_type)
                    .filter(([, count]) => count > 0)
                    .map(([type, count]) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {DSR_TYPE_LABELS[type as DSRType]?.split(' ')[0] || type}: {count}
                      </Badge>
                    ))}
                  {Object.values(stats.dsr.by_type).every((v) => v === 0) && (
                    <span className="text-sm text-muted-foreground">No requests recorded</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DPIA Overview */}
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Impact Assessments</CardTitle>
                <CardDescription>Data Protection Impact Assessments (DPIA)</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/data-protection/dpias">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status Pipeline */}
              <div className="space-y-3">
                <StatusBar
                  label="Draft"
                  count={stats.dpias.draft}
                  total={stats.dpias.total}
                  color="bg-gray-400"
                />
                <StatusBar
                  label="In Progress"
                  count={stats.dpias.in_progress}
                  total={stats.dpias.total}
                  color="bg-blue-500"
                />
                <StatusBar
                  label="Approved"
                  count={stats.dpias.approved}
                  total={stats.dpias.total}
                  color="bg-emerald-500"
                />
              </div>

              {/* High Risk Alert */}
              {stats.dpias.high_risk > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">
                      {stats.dpias.high_risk} high/very high risk assessments
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Breach Overview */}
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Data Breaches</CardTitle>
                <CardDescription>Personal data breach log and notifications</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/data-protection/breaches">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className={cn(
                  'p-3 rounded-lg',
                  stats.breaches.open > 0
                    ? 'bg-red-50 dark:bg-red-950/20'
                    : 'bg-emerald-50 dark:bg-emerald-950/20'
                )}>
                  <p className={cn(
                    'text-2xl font-bold',
                    stats.breaches.open > 0 ? 'text-red-600' : 'text-emerald-600'
                  )}>
                    {stats.breaches.open}
                  </p>
                  <p className="text-xs text-muted-foreground">Open Breaches</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <p className="text-2xl font-bold text-amber-600">
                    {stats.breaches.requiring_notification}
                  </p>
                  <p className="text-xs text-muted-foreground">Required Notification</p>
                </div>
              </div>

              {/* Empty State or Summary */}
              {stats.breaches.total === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                  <p className="text-sm text-muted-foreground">No breaches recorded</p>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">
                    {stats.breaches.this_year} breach{stats.breaches.this_year !== 1 ? 'es' : ''} this year
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              title="Add Processing Activity"
              description="Document a new processing activity"
              href="/data-protection/processing-activities?action=new"
              icon={FileText}
            />
            <QuickActionCard
              title="Start DPIA"
              description="Begin an impact assessment"
              href="/data-protection/dpias/new"
              icon={Shield}
            />
            <QuickActionCard
              title="Log DSR"
              description="Record a data subject request"
              href="/data-protection/dsr?action=new"
              icon={Users}
            />
            <QuickActionCard
              title="Report Breach"
              description="Document a data breach"
              href="/data-protection/breaches?action=new"
              icon={AlertTriangle}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  trend,
  alert,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  href: string;
  trend?: string;
  alert?: string;
}) {
  return (
    <Link href={href}>
      <Card className="card-elevated hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
          {(trend || alert) && (
            <div className="mt-3 pt-3 border-t">
              {alert ? (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {alert}
                </div>
              ) : trend ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  {trend}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// Status Bar Component
function StatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Quick Action Card
function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}) {
  return (
    <Link href={href}>
      <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    </div>
  );
}
