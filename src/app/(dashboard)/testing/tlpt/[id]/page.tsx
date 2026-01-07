/**
 * TLPT Detail Page
 *
 * View and manage TLPT engagements per DORA Article 26
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Target,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  Shield,
  AlertTriangle,
  Edit,
  Building2,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { getTLPTById } from '@/lib/testing/queries';
import {
  getTLPTFrameworkLabel,
  getTLPTStatusLabel,
  getTLPTComplianceStatus,
  getDaysUntilDue,
} from '@/lib/testing/types';

interface TLPTDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TLPTDetailPageProps) {
  const { id } = await params;
  const { data: tlpt } = await getTLPTById(id);

  return {
    title: tlpt ? `${tlpt.name} | TLPT` : 'TLPT Not Found',
    description: tlpt ? 'TLPT engagement details' : 'TLPT engagement not found',
  };
}

// TIBER-EU Phase Progress
function TIBERPhaseProgress({
  tlpt,
}: {
  tlpt: NonNullable<Awaited<ReturnType<typeof getTLPTById>>['data']>;
}) {
  const phases = [
    {
      key: 'planning',
      name: 'Planning',
      description: 'Scope definition and preparation',
      completed: tlpt.scope_defined,
      active: tlpt.status === 'planning',
      date: tlpt.scope_definition_date,
    },
    {
      key: 'threat_intelligence',
      name: 'Threat Intelligence',
      description: 'TI provider analysis',
      completed: tlpt.ti_report_received,
      active: tlpt.status === 'threat_intelligence',
      date: tlpt.ti_end_date,
    },
    {
      key: 'red_team',
      name: 'Red Team Test',
      description: 'Active testing phase',
      completed: tlpt.rt_report_received,
      active: tlpt.status === 'red_team_test',
      date: tlpt.rt_end_date,
    },
    {
      key: 'closure',
      name: 'Closure',
      description: 'Purple team and remediation',
      completed: tlpt.status === 'completed' || tlpt.attestation_date !== null,
      active: tlpt.status === 'closure' || tlpt.status === 'remediation',
      date: tlpt.attestation_date,
    },
  ];

  const completedPhases = phases.filter((p) => p.completed).length;
  const progress = (completedPhases / phases.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">TIBER-EU Progress</CardTitle>
        <CardDescription>
          {completedPhases} of {phases.length} phases complete
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />

        <div className="space-y-4">
          {phases.map((phase, index) => (
            <div
              key={phase.key}
              className={`flex items-start gap-3 ${
                phase.completed
                  ? 'text-primary'
                  : phase.active
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  phase.completed
                    ? 'bg-primary text-primary-foreground'
                    : phase.active
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {phase.completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{phase.name}</p>
                <p className="text-xs text-muted-foreground">{phase.description}</p>
                {phase.date && (
                  <p className="text-xs mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(phase.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// TLPT Info Card
function TLPTInfoCard({
  tlpt,
}: {
  tlpt: NonNullable<Awaited<ReturnType<typeof getTLPTById>>['data']>;
}) {
  const complianceStatus = getTLPTComplianceStatus(tlpt.next_tlpt_due);
  const daysUntil = getDaysUntilDue(tlpt.next_tlpt_due);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {tlpt.name}
            </CardTitle>
            <CardDescription className="font-mono">{tlpt.tlpt_ref}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getTLPTFrameworkLabel(tlpt.framework)}</Badge>
            <Badge
              variant={
                tlpt.status === 'completed'
                  ? 'default'
                  : tlpt.status === 'planning'
                  ? 'outline'
                  : 'secondary'
              }
            >
              {getTLPTStatusLabel(tlpt.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compliance Status */}
        <div
          className={`p-4 rounded-lg ${
            complianceStatus === 'overdue'
              ? 'bg-destructive/10 border border-destructive/30'
              : complianceStatus === 'due_soon'
              ? 'bg-orange-500/10 border border-orange-500/30'
              : complianceStatus === 'compliant'
              ? 'bg-primary/10 border border-primary/30'
              : 'bg-muted'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {complianceStatus === 'overdue' ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : complianceStatus === 'due_soon' ? (
                <Clock className="h-5 w-5 text-orange-500" />
              ) : complianceStatus === 'compliant' ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Calendar className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-medium">
                {complianceStatus === 'overdue'
                  ? 'Overdue'
                  : complianceStatus === 'due_soon'
                  ? 'Due Soon'
                  : complianceStatus === 'compliant'
                  ? 'Compliant'
                  : 'Not Scheduled'}
              </span>
            </div>
            {daysUntil !== null && (
              <span
                className={`text-sm ${
                  daysUntil < 0
                    ? 'text-destructive'
                    : daysUntil < 180
                    ? 'text-orange-500'
                    : 'text-muted-foreground'
                }`}
              >
                {daysUntil < 0
                  ? `${Math.abs(daysUntil)} days overdue`
                  : `${daysUntil} days remaining`}
              </span>
            )}
          </div>
          {tlpt.next_tlpt_due && (
            <p className="text-sm text-muted-foreground mt-2">
              Next TLPT due: {new Date(tlpt.next_tlpt_due).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Key Dates */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Last TLPT</p>
            <p className="text-sm flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {tlpt.last_tlpt_date
                ? new Date(tlpt.last_tlpt_date).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Scenarios Tested</p>
            <p className="text-sm font-medium">{tlpt.scenarios_tested || 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
            <p className="text-sm font-medium">
              {tlpt.scenarios_tested > 0
                ? `${Math.round((tlpt.scenarios_successful / tlpt.scenarios_tested) * 100)}%`
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Findings</p>
            <p className="text-sm font-medium flex items-center gap-1">
              {tlpt.findings_count || 0}
              {tlpt.critical_findings_count > 0 && (
                <Badge variant="destructive" className="text-xs ml-1">
                  {tlpt.critical_findings_count} critical
                </Badge>
              )}
            </p>
          </div>
        </div>

        {/* Programme Link */}
        {tlpt.programme && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-1">Programme</p>
            <Link
              href={`/testing/programmes/${tlpt.programme.id}`}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <FileText className="h-3.5 w-3.5" />
              {tlpt.programme.name}
            </Link>
          </div>
        )}

        {/* Scope */}
        {(tlpt.scope_systems?.length > 0 || tlpt.scope_critical_functions?.length > 0) && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Scope</h4>
            {tlpt.scope_systems && tlpt.scope_systems.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">Systems in Scope</p>
                <div className="flex flex-wrap gap-1">
                  {tlpt.scope_systems.map((sys) => (
                    <Badge key={sys} variant="outline" className="text-xs">
                      {sys}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {tlpt.scope_critical_functions && tlpt.scope_critical_functions.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Critical Functions</p>
                <div className="flex flex-wrap gap-1">
                  {tlpt.scope_critical_functions.map((func) => (
                    <Badge key={func} variant="secondary" className="text-xs">
                      {func}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Providers Card
function ProvidersCard({
  tlpt,
}: {
  tlpt: NonNullable<Awaited<ReturnType<typeof getTLPTById>>['data']>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Test Providers
        </CardTitle>
        <CardDescription>TI and Red Team providers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Threat Intelligence Provider */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Threat Intelligence
          </h4>
          {tlpt.ti_provider ? (
            <div className="pl-6 space-y-1">
              <p className="text-sm">{tlpt.ti_provider}</p>
              {tlpt.ti_provider_accreditation && (
                <p className="text-xs text-muted-foreground">
                  Accreditation: {tlpt.ti_provider_accreditation}
                </p>
              )}
              {(tlpt.ti_start_date || tlpt.ti_end_date) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {tlpt.ti_start_date && new Date(tlpt.ti_start_date).toLocaleDateString()}
                  {tlpt.ti_start_date && tlpt.ti_end_date && ' - '}
                  {tlpt.ti_end_date && new Date(tlpt.ti_end_date).toLocaleDateString()}
                </p>
              )}
              {tlpt.ti_report_received && (
                <Badge variant="default" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Report Received
                </Badge>
              )}
            </div>
          ) : (
            <p className="pl-6 text-sm text-muted-foreground">Not assigned</p>
          )}
        </div>

        {/* Red Team Provider */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Red Team
          </h4>
          {tlpt.rt_provider ? (
            <div className="pl-6 space-y-1">
              <p className="text-sm">{tlpt.rt_provider}</p>
              {tlpt.rt_provider_accreditation && (
                <p className="text-xs text-muted-foreground">
                  Accreditation: {tlpt.rt_provider_accreditation}
                </p>
              )}
              {(tlpt.rt_start_date || tlpt.rt_end_date) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {tlpt.rt_start_date && new Date(tlpt.rt_start_date).toLocaleDateString()}
                  {tlpt.rt_start_date && tlpt.rt_end_date && ' - '}
                  {tlpt.rt_end_date && new Date(tlpt.rt_end_date).toLocaleDateString()}
                </p>
              )}
              {tlpt.rt_report_received && (
                <Badge variant="default" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Report Received
                </Badge>
              )}
            </div>
          ) : (
            <p className="pl-6 text-sm text-muted-foreground">Not assigned</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Regulator Notification Card
function RegulatorCard({
  tlpt,
}: {
  tlpt: NonNullable<Awaited<ReturnType<typeof getTLPTById>>['data']>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Regulator Notification
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tlpt.regulator_notified ? (
          <div className="space-y-2">
            <Badge variant="default" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Notified
            </Badge>
            {tlpt.regulator_notification_date && (
              <p className="text-sm flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(tlpt.regulator_notification_date).toLocaleDateString()}
              </p>
            )}
            {tlpt.regulator_reference && (
              <p className="text-xs text-muted-foreground">
                Reference: {tlpt.regulator_reference}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Regulator not yet notified</p>
            <p className="text-xs text-muted-foreground">
              Article 26 requires notification to competent authorities before TLPT commencement.
            </p>
          </div>
        )}

        {/* Attestation */}
        {tlpt.attestation_date && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Attestation</h4>
            <div className="space-y-1">
              <p className="text-sm flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(tlpt.attestation_date).toLocaleDateString()}
              </p>
              {tlpt.attestation_reference && (
                <p className="text-xs text-muted-foreground">
                  Reference: {tlpt.attestation_reference}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Article 26 Requirements
function Article26Card() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Article 26 Requirements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>TLPT every 3 years for significant entities</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>Use recognized frameworks (TIBER-EU)</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>Independent TI and RT providers</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>Cover critical functions and live systems</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>Report to competent authorities</span>
        </div>
      </CardContent>
    </Card>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <Skeleton className="h-96" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}

async function TLPTDetailContent({ id }: { id: string }) {
  const { data: tlpt, error } = await getTLPTById(id);

  if (error || !tlpt) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/testing" className="hover:underline">
              Resilience Testing
            </Link>
            <span>/</span>
            <Link href="/testing/tlpt" className="hover:underline">
              TLPT
            </Link>
            <span>/</span>
            <span>{tlpt.tlpt_ref}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{tlpt.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/testing/tlpt/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <TLPTInfoCard tlpt={tlpt} />
          <ProvidersCard tlpt={tlpt} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <TIBERPhaseProgress tlpt={tlpt} />
          <RegulatorCard tlpt={tlpt} />
          <Article26Card />
        </div>
      </div>
    </div>
  );
}

export default async function TLPTDetailPage({ params }: TLPTDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <TLPTDetailContent id={id} />
    </Suspense>
  );
}
