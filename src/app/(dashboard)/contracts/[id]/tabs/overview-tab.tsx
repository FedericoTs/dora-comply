/**
 * Contract Overview Tab
 * Displays contract details and DORA compliance status
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import type { ContractDetail } from '@/lib/contracts/queries';
import type { DoraProvisionStatus, DoraProvision } from '@/lib/contracts/types';
import { DORA_PROVISION_LABELS, calculateDoraComplianceScore } from '@/lib/contracts/types';

interface ContractOverviewTabProps {
  contract: ContractDetail;
}

const PROVISION_STATUS_ICONS: Record<DoraProvisionStatus, React.ReactNode> = {
  present: <CheckCircle2 className="h-4 w-4 text-success" />,
  partial: <AlertCircle className="h-4 w-4 text-warning" />,
  missing: <XCircle className="h-4 w-4 text-error" />,
  not_applicable: <MinusCircle className="h-4 w-4 text-muted-foreground" />,
};

const PROVISION_STATUS_LABELS: Record<DoraProvisionStatus, string> = {
  present: 'Present',
  partial: 'Partial',
  missing: 'Missing',
  not_applicable: 'N/A',
};

export function ContractOverviewTab({ contract }: ContractOverviewTabProps) {
  const isCritical = contract.criticality === 'critical' || contract.criticality === 'high';
  const doraScore = calculateDoraComplianceScore(contract.dora_provisions, isCritical);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Contract Details */}
      <div className="lg:col-span-2 space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Contract Reference</dt>
                <dd className="mt-1 text-sm">{contract.contract_ref}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Contract Type</dt>
                <dd className="mt-1 text-sm">{contract.contract_type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Effective Date</dt>
                <dd className="mt-1 text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(contract.effective_date).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Expiry Date</dt>
                <dd className="mt-1 text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {contract.expiry_date
                    ? new Date(contract.expiry_date).toLocaleDateString()
                    : 'No expiry'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Signature Date</dt>
                <dd className="mt-1 text-sm">
                  {contract.signature_date
                    ? new Date(contract.signature_date).toLocaleDateString()
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Auto Renewal</dt>
                <dd className="mt-1 text-sm">
                  <Badge variant={contract.auto_renewal ? 'default' : 'secondary'}>
                    {contract.auto_renewal ? 'Yes' : 'No'}
                  </Badge>
                  {contract.auto_renewal && contract.termination_notice_days && (
                    <span className="ml-2 text-muted-foreground">
                      ({contract.termination_notice_days} days notice)
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Annual Value</dt>
                <dd className="mt-1 text-sm font-medium">
                  {contract.annual_value
                    ? new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: contract.currency || 'EUR',
                      }).format(contract.annual_value)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Total Value</dt>
                <dd className="mt-1 text-sm font-medium">
                  {contract.total_value
                    ? new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: contract.currency || 'EUR',
                      }).format(contract.total_value)
                    : '—'}
                </dd>
              </div>
              {contract.owner && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground">Contract Owner</dt>
                  <dd className="mt-1 text-sm flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {contract.owner.full_name || contract.owner.email}
                  </dd>
                </div>
              )}
              {contract.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground">Notes</dt>
                  <dd className="mt-1 text-sm">{contract.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* DORA Provisions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>DORA Article 30 Provisions</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    doraScore >= 80
                      ? 'text-success'
                      : doraScore >= 60
                      ? 'text-warning'
                      : 'text-error'
                  }`}
                >
                  {doraScore}% Compliant
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Article 30.2 - Basic Requirements */}
            <div>
              <h4 className="text-sm font-medium mb-3">
                Article 30.2 - Basic Requirements (All ICT Contracts)
              </h4>
              <div className="space-y-2">
                {Object.entries(contract.dora_provisions?.article_30_2 || {}).map(
                  ([key, rawProvision]) => {
                    const provision = rawProvision as DoraProvision;
                    const info = DORA_PROVISION_LABELS[key];
                    if (!info) return null;

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          {PROVISION_STATUS_ICONS[provision.status]}
                          <div>
                            <p className="text-sm font-medium">{info.label}</p>
                            <p className="text-xs text-muted-foreground">{info.article}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {provision.location && (
                            <span className="text-xs text-muted-foreground">
                              {provision.location}
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className={
                              provision.status === 'present'
                                ? 'bg-success/10 text-success border-success/20'
                                : provision.status === 'partial'
                                ? 'bg-warning/10 text-warning border-warning/20'
                                : provision.status === 'missing'
                                ? 'bg-error/10 text-error border-error/20'
                                : ''
                            }
                          >
                            {PROVISION_STATUS_LABELS[provision.status]}
                          </Badge>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Article 30.3 - Critical Functions (if applicable) */}
            {isCritical && contract.dora_provisions?.article_30_3 && (
              <div>
                <h4 className="text-sm font-medium mb-3">
                  Article 30.3 - Critical/Important Functions
                </h4>
                <div className="space-y-2">
                  {Object.entries(contract.dora_provisions.article_30_3).map(([key, rawProvision]) => {
                    const provision = rawProvision as DoraProvision;
                    const info = DORA_PROVISION_LABELS[key];
                    if (!info) return null;

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          {PROVISION_STATUS_ICONS[provision.status]}
                          <div>
                            <p className="text-sm font-medium">{info.label}</p>
                            <p className="text-xs text-muted-foreground">{info.article}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {provision.location && (
                            <span className="text-xs text-muted-foreground">
                              {provision.location}
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className={
                              provision.status === 'present'
                                ? 'bg-success/10 text-success border-success/20'
                                : provision.status === 'partial'
                                ? 'bg-warning/10 text-warning border-warning/20'
                                : provision.status === 'missing'
                                ? 'bg-error/10 text-error border-error/20'
                                : ''
                            }
                          >
                            {PROVISION_STATUS_LABELS[provision.status]}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Linked Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contract.document_ids && contract.document_ids.length > 0 ? (
              <ul className="space-y-2">
                {contract.document_ids.map((docId) => (
                  <li key={docId} className="text-sm">
                    <a href={`/documents/${docId}`} className="text-primary hover:underline">
                      Document {docId.slice(0, 8)}...
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No documents linked</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Clauses Extracted</span>
              <span className="font-medium">{contract.clauses_count || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active Alerts</span>
              <span className="font-medium">{contract.active_alerts_count || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pending Renewals</span>
              <span className="font-medium">{contract.pending_renewals_count || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Versions</span>
              <span className="font-medium">{contract.versions?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis Status */}
        <Card>
          <CardHeader>
            <CardTitle>AI Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {contract.ai_analyzed_at ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">Analyzed</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last analyzed: {new Date(contract.ai_analyzed_at).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Not yet analyzed</p>
                <p className="text-xs text-muted-foreground">
                  Upload the contract document to extract clauses automatically
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
