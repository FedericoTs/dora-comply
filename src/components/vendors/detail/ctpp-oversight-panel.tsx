'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Building2,
  HelpCircle,
  Calendar,
  Users,
  Shield,
  FileText,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
} from 'lucide-react';
import type {
  Vendor,
  CTTPDesignatingAuthority,
  CTTPDesignationSource,
  OversightPlanStatus,
  CTTPSubstitutability,
} from '@/lib/vendors/types';
import {
  CTPP_DESIGNATION_SOURCE_LABELS,
  CTPP_AUTHORITY_LABELS,
  OVERSIGHT_PLAN_STATUS_INFO,
  CTPP_SUBSTITUTABILITY_INFO,
} from '@/lib/vendors/types';

interface CTTPOversightPanelProps {
  vendor: Vendor;
}

interface FieldProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  tooltip?: string;
}

function Field({ label, value, icon: Icon, tooltip }: FieldProps) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border">
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-xs text-muted-foreground">{label}</span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="font-medium text-sm">{value}</div>
    </div>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function DesignationSection({ vendor }: { vendor: Vendor }) {
  const source = vendor.ctpp_designation_source as CTTPDesignationSource | null;
  const authority = vendor.ctpp_designating_authority as CTTPDesignatingAuthority | null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          CTPP Designation
          <Badge variant="outline" className="bg-error/10 text-error border-error/20 ml-auto">
            Critical TPP
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field
            label="Designation Source"
            icon={FileText}
            tooltip="How this provider was identified as a CTPP"
            value={source ? CTPP_DESIGNATION_SOURCE_LABELS[source] : '—'}
          />
          <Field
            label="Designating Authority"
            icon={Building2}
            tooltip="The ESA that designated this provider as critical"
            value={authority ? CTPP_AUTHORITY_LABELS[authority] : '—'}
          />
          <Field
            label="Designation Date"
            icon={Calendar}
            tooltip="When the CTPP designation was made"
            value={formatDate(vendor.ctpp_designation_date)}
          />
          {vendor.ctpp_designation_reason && (
            <Field
              label="Reason"
              tooltip="Rationale for CTPP designation"
              value={
                <span className="text-xs line-clamp-2">
                  {vendor.ctpp_designation_reason}
                </span>
              }
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LeadOverseerSection({ vendor }: { vendor: Vendor }) {
  const leadOverseer = vendor.lead_overseer as CTTPDesignatingAuthority | null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Lead Overseer Assignment
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            DORA Article 34
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field
            label="Lead Overseer"
            icon={Building2}
            tooltip="The ESA responsible for oversight coordination"
            value={
              leadOverseer ? (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {leadOverseer}
                </Badge>
              ) : (
                <span className="text-muted-foreground">Not assigned</span>
              )
            }
          />
          <Field
            label="Assigned Date"
            icon={Calendar}
            tooltip="When the lead overseer was assigned"
            value={formatDate(vendor.lead_overseer_assigned_date)}
          />
          {vendor.lead_overseer_contact_email && (
            <Field
              label="Contact Email"
              icon={Mail}
              tooltip="Lead overseer contact for this CTPP"
              value={
                <a
                  href={`mailto:${vendor.lead_overseer_contact_email}`}
                  className="text-primary hover:underline text-xs"
                >
                  {vendor.lead_overseer_contact_email}
                </a>
              }
            />
          )}
          <Field
            label="Joint Examination"
            icon={Users}
            tooltip="Whether a joint examination team has been formed"
            value={
              vendor.joint_examination_team ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Team Formed
                </Badge>
              ) : (
                <span className="text-muted-foreground">Not formed</span>
              )
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function OversightFrameworkSection({ vendor }: { vendor: Vendor }) {
  const status = (vendor.oversight_plan_status || 'not_applicable') as OversightPlanStatus;
  const statusInfo = OVERSIGHT_PLAN_STATUS_INFO[status];
  const hasFindings = (vendor.oversight_findings_count || 0) > 0;
  const hasPendingRecs = (vendor.oversight_recommendations_pending || 0) > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Oversight Framework
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            DORA Articles 35-37
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field
            label="Plan Status"
            icon={Clock}
            tooltip="Current status of the oversight plan implementation"
            value={
              <Badge variant="outline" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            }
          />
          <Field
            label="Last Assessment"
            icon={Calendar}
            tooltip="Date of the most recent oversight assessment"
            value={formatDate(vendor.last_oversight_assessment_date)}
          />
          <Field
            label="Next Assessment"
            icon={Calendar}
            tooltip="Scheduled date for the next oversight assessment"
            value={formatDate(vendor.next_oversight_assessment_date)}
          />
          <Field
            label="Open Findings"
            icon={AlertTriangle}
            tooltip="Number of unresolved findings from oversight assessments"
            value={
              hasFindings ? (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                  {vendor.oversight_findings_count} findings
                </Badge>
              ) : (
                <span className="text-success">None</span>
              )
            }
          />
        </div>

        {hasPendingRecs && (
          <div className="mt-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {vendor.oversight_recommendations_pending} recommendations pending implementation
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoSharingSection({ vendor }: { vendor: Vendor }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          Information Sharing
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            DORA Article 38
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field
            label="Portal Access"
            tooltip="Whether access to the information sharing portal is enabled"
            value={
              vendor.info_sharing_portal_access ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              ) : (
                <span className="text-muted-foreground">Not enabled</span>
              )
            }
          />
          {vendor.info_sharing_portal_url && (
            <Field
              label="Portal URL"
              icon={ExternalLink}
              value={
                <a
                  href={vendor.info_sharing_portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs"
                >
                  Open Portal
                </a>
              }
            />
          )}
          <Field
            label="Last Exchange"
            icon={Calendar}
            tooltip="Date of the most recent information exchange"
            value={formatDate(vendor.last_info_exchange_date)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ExitStrategySection({ vendor }: { vendor: Vendor }) {
  const substitutability = vendor.ctpp_substitutability_assessment as CTTPSubstitutability | null;
  const subInfo = substitutability ? CTPP_SUBSTITUTABILITY_INFO[substitutability] : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Exit Strategy
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            DORA Article 28(8)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field
            label="Strategy Documented"
            tooltip="Whether a documented exit strategy exists for this CTPP"
            value={
              vendor.ctpp_exit_strategy_documented ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Documented
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Not Documented
                </Badge>
              )
            }
          />
          <Field
            label="Last Review"
            icon={Calendar}
            tooltip="When the exit strategy was last reviewed"
            value={formatDate(vendor.ctpp_exit_strategy_last_review)}
          />
          <Field
            label="Substitutability"
            tooltip="Assessment of how easily this CTPP can be replaced"
            value={
              subInfo ? (
                <div>
                  <Badge variant="outline" className={subInfo.color}>
                    {subInfo.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {subInfo.description}
                  </p>
                </div>
              ) : (
                <span className="text-muted-foreground">Not assessed</span>
              )
            }
          />
        </div>

        {substitutability === 'highly_concentrated' || substitutability === 'no_alternatives' ? (
          <div className="mt-3 p-3 rounded-lg bg-error/5 border border-error/20">
            <div className="flex items-start gap-2 text-error">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div>
                <span className="text-sm font-medium">High Concentration Risk</span>
                <p className="text-xs text-error/80 mt-1">
                  This CTPP has limited or no alternatives. Ensure contingency plans are in place
                  and regularly tested per DORA requirements.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CTTPOversightPanel({ vendor }: CTTPOversightPanelProps) {
  if (!vendor.is_ctpp) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            CTPP Oversight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-muted/30 rounded-lg border border-dashed text-center">
            <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              This vendor is not designated as a Critical Third-Party Provider (CTPP)
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              CTPP oversight applies to providers designated by ESAs under DORA Articles 33-44
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <DesignationSection vendor={vendor} />
      <LeadOverseerSection vendor={vendor} />
      <OversightFrameworkSection vendor={vendor} />
      <InfoSharingSection vendor={vendor} />
      <ExitStrategySection vendor={vendor} />
    </div>
  );
}
