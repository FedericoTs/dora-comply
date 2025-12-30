import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ChevronLeft,
  Building2,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getVendorWithRelations } from '@/lib/vendors/queries';
import {
  TIER_INFO,
  STATUS_INFO,
  PROVIDER_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  getRiskLevel,
} from '@/lib/vendors/types';
import { getCountryName, getCountryFlag } from '@/lib/external/gleif';
import { VendorDocuments } from './vendor-documents';
import { VendorContacts } from '@/components/vendors/vendor-contacts';
import { VendorContracts } from '@/components/vendors/vendor-contracts';

interface VendorDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: VendorDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const vendor = await getVendorWithRelations(id);

  if (!vendor) {
    return { title: 'Vendor Not Found | DORA Comply' };
  }

  return {
    title: `${vendor.name} | DORA Comply`,
    description: `Vendor details for ${vendor.name}`,
  };
}

export default async function VendorDetailPage({ params }: VendorDetailPageProps) {
  const { id } = await params;
  const vendor = await getVendorWithRelations(id);

  if (!vendor) {
    notFound();
  }

  const tierInfo = TIER_INFO[vendor.tier];
  const statusInfo = STATUS_INFO[vendor.status];
  const riskLevel = getRiskLevel(vendor.risk_score);

  const riskColors: Record<string, string> = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-orange-500',
    critical: 'text-error',
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/vendors">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Vendors
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{vendor.name}</h1>
            <Badge
              variant={
                vendor.tier === 'critical'
                  ? 'destructive'
                  : vendor.tier === 'important'
                  ? 'default'
                  : 'secondary'
              }
            >
              {tierInfo.label}
            </Badge>
            <Badge variant="outline" className={cn('gap-1', statusInfo.color)}>
              {vendor.status === 'active' && <CheckCircle2 className="h-3 w-3" />}
              {vendor.status === 'pending' && <Clock className="h-3 w-3" />}
              {statusInfo.label}
            </Badge>
          </div>
          {vendor.lei && (
            <p className="text-sm font-mono text-muted-foreground">
              LEI: {vendor.lei}
            </p>
          )}
        </div>

        <Button asChild>
          <Link href={`/vendors/${vendor.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Vendor
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-elevated">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{vendor.documents_count || 0}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-info/10 p-2">
              <FileText className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{vendor.contracts_count || 0}</p>
              <p className="text-xs text-muted-foreground">Contracts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-warning/10 p-2">
              <Building2 className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{vendor.services_count || 0}</p>
              <p className="text-xs text-muted-foreground">ICT Services</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="flex items-center gap-4 p-4">
            <div
              className={cn(
                'rounded-lg p-2',
                riskLevel ? 'bg-error/10' : 'bg-muted'
              )}
            >
              <Shield
                className={cn(
                  'h-5 w-5',
                  riskLevel ? riskColors[riskLevel] : 'text-muted-foreground'
                )}
              />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {vendor.risk_score !== null ? vendor.risk_score : '-'}
              </p>
              <p className="text-xs text-muted-foreground">Risk Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Basic Information */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Provider Type
                    </p>
                    <p className="mt-1">
                      {vendor.provider_type
                        ? PROVIDER_TYPE_LABELS[vendor.provider_type]
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Headquarters
                    </p>
                    <p className="mt-1">
                      {vendor.headquarters_country ? (
                        <>
                          {getCountryFlag(vendor.headquarters_country)}{' '}
                          {getCountryName(vendor.headquarters_country)}
                        </>
                      ) : (
                        '-'
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Jurisdiction
                    </p>
                    <p className="mt-1">{vendor.jurisdiction || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Intra-group
                    </p>
                    <p className="mt-1">{vendor.is_intra_group ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Service Types
                  </p>
                  {vendor.service_types.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {vendor.service_types.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {SERVICE_TYPE_LABELS[type as keyof typeof SERVICE_TYPE_LABELS] ||
                            type}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No service types defined</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* DORA Compliance */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base">DORA Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={cn(
                    'rounded-lg p-4',
                    vendor.supports_critical_function
                      ? 'bg-error/10 border border-error/20'
                      : 'bg-muted'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {vendor.supports_critical_function ? (
                      <AlertTriangle className="h-5 w-5 text-error mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">
                        {vendor.supports_critical_function
                          ? 'Supports Critical Function'
                          : 'No Critical Function Dependency'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {vendor.supports_critical_function
                          ? 'This vendor provides services that support critical or important functions under DORA.'
                          : 'This vendor does not support any critical or important functions.'}
                      </p>
                    </div>
                  </div>
                </div>

                {vendor.critical_functions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                      Critical Functions Supported
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {vendor.critical_functions.map((fn) => (
                        <Badge key={fn} variant="outline" className="text-xs">
                          {fn}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Last Assessment
                    </p>
                    <p className="mt-1">
                      {vendor.last_assessment_date
                        ? new Date(vendor.last_assessment_date).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Created
                    </p>
                    <p className="mt-1">
                      {new Date(vendor.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {vendor.notes && (
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{vendor.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contacts">
          <VendorContacts
            vendorId={vendor.id}
            contacts={vendor.contacts || []}
          />
        </TabsContent>

        <TabsContent value="documents">
          <VendorDocuments vendorId={vendor.id} vendorName={vendor.name} />
        </TabsContent>

        <TabsContent value="contracts">
          <VendorContracts
            vendorId={vendor.id}
            contracts={vendor.contracts || []}
            isCriticalFunction={vendor.supports_critical_function}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
