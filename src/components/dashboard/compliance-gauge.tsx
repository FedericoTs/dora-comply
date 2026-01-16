'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressMini } from '@/components/ui/progress-mini';

// ============================================================================
// Types
// ============================================================================

export interface CompliancePillar {
  id: string;
  name: string;
  shortName: string;
  score: number;
  href?: string;
}

interface ComplianceGaugeProps {
  /** Overall compliance score (0-100) */
  score: number;
  /** Label for the gauge */
  label?: string;
  /** Individual pillar scores */
  pillars?: CompliancePillar[];
  /** Link when clicking the gauge */
  href?: string;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-teal-500';
  if (score >= 40) return 'text-amber-500';
  if (score >= 20) return 'text-orange-500';
  return 'text-red-500';
}

function getStrokeColor(score: number): string {
  if (score >= 80) return 'stroke-emerald-500';
  if (score >= 60) return 'stroke-teal-500';
  if (score >= 40) return 'stroke-amber-500';
  if (score >= 20) return 'stroke-orange-500';
  return 'stroke-red-500';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Needs Work';
  return 'Critical';
}

// ============================================================================
// Circular Gauge Component
// ============================================================================

function CircularGauge({
  score,
  size = 160,
  strokeWidth = 12,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn('transition-all duration-700 ease-out', getStrokeColor(score))}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-4xl font-bold', getScoreColor(score))}>
          {Math.round(score)}
        </span>
        <span className="text-sm text-muted-foreground">
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ComplianceGauge({
  score,
  label = 'DORA Compliance',
  pillars,
  href,
  className,
}: ComplianceGaugeProps) {
  const gaugeContent = (
    <div className="flex flex-col items-center">
      <CircularGauge score={score} />
      {label && (
        <div className="mt-2 text-sm font-medium text-center">{label}</div>
      )}
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Compliance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Main Gauge */}
          {href ? (
            <Link href={href} className="hover:opacity-80 transition-opacity">
              {gaugeContent}
            </Link>
          ) : (
            gaugeContent
          )}

          {/* Pillar Breakdown */}
          {pillars && pillars.length > 0 && (
            <div className="flex-1 w-full space-y-3">
              {pillars.map((pillar) => (
                <PillarRow key={pillar.id} pillar={pillar} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PillarRow({ pillar }: { pillar: CompliancePillar }) {
  const content = (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium truncate">{pillar.shortName}</span>
        <span className={cn('text-sm font-bold', getScoreColor(pillar.score))}>
          {pillar.score}%
        </span>
      </div>
      <ProgressMini
        value={pillar.score}
        size="xs"
        width="w-full"
        showValue={false}
      />
    </div>
  );

  if (pillar.href) {
    return (
      <Link
        href={pillar.href}
        className="block hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors"
      >
        {content}
      </Link>
    );
  }

  return content;
}

// ============================================================================
// Mini Gauge (for inline use)
// ============================================================================

export function ComplianceGaugeMini({
  score,
  label,
  className,
}: {
  score: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative" style={{ width: 48, height: 48 }}>
        <svg className="transform -rotate-90" width={48} height={48}>
          <circle
            cx={24}
            cy={24}
            r={20}
            fill="none"
            strokeWidth={4}
            className="stroke-muted"
          />
          <circle
            cx={24}
            cy={24}
            r={20}
            fill="none"
            strokeWidth={4}
            strokeLinecap="round"
            className={cn('transition-all duration-500', getStrokeColor(score))}
            style={{
              strokeDasharray: 125.6, // 2 * PI * 20
              strokeDashoffset: 125.6 - (score / 100) * 125.6,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-sm font-bold', getScoreColor(score))}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      {label && (
        <div className="text-sm text-muted-foreground">{label}</div>
      )}
    </div>
  );
}

// ============================================================================
// Sample Data Generator
// ============================================================================

export function getDefaultDORAPillars(scores?: {
  ictRisk?: number;
  incidents?: number;
  testing?: number;
  tprm?: number;
  infoSharing?: number;
}): CompliancePillar[] {
  return [
    {
      id: 'ict-risk',
      name: 'ICT Risk Management',
      shortName: 'ICT Risk Mgmt',
      score: scores?.ictRisk ?? 75,
      href: '/compliance/trends?pillar=ict-risk',
    },
    {
      id: 'incidents',
      name: 'Incident Management',
      shortName: 'Incident Mgmt',
      score: scores?.incidents ?? 60,
      href: '/compliance/trends?pillar=incidents',
    },
    {
      id: 'testing',
      name: 'Resilience Testing',
      shortName: 'Resilience',
      score: scores?.testing ?? 40,
      href: '/compliance/trends?pillar=testing',
    },
    {
      id: 'tprm',
      name: 'Third Party Risk Management',
      shortName: 'TPRM',
      score: scores?.tprm ?? 80,
      href: '/compliance/trends?pillar=tprm',
    },
    {
      id: 'info-sharing',
      name: 'Information Sharing',
      shortName: 'Info Sharing',
      score: scores?.infoSharing ?? 55,
      href: '/compliance/trends?pillar=info-sharing',
    },
  ];
}
