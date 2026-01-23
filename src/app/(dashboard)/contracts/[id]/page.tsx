/**
 * Contract Detail Page
 * Full contract lifecycle view with tabs
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  AlertTriangle,
  RefreshCw,
  History,
  Shield,
  Pencil,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getContractDetail } from '@/lib/contracts/queries';
import {
  CONTRACT_STATUS_INFO,
  CONTRACT_TYPE_INFO,
  CONTRACT_CRITICALITY_INFO,
  CONTRACT_CATEGORY_INFO,
  calculateDoraComplianceScore,
} from '@/lib/contracts/types';
import { ContractOverviewTab } from './tabs/overview-tab';
import { ContractClausesTab } from './tabs/clauses-tab';
import { ContractAlertsTab } from './tabs/alerts-tab';
import { ContractRenewalsTab } from './tabs/renewals-tab';
import { ContractVersionsTab } from './tabs/versions-tab';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const contract = await getContractDetail(id);

  if (!contract) {
    return { title: 'Contract Not Found | NIS2 Comply' };
  }

  return {
    title: `${contract.contract_ref} | Contracts | NIS2 Comply`,
    description: `Contract details for ${contract.contract_ref} with ${contract.vendor.name}`,
  };
}

export default async function ContractDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;
  const contract = await getContractDetail(id);

  if (!contract) {
    notFound();
  }

  const doraScore = calculateDoraComplianceScore(
    contract.dora_provisions,
    contract.criticality === 'critical' || contract.criticality === 'high'
  );

  const daysUntilExpiry = contract.expiry_date
    ? Math.ceil(
        (new Date(contract.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/contracts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{contract.contract_ref}</h1>
            <Badge
              variant="outline"
              className={CONTRACT_STATUS_INFO[contract.status]?.color || ''}
            >
              {CONTRACT_STATUS_INFO[contract.status]?.label}
            </Badge>
            {contract.criticality && (
              <Badge
                variant="outline"
                className={CONTRACT_CRITICALITY_INFO[contract.criticality]?.color || ''}
              >
                {CONTRACT_CRITICALITY_INFO[contract.criticality]?.label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <Link
              href={`/vendors/${contract.vendor_id}`}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Building2 className="h-4 w-4" />
              {contract.vendor.name}
              <ExternalLink className="h-3 w-3" />
            </Link>
            <span>•</span>
            <span>{CONTRACT_TYPE_INFO[contract.contract_type]?.label}</span>
            {contract.category && (
              <>
                <span>•</span>
                <span>{CONTRACT_CATEGORY_INFO[contract.category]?.label}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/vendors/${contract.vendor_id}`}>
              <Building2 className="h-4 w-4 mr-2" />
              View Vendor
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/contracts/${contract.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Expiry */}
        <div
          className={`rounded-lg border p-4 ${
            contract.status === 'expired'
              ? 'bg-error/5 border-error/20'
              : contract.status === 'expiring'
              ? 'bg-warning/5 border-warning/20'
              : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Expiry Date</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            {contract.expiry_date ? (
              <>
                <span
                  className={`text-lg font-semibold ${
                    contract.status === 'expired'
                      ? 'text-error'
                      : contract.status === 'expiring'
                      ? 'text-warning'
                      : ''
                  }`}
                >
                  {new Date(contract.expiry_date).toLocaleDateString()}
                </span>
                {daysUntilExpiry !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {daysUntilExpiry < 0
                      ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                      : `${daysUntilExpiry} days remaining`}
                  </p>
                )}
              </>
            ) : (
              <span className="text-lg text-muted-foreground">No expiry</span>
            )}
          </div>
        </div>

        {/* Annual Value */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Annual Value</span>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            {contract.annual_value ? (
              <span className="text-lg font-semibold">
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: contract.currency || 'EUR',
                  maximumFractionDigits: 0,
                }).format(contract.annual_value)}
              </span>
            ) : (
              <span className="text-lg text-muted-foreground">—</span>
            )}
            {contract.auto_renewal && (
              <p className="text-xs text-muted-foreground mt-1">Auto-renewal enabled</p>
            )}
          </div>
        </div>

        {/* DORA Compliance */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">DORA Score</span>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span
              className={`text-lg font-semibold ${
                doraScore >= 80
                  ? 'text-success'
                  : doraScore >= 60
                  ? 'text-warning'
                  : 'text-error'
              }`}
            >
              {doraScore}%
            </span>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full ${
                  doraScore >= 80
                    ? 'bg-success'
                    : doraScore >= 60
                    ? 'bg-warning'
                    : 'bg-error'
                }`}
                style={{ width: `${doraScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div
          className={`rounded-lg border p-4 ${
            (contract.active_alerts_count || 0) > 0 ? 'bg-warning/5 border-warning/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Active Alerts</span>
            <AlertTriangle
              className={`h-4 w-4 ${
                (contract.active_alerts_count || 0) > 0 ? 'text-warning' : 'text-muted-foreground'
              }`}
            />
          </div>
          <div className="mt-2">
            <span className="text-lg font-semibold">{contract.active_alerts_count || 0}</span>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </div>
        </div>

        {/* Clauses Extracted */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Clauses</span>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-semibold">{contract.clauses_count || 0}</span>
            <p className="text-xs text-muted-foreground mt-1">
              {contract.clauses_extracted ? 'AI extracted' : 'Not extracted'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={tab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2" asChild>
            <Link href={`/contracts/${contract.id}?tab=overview`}>
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </Link>
          </TabsTrigger>
          <TabsTrigger value="clauses" className="gap-2" asChild>
            <Link href={`/contracts/${contract.id}?tab=clauses`}>
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Clauses</span>
              {(contract.clauses_count || 0) > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {contract.clauses_count}
                </Badge>
              )}
            </Link>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2" asChild>
            <Link href={`/contracts/${contract.id}?tab=alerts`}>
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
              {(contract.active_alerts_count || 0) > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {contract.active_alerts_count}
                </Badge>
              )}
            </Link>
          </TabsTrigger>
          <TabsTrigger value="renewals" className="gap-2" asChild>
            <Link href={`/contracts/${contract.id}?tab=renewals`}>
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Renewals</span>
              {(contract.pending_renewals_count || 0) > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {contract.pending_renewals_count}
                </Badge>
              )}
            </Link>
          </TabsTrigger>
          <TabsTrigger value="versions" className="gap-2" asChild>
            <Link href={`/contracts/${contract.id}?tab=versions`}>
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Versions</span>
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ContractOverviewTab contract={contract} />
        </TabsContent>

        <TabsContent value="clauses">
          <ContractClausesTab contract={contract} />
        </TabsContent>

        <TabsContent value="alerts">
          <ContractAlertsTab contract={contract} />
        </TabsContent>

        <TabsContent value="renewals">
          <ContractRenewalsTab contract={contract} />
        </TabsContent>

        <TabsContent value="versions">
          <ContractVersionsTab contract={contract} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
