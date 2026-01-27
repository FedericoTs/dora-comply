/**
 * Contracts Page
 * Contract Lifecycle Management - Phase 3.1
 *
 * Unified contracts management with tabbed interface:
 * - List: Contracts table with filtering and sidebar
 * - Calendar: Visual calendar showing contract events
 */

import { Suspense } from 'react';
import { FileText, AlertTriangle, RefreshCw, List, CalendarDays, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getContractsWithLifecycle, getActiveAlerts, getPendingRenewals } from '@/lib/contracts/queries';
import { ContractsClient } from './contracts-client';
import { ContractCalendarView } from '@/components/contracts/contract-calendar-view';

export const metadata = {
  title: 'Contracts | NIS2 Comply',
  description: 'Contract lifecycle management and compliance tracking',
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    criticality?: string;
    category?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ContractsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);

  // Fetch contracts with filters
  const { contracts, total, stats } = await getContractsWithLifecycle(
    {
      status: (params.status as 'active' | 'expiring' | 'expired' | 'draft' | 'all') || 'all',
      criticality: (params.criticality as 'low' | 'medium' | 'high' | 'critical' | 'all') || 'all',
      category: params.category as 'ict_services' | 'cloud_services' | 'software_licenses' | 'maintenance' | 'consulting' | 'data_processing' | 'infrastructure' | 'security' | 'other' | 'all' || 'all',
      search: params.search,
    },
    page,
    20
  );

  // Fetch active alerts and pending renewals for sidebar
  const [activeAlerts, pendingRenewals] = await Promise.all([
    getActiveAlerts(['triggered', 'acknowledged'], 5),
    getPendingRenewals(5),
  ]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contracts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage contract lifecycle, renewals, and compliance obligations
          </p>
        </div>
        <Button asChild>
          <Link href="/vendors">
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Contracts"
          value={stats.total}
          icon={<FileText className="h-4 w-4" />}
          description="Active agreements"
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={<FileText className="h-4 w-4 text-success" />}
          description="Currently in effect"
          variant="success"
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiring}
          icon={<AlertTriangle className="h-4 w-4 text-warning" />}
          description="Within 90 days"
          variant="warning"
        />
        <StatCard
          title="Active Alerts"
          value={stats.activeAlerts}
          icon={<AlertTriangle className="h-4 w-4 text-error" />}
          description="Require attention"
          variant="error"
        />
        <StatCard
          title="Pending Renewals"
          value={stats.pendingRenewals}
          icon={<RefreshCw className="h-4 w-4 text-blue-500" />}
          description="Awaiting decision"
          variant="info"
        />
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent value="list">
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Contracts Table */}
            <div className="lg:col-span-3">
              <Suspense fallback={<ContractsTableSkeleton />}>
                <ContractsClient
                  contracts={contracts}
                  total={total}
                  currentPage={page}
                  filters={params}
                />
              </Suspense>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Active Alerts */}
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-medium flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Active Alerts
                </h3>
                {activeAlerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active alerts</p>
                ) : (
                  <div className="space-y-3">
                    {activeAlerts.map((alert) => (
                      <Link
                        key={alert.id}
                        href={`/contracts/${alert.contract_id}`}
                        className="block p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                              alert.priority === 'critical'
                                ? 'bg-error'
                                : alert.priority === 'high'
                                ? 'bg-orange-500'
                                : alert.priority === 'medium'
                                ? 'bg-warning'
                                : 'bg-blue-500'
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{alert.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {alert.contract.vendor_name}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {stats.activeAlerts > 5 && (
                      <Link
                        href="/contracts?tab=alerts"
                        className="text-xs text-primary hover:underline block text-center mt-2"
                      >
                        View all {stats.activeAlerts} alerts
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Pending Renewals */}
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-medium flex items-center gap-2 mb-3">
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                  Pending Renewals
                </h3>
                {pendingRenewals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending renewals</p>
                ) : (
                  <div className="space-y-3">
                    {pendingRenewals.map((renewal) => (
                      <Link
                        key={renewal.id}
                        href={`/contracts/${renewal.contract_id}?tab=renewals`}
                        className="block p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {renewal.contract.contract_ref}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {renewal.contract.vendor_name}
                          </p>
                          {renewal.due_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {new Date(renewal.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                    {stats.pendingRenewals > 5 && (
                      <Link
                        href="/contracts?tab=renewals"
                        className="text-xs text-primary hover:underline block text-center mt-2"
                      >
                        View all {stats.pendingRenewals} renewals
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Value Summary */}
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-medium mb-3">Portfolio Value</h3>
                <div className="text-2xl font-semibold">
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  }).format(stats.totalValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total annual contract value
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <Suspense fallback={<CalendarSkeleton />}>
            <ContractCalendarView />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Calendar loading skeleton
function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  description,
  variant = 'default',
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}) {
  const variantStyles = {
    default: 'bg-card',
    success: 'bg-success/5 border-success/20',
    warning: 'bg-warning/5 border-warning/20',
    error: 'bg-error/5 border-error/20',
    info: 'bg-blue-500/5 border-blue-500/20',
  };

  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon}
      </div>
      <div className="mt-2">
        <span className="text-2xl font-semibold">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

// Loading Skeleton
function ContractsTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
