'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Shield,
  AlertCircle,
  Network,
  Users,
  Eye,
  ChevronRight,
  Building2,
  Database,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParsedSOC2Summary } from './types';

interface CompletedCardProps {
  documentId: string;
  vendorId?: string | null;
  analysis: ParsedSOC2Summary;
}

const OPINION_BADGE = {
  unqualified: { label: 'Clean Opinion', color: 'bg-success text-white' },
  qualified: { label: 'Qualified', color: 'bg-warning text-white' },
  adverse: { label: 'Adverse', color: 'bg-destructive text-white' },
} as const;

export function CompletedCard({ documentId, vendorId, analysis }: CompletedCardProps) {
  const controlsCount = analysis.controls?.length || 0;
  const exceptionsCount = analysis.exceptions?.length || 0;
  const subserviceCount = analysis.subservice_orgs?.length || 0;
  const cuecsCount = analysis.cuecs?.length || 0;
  const confidence = Math.round((analysis.confidence_scores?.overall || 0) * 100);

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            SOC 2 Analysis Complete
          </CardTitle>
          <Badge className={cn(OPINION_BADGE[analysis.opinion]?.color)}>
            {OPINION_BADGE[analysis.opinion]?.label || analysis.opinion}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Report Info */}
        <ReportInfo analysis={analysis} />

        {/* Stats Grid */}
        <StatsGrid
          controlsCount={controlsCount}
          exceptionsCount={exceptionsCount}
          subserviceCount={subserviceCount}
          cuecsCount={cuecsCount}
        />

        {/* AI Confidence */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">AI Confidence</span>
          <div className="flex items-center gap-2">
            <Progress value={confidence} className="w-20 h-2" />
            <span className="font-medium">{confidence}%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <ActionButtons documentId={documentId} vendorId={vendorId} />

        {/* Next Step: Populate RoI CTA */}
        <PopulateRoiCta documentId={documentId} />

        {/* Parsed timestamp */}
        <p className="text-xs text-center text-muted-foreground">
          Parsed {new Date(analysis.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

function ReportInfo({ analysis }: { analysis: ParsedSOC2Summary }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Type</span>
        <Badge variant="outline">
          {analysis.report_type === 'type2' ? 'Type II' : 'Type I'}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Audit Firm</span>
        <span className="text-sm font-medium">{analysis.audit_firm}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Period</span>
        <span className="text-sm">
          {new Date(analysis.period_start).toLocaleDateString()} -{' '}
          {new Date(analysis.period_end).toLocaleDateString()}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Criteria</span>
        <div className="flex flex-wrap gap-1 justify-end">
          {analysis.criteria?.map((c) => (
            <Badge key={c} variant="secondary" className="text-xs capitalize">
              {c.replace('_', ' ')}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatsGridProps {
  controlsCount: number;
  exceptionsCount: number;
  subserviceCount: number;
  cuecsCount: number;
}

function StatsGrid({ controlsCount, exceptionsCount, subserviceCount, cuecsCount }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        icon={Shield}
        value={controlsCount}
        label="Controls Extracted"
        colorClass="text-success"
      />
      <StatCard
        icon={AlertCircle}
        value={exceptionsCount}
        label="Exceptions Found"
        colorClass={exceptionsCount > 0 ? 'text-warning' : 'text-success'}
      />
      <StatCard
        icon={Network}
        value={subserviceCount}
        label="Subservice Orgs"
        colorClass="text-info"
      />
      <StatCard
        icon={Users}
        value={cuecsCount}
        label="CUECs"
        colorClass="text-muted-foreground"
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  colorClass: string;
}

function StatCard({ icon: Icon, value, label, colorClass }: StatCardProps) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <div className={cn('flex items-center justify-center gap-2', colorClass)}>
        <Icon className="h-4 w-4" />
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function ActionButtons({ documentId, vendorId }: { documentId: string; vendorId?: string | null }) {
  return (
    <div className="flex flex-col gap-2">
      <Button asChild className="w-full gap-2">
        <Link href={`/documents/${documentId}/soc2-analysis`}>
          <Eye className="h-4 w-4" />
          View Full Analysis
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>

      {vendorId && (
        <Button variant="outline" asChild className="w-full gap-2">
          <Link href={`/vendors/${vendorId}?tab=compliance`}>
            <Building2 className="h-4 w-4" />
            View DORA Mapping
          </Link>
        </Button>
      )}
    </div>
  );
}

function PopulateRoiCta({ documentId }: { documentId: string }) {
  return (
    <div className="border-t pt-4 mt-2">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">Next Step: Populate Register of Information</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Use this SOC 2 data to auto-populate vendor details, subservice organizations,
              and service functions in your DORA Register of Information.
            </p>
            <Button size="sm" className="mt-3 gap-2" asChild>
              <Link href={`/roi?populateDoc=${documentId}`}>
                <Sparkles className="h-3.5 w-3.5" />
                Populate RoI Now
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
