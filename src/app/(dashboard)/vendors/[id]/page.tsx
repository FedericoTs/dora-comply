import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Building2,
  FileText,
  Shield,
  Users,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getVendorWithRelations } from '@/lib/vendors/queries';
import {
  TIER_INFO,
  PROVIDER_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  getRiskLevel,
} from '@/lib/vendors/types';
import {
  VendorHero,
  VendorAlertBanner,
  VendorGleifStatus,
  VendorParentHierarchy,
  VendorAddressCard,
  VendorESAFields,
  VendorEnrichmentTab,
} from '@/components/vendors/detail';
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
  const riskLevel = getRiskLevel(vendor.risk_score);

  const riskColors: Record<string, string> = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-orange-500',
    critical: 'text-error',
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <VendorHero vendor={vendor} />

      {/* Alert Banner */}
      <VendorAlertBanner vendor={vendor} />

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
              <ScrollText className="h-5 w-5 text-info" />
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
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{vendor.contacts?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Contacts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GLEIF Data Status */}
      {vendor.lei && (
        <VendorGleifStatus
          gleifFetchedAt={vendor.gleif_fetched_at}
          leiVerifiedAt={vendor.lei_verified_at}
        />
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">
            <Users className="h-4 w-4 mr-1.5" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-1.5" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="contracts">
            <ScrollText className="h-4 w-4 mr-1.5" />
            Contracts
          </TabsTrigger>
          <TabsTrigger value="enrichment">
            <Sparkles className="h-4 w-4 mr-1.5" />
            Enrichment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Corporate Structure & Addresses */}
          <div className="grid gap-6 lg:grid-cols-2">
            <VendorParentHierarchy vendor={vendor} />
            <VendorAddressCard
              legalAddress={vendor.legal_address}
              headquartersAddress={vendor.headquarters_address}
            />
          </div>

          {/* ESA Compliance Data */}
          <VendorESAFields vendor={vendor} />

          {/* Basic Information & DORA Compliance side by side */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Information */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base">Provider Information</CardTitle>
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
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Tier
                    </p>
                    <Badge
                      variant={
                        vendor.tier === 'critical'
                          ? 'destructive'
                          : vendor.tier === 'important'
                          ? 'default'
                          : 'secondary'
                      }
                      className="mt-1"
                    >
                      {tierInfo.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Intra-group
                    </p>
                    <p className="mt-1">{vendor.is_intra_group ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Risk Score
                    </p>
                    <p className={cn('mt-1 font-medium', riskLevel ? riskColors[riskLevel] : '')}>
                      {vendor.risk_score !== null ? `${vendor.risk_score}/100` : '—'}
                    </p>
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
                    <p className="text-muted-foreground text-sm">No service types defined</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* DORA Compliance */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  DORA Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={cn(
                    'rounded-lg p-4',
                    vendor.supports_critical_function
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-muted'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Shield
                      className={cn(
                        'h-5 w-5 mt-0.5',
                        vendor.supports_critical_function ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <div>
                      <p className="font-medium">
                        {vendor.supports_critical_function
                          ? 'Critical Function Provider'
                          : 'Standard Provider'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {vendor.supports_critical_function
                          ? 'Enhanced due diligence and exit planning required under DORA Article 28.'
                          : 'Standard third-party oversight applies.'}
                      </p>
                    </div>
                  </div>
                </div>

                {vendor.critical_functions && vendor.critical_functions.length > 0 && (
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
                        ? new Date(vendor.last_assessment_date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Never assessed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Vendor Since
                    </p>
                    <p className="mt-1">
                      {new Date(vendor.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
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

        <TabsContent value="enrichment">
          <VendorEnrichmentTab vendor={vendor} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
