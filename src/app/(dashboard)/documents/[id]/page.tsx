import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ChevronLeft,
  Download,
  Building2,
  Calendar,
  FileText,
  Shield,
  Award,
  Bug,
  File,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { getDocumentWithVendor } from '@/lib/documents/queries';
import {
  DOCUMENT_TYPE_INFO,
  PARSING_STATUS_INFO,
  formatFileSize,
  isDocumentExpiring,
  isDocumentExpired,
  type DocumentType,
} from '@/lib/documents/types';
import { DocumentActions } from './document-actions';

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>;
}

const documentTypeIcons: Record<DocumentType, React.ElementType> = {
  soc2: Shield,
  iso27001: Award,
  pentest: Bug,
  contract: FileText,
  other: File,
};

export async function generateMetadata({
  params,
}: DocumentDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const document = await getDocumentWithVendor(id);

  if (!document) {
    return { title: 'Document Not Found | DORA Comply' };
  }

  return {
    title: `${document.filename} | DORA Comply`,
    description: `Document details for ${document.filename}`,
  };
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { id } = await params;
  const document = await getDocumentWithVendor(id);

  if (!document) {
    notFound();
  }

  const typeInfo = DOCUMENT_TYPE_INFO[document.type];
  const statusInfo = PARSING_STATUS_INFO[document.parsing_status];
  const TypeIcon = documentTypeIcons[document.type];
  const isExpired = isDocumentExpired(document);
  const isExpiring = isDocumentExpiring(document);

  const expiryDate = document.metadata?.valid_until || document.metadata?.expiry_date;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/documents">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Documents
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className={cn('rounded-lg p-3', typeInfo.color)}>
            <TypeIcon className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight break-all">
              {document.filename}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{typeInfo.label}</Badge>
              <Badge variant="outline" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
              {isExpired && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Expired
                </Badge>
              )}
              {isExpiring && !isExpired && (
                <Badge variant="outline" className="gap-1 border-warning text-warning">
                  <Clock className="h-3 w-3" />
                  Expiring Soon
                </Badge>
              )}
            </div>
          </div>
        </div>

        <DocumentActions document={document} />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Document Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Information */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-base">File Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    File Size
                  </p>
                  <p className="mt-1">{formatFileSize(document.file_size)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    File Type
                  </p>
                  <p className="mt-1">{document.mime_type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Uploaded
                  </p>
                  <p className="mt-1">
                    {new Date(document.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Last Updated
                  </p>
                  <p className="mt-1">
                    {new Date(document.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Metadata */}
          {Object.keys(document.metadata).length > 0 && (
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base">Document Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {document.metadata.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Description
                    </p>
                    <p className="mt-1">{document.metadata.description}</p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {document.metadata.valid_from && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Valid From
                      </p>
                      <p className="mt-1">
                        {new Date(document.metadata.valid_from).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {expiryDate && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        {isExpired ? 'Expired On' : 'Valid Until'}
                      </p>
                      <p className={cn('mt-1', isExpired && 'text-error')}>
                        {new Date(expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* SOC 2 specific */}
                  {document.type === 'soc2' && document.metadata.soc2_type && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        SOC 2 Type
                      </p>
                      <p className="mt-1">Type {document.metadata.soc2_type}</p>
                    </div>
                  )}

                  {document.metadata.auditor_name && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Auditor
                      </p>
                      <p className="mt-1">{document.metadata.auditor_name}</p>
                    </div>
                  )}

                  {/* ISO 27001 specific */}
                  {document.metadata.certification_body && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Certification Body
                      </p>
                      <p className="mt-1">{document.metadata.certification_body}</p>
                    </div>
                  )}

                  {document.metadata.certificate_number && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Certificate Number
                      </p>
                      <p className="mt-1 font-mono">{document.metadata.certificate_number}</p>
                    </div>
                  )}

                  {/* Pentest specific */}
                  {document.metadata.tester_company && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Testing Company
                      </p>
                      <p className="mt-1">{document.metadata.tester_company}</p>
                    </div>
                  )}

                  {document.metadata.findings_count !== undefined && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Findings
                      </p>
                      <p className="mt-1">
                        {document.metadata.findings_count} total
                        {document.metadata.critical_findings !== undefined && (
                          <span className="text-error ml-1">
                            ({document.metadata.critical_findings} critical)
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Contract specific */}
                  {document.metadata.contract_start && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Contract Start
                      </p>
                      <p className="mt-1">
                        {new Date(document.metadata.contract_start).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {document.metadata.contract_end && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Contract End
                      </p>
                      <p className="mt-1">
                        {new Date(document.metadata.contract_end).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {document.metadata.renewal_type && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Renewal Type
                      </p>
                      <p className="mt-1 capitalize">{document.metadata.renewal_type}</p>
                    </div>
                  )}

                  {document.metadata.version && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Version
                      </p>
                      <p className="mt-1">{document.metadata.version}</p>
                    </div>
                  )}
                </div>

                {document.metadata.tags && document.metadata.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {document.metadata.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Parsing Status (Phase 2 placeholder) */}
          {document.parsing_status !== 'pending' && (
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base">AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {document.parsing_status === 'completed' ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium">Analysis Complete</p>
                        {document.parsing_confidence && (
                          <p className="text-sm text-muted-foreground">
                            Confidence: {Math.round(document.parsing_confidence * 100)}%
                          </p>
                        )}
                      </div>
                    </>
                  ) : document.parsing_status === 'processing' ? (
                    <>
                      <Clock className="h-5 w-5 text-info animate-pulse" />
                      <div>
                        <p className="font-medium">Processing...</p>
                        <p className="text-sm text-muted-foreground">
                          AI is analyzing this document
                        </p>
                      </div>
                    </>
                  ) : document.parsing_status === 'failed' ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-error" />
                      <div>
                        <p className="font-medium">Analysis Failed</p>
                        {document.parsing_error && (
                          <p className="text-sm text-error">{document.parsing_error}</p>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Vendor & Quick Actions */}
        <div className="space-y-6">
          {/* Associated Vendor */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-base">Associated Vendor</CardTitle>
            </CardHeader>
            <CardContent>
              {document.vendor ? (
                <Link
                  href={`/vendors/${document.vendor.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="rounded-full bg-muted p-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{document.vendor.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {document.vendor.tier} Tier
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="text-center py-4">
                  <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No vendor associated
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge variant="secondary">{typeInfo.label}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Size</span>
                <span className="text-sm font-medium">
                  {formatFileSize(document.file_size)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline" className={statusInfo.color}>
                  {statusInfo.label}
                </Badge>
              </div>
              {expiryDate && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {isExpired ? 'Expired' : 'Expires'}
                    </span>
                    <span className={cn('text-sm font-medium', isExpired && 'text-error')}>
                      {new Date(expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
