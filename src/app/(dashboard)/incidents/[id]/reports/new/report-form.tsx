'use client';

/**
 * Incident Report Form
 *
 * DORA Article 19 compliant incident report creation
 * Supports initial (4h), intermediate (72h), and final reports
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Calendar,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  Building2,
  Users,
  Globe,
  DollarSign,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { createReportAction } from '@/lib/incidents/actions';
import {
  getReportTypeLabel,
  getClassificationLabel,
  getIncidentTypeLabel,
  type ReportType,
  type IncidentClassification,
  type IncidentType,
} from '@/lib/incidents/types';

interface ReportFormProps {
  incidentId: string;
  incidentRef: string;
  incidentTitle: string;
  incidentDescription: string | null;
  classification: IncidentClassification;
  incidentType: IncidentType;
  detectionDatetime: string;
  reportType: ReportType;
  deadline: Date;
  servicesAffected: string[];
  criticalFunctionsAffected: string[];
  clientsAffectedCount: number | null;
  clientsAffectedPercentage: number | null;
  transactionsAffectedCount: number | null;
  transactionsValueAffected: number | null;
  dataBreach: boolean;
  dataRecordsAffected: number | null;
  geographicSpread: string[];
  economicImpact: number | null;
  rootCause: string | null;
  remediationActions: string | null;
  vendor?: { id: string; name: string } | null;
}

export function ReportForm({
  incidentId,
  incidentRef,
  incidentTitle,
  incidentDescription,
  classification,
  incidentType,
  detectionDatetime,
  reportType,
  deadline,
  servicesAffected,
  criticalFunctionsAffected,
  clientsAffectedCount,
  clientsAffectedPercentage,
  transactionsAffectedCount,
  transactionsValueAffected,
  dataBreach,
  dataRecordsAffected,
  geographicSpread,
  economicImpact,
  rootCause,
  remediationActions,
  vendor,
}: ReportFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state - pre-populate from incident
  const [summary, setSummary] = useState(incidentDescription || '');
  const [currentStatus, setCurrentStatus] = useState('');
  const [actionsTaken, setActionsTaken] = useState(remediationActions || '');
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState(rootCause || '');
  const [estimatedResolution, setEstimatedResolution] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Calculate time remaining
  const now = new Date();
  const hoursRemaining = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
  const isOverdue = hoursRemaining < 0;

  const handleSubmit = async (e: React.FormEvent, submitToRegulator: boolean = false) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Build report content
      const reportContent = {
        // Report metadata
        report_type: reportType,
        report_label: getReportTypeLabel(reportType),
        created_at: new Date().toISOString(),
        deadline: deadline.toISOString(),

        // Incident summary
        incident_ref: incidentRef,
        incident_title: incidentTitle,
        classification,
        classification_label: getClassificationLabel(classification),
        incident_type: incidentType,
        incident_type_label: getIncidentTypeLabel(incidentType),
        detection_datetime: detectionDatetime,

        // Report narrative
        summary,
        current_status: currentStatus,
        actions_taken: actionsTaken,
        root_cause_analysis: rootCauseAnalysis,
        estimated_resolution: estimatedResolution,
        additional_notes: additionalNotes,

        // Impact data (from incident)
        services_affected: servicesAffected,
        critical_functions_affected: criticalFunctionsAffected,
        clients_affected_count: clientsAffectedCount,
        clients_affected_percentage: clientsAffectedPercentage,
        transactions_affected_count: transactionsAffectedCount,
        transactions_value_affected: transactionsValueAffected,
        data_breach: dataBreach,
        data_records_affected: dataRecordsAffected,
        geographic_spread: geographicSpread,
        economic_impact: economicImpact,

        // Third party info
        vendor_id: vendor?.id || null,
        vendor_name: vendor?.name || null,
      };

      const result = await createReportAction(incidentId, {
        report_type: reportType,
        report_content: reportContent,
      });

      if (result.success) {
        toast.success('Report created successfully', {
          description: submitToRegulator
            ? 'Report saved as draft. You can submit it from the incident page.'
            : 'Report has been saved.',
        });
        router.push(`/incidents/${incidentId}`);
        router.refresh();
      } else {
        toast.error('Failed to create report', {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error('An error occurred', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
      {/* Deadline Alert */}
      <Card className={cn(
        'border-l-4',
        isOverdue
          ? 'border-l-destructive bg-destructive/5'
          : hoursRemaining <= 2
          ? 'border-l-warning bg-warning/5'
          : 'border-l-info bg-info/5'
      )}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOverdue ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <Clock className="h-5 w-5 text-info" />
              )}
              <div>
                <p className="font-medium">
                  {getReportTypeLabel(reportType)} Deadline
                </p>
                <p className="text-sm text-muted-foreground">
                  {deadline.toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <Badge variant={isOverdue ? 'destructive' : hoursRemaining <= 2 ? 'default' : 'secondary'}>
              {isOverdue
                ? `${Math.abs(hoursRemaining)}h overdue`
                : `${hoursRemaining}h remaining`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Incident Context - Read Only */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Incident Information
          </CardTitle>
          <CardDescription>
            Pre-populated from incident {incidentRef}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Classification</Label>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant={classification === 'major' ? 'destructive' : classification === 'significant' ? 'default' : 'secondary'}
                >
                  {getClassificationLabel(classification)}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Incident Type</Label>
              <p className="mt-1 text-sm">{getIncidentTypeLabel(incidentType)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Detected</Label>
              <p className="mt-1 text-sm flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(detectionDatetime).toLocaleString('en-GB')}
              </p>
            </div>
            {vendor && (
              <div>
                <Label className="text-xs text-muted-foreground">Third Party</Label>
                <p className="mt-1 text-sm flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {vendor.name}
                </p>
              </div>
            )}
          </div>

          {/* Impact Summary */}
          <Separator className="my-4" />
          <div className="grid gap-4 md:grid-cols-4">
            {clientsAffectedCount !== null && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Clients Affected
                </Label>
                <p className="mt-1 text-sm font-medium">
                  {clientsAffectedCount.toLocaleString()}
                  {clientsAffectedPercentage !== null && ` (${clientsAffectedPercentage}%)`}
                </p>
              </div>
            )}
            {transactionsValueAffected !== null && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Transaction Value
                </Label>
                <p className="mt-1 text-sm font-medium">
                  €{transactionsValueAffected.toLocaleString()}
                </p>
              </div>
            )}
            {geographicSpread.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Geographic Spread
                </Label>
                <p className="mt-1 text-sm">{geographicSpread.join(', ')}</p>
              </div>
            )}
            {dataBreach && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Data Breach
                </Label>
                <p className="mt-1 text-sm font-medium text-destructive">
                  {dataRecordsAffected?.toLocaleString() || 'Yes'} records
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {getReportTypeLabel(reportType)} Content
          </CardTitle>
          <CardDescription>
            {reportType === 'initial' && 'Provide initial assessment within 4 hours of detection'}
            {reportType === 'intermediate' && 'Update on incident progress within 72 hours'}
            {reportType === 'final' && 'Comprehensive final report within 1 month of resolution'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="summary">Incident Summary *</Label>
            <Textarea
              id="summary"
              placeholder="Provide a clear summary of the incident..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentStatus">Current Status *</Label>
            <Textarea
              id="currentStatus"
              placeholder="Describe the current status of the incident..."
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actionsTaken">Actions Taken</Label>
            <Textarea
              id="actionsTaken"
              placeholder="List the actions taken to contain and mitigate the incident..."
              value={actionsTaken}
              onChange={(e) => setActionsTaken(e.target.value)}
              rows={3}
            />
          </div>

          {(reportType === 'intermediate' || reportType === 'final') && (
            <div className="space-y-2">
              <Label htmlFor="rootCauseAnalysis">Root Cause Analysis</Label>
              <Textarea
                id="rootCauseAnalysis"
                placeholder="Describe the root cause of the incident..."
                value={rootCauseAnalysis}
                onChange={(e) => setRootCauseAnalysis(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {reportType !== 'final' && (
            <div className="space-y-2">
              <Label htmlFor="estimatedResolution">Estimated Resolution Time</Label>
              <Input
                id="estimatedResolution"
                type="datetime-local"
                value={estimatedResolution}
                onChange={(e) => setEstimatedResolution(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Any additional information relevant to the report..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* DORA Compliance Notice */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-primary">DORA Article 19 Compliance</p>
              <p className="text-sm text-muted-foreground mt-1">
                {reportType === 'initial' && (
                  <>
                    Initial reports must be submitted within 4 hours of classifying an incident as major.
                    This report will document the initial assessment and immediate response actions.
                  </>
                )}
                {reportType === 'intermediate' && (
                  <>
                    Intermediate reports must be submitted within 72 hours. Include updates on
                    containment, impact assessment, and expected resolution timeline.
                  </>
                )}
                {reportType === 'final' && (
                  <>
                    Final reports are due within 1 month of incident resolution. Include comprehensive
                    root cause analysis, lessons learned, and preventive measures implemented.
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Create Report
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
