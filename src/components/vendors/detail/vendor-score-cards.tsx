'use client';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Shield,
  AlertTriangle,
  FileCheck,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { GradeBadge, scoreToGrade } from '@/components/ui/grade-badge';
import { getVendorHealthBreakdown } from '@/lib/vendors/vendor-health-utils';
import type { Vendor, VendorWithRelations } from '@/lib/vendors/types';

interface VendorScoreCardsProps {
  vendor: Vendor | VendorWithRelations;
  className?: string;
}

interface ScoreCardProps {
  label: string;
  score: number | null;
  maxScore?: number;
  icon: React.ElementType;
  iconBgColor: string;
  iconColor: string;
  scoreColor: string;
  bgColor: string;
  trend?: 'up' | 'down' | 'stable';
  tooltip?: string;
  showGrade?: boolean;
}

function ScoreCard({
  label,
  score,
  maxScore = 100,
  icon: Icon,
  iconBgColor,
  iconColor,
  scoreColor,
  bgColor,
  trend,
  tooltip,
  showGrade = false,
}: ScoreCardProps) {
  const percentage = score !== null ? Math.round((score / maxScore) * 100) : null;
  const grade = score !== null ? scoreToGrade(score) : null;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'relative p-4 rounded-xl border transition-all hover:shadow-md cursor-default',
            bgColor
          )}>
            {/* Icon with explicit background */}
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', iconBgColor)}>
              <Icon className={cn('h-5 w-5', iconColor)} />
            </div>

            {/* Label */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {label}
            </p>

            {/* Score Display */}
            <div className="flex items-end gap-2">
              {score !== null ? (
                <>
                  {showGrade && grade ? (
                    <GradeBadge grade={grade} size="lg" />
                  ) : (
                    <span className={cn('text-3xl font-bold', scoreColor)}>
                      {score}
                    </span>
                  )}
                  {!showGrade && (
                    <span className="text-sm text-muted-foreground mb-1">
                      / {maxScore}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-2xl font-medium text-muted-foreground">—</span>
              )}

              {/* Trend indicator */}
              {trend && score !== null && (
                <div className={cn(
                  'flex items-center gap-0.5 text-xs font-medium ml-auto',
                  trend === 'up' && 'text-emerald-600',
                  trend === 'down' && 'text-red-600',
                  trend === 'stable' && 'text-gray-400'
                )}>
                  <TrendIcon className="h-3 w-3" />
                </div>
              )}
            </div>

            {/* Progress bar */}
            {percentage !== null && (
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    percentage >= 70 && 'bg-emerald-500',
                    percentage >= 40 && percentage < 70 && 'bg-amber-500',
                    percentage < 40 && 'bg-red-500'
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            )}
          </div>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export function VendorScoreCards({ vendor, className }: VendorScoreCardsProps) {
  // Use centralized health calculation
  const health = getVendorHealthBreakdown(vendor);
  const { scores, components } = health;

  // Determine risk score color based on value
  const riskScoreColor = scores.risk === null
    ? 'text-muted-foreground'
    : scores.risk >= 70
      ? 'text-emerald-600'
      : scores.risk >= 40
        ? 'text-amber-600'
        : 'text-red-600';

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {/* Overall Health Score */}
      <ScoreCard
        label="Overall Health"
        score={scores.overall}
        icon={Activity}
        iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
        iconColor="text-emerald-600"
        scoreColor="text-emerald-600"
        bgColor="bg-card border-emerald-200 dark:border-emerald-800"
        tooltip="Combined score based on risk assessment, compliance status, and documentation completeness"
      />

      {/* Risk Score */}
      <ScoreCard
        label="Risk Score"
        score={scores.risk}
        icon={AlertTriangle}
        iconBgColor={scores.risk !== null && scores.risk >= 70 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}
        iconColor={scores.risk !== null && scores.risk >= 70 ? 'text-emerald-600' : 'text-amber-600'}
        scoreColor={riskScoreColor}
        bgColor="bg-card"
        showGrade={true}
        tooltip={vendor.external_risk_score
          ? `Internal: ${scores.risk ?? 'N/A'} | External: ${vendor.external_risk_score} (${vendor.external_risk_grade ?? 'N/A'})`
          : 'Risk assessment score based on vendor evaluation'
        }
      />

      {/* Compliance Score */}
      <ScoreCard
        label="Compliance"
        score={scores.compliance}
        icon={Shield}
        iconBgColor="bg-blue-100 dark:bg-blue-900/30"
        iconColor="text-blue-600"
        scoreColor="text-blue-600"
        bgColor="bg-card"
        tooltip={`LEI: ${components.hasLei ? '✓' : '✗'}${components.leiVerified ? ' (verified)' : ''} | Assessment: ${components.hasAssessment ? '✓' : '✗'} | Monitoring: ${components.hasMonitoring ? '✓' : '✗'}`}
      />

      {/* Documentation Score */}
      <ScoreCard
        label="Documentation"
        score={scores.documentation}
        icon={FileCheck}
        iconBgColor="bg-purple-100 dark:bg-purple-900/30"
        iconColor="text-purple-600"
        scoreColor="text-purple-600"
        bgColor="bg-card"
        tooltip={`Contacts: ${components.contactsCount} | Documents: ${components.documentsCount} | Contracts: ${components.contractsCount} | SOC 2: ${components.hasParsedSoc2 ? '✓' : '✗'}`}
      />
    </div>
  );
}

// Compact version for list views
export function VendorScoreCompact({ vendor }: { vendor: Vendor | VendorWithRelations }) {
  const riskScore = vendor.risk_score ?? null;
  const grade = riskScore !== null ? scoreToGrade(riskScore) : null;

  return (
    <div className="flex items-center gap-3">
      {grade ? (
        <GradeBadge grade={grade} size="sm" />
      ) : (
        <span className="text-xs text-muted-foreground">No score</span>
      )}
      {riskScore !== null && (
        <span className="text-sm text-muted-foreground">
          {riskScore}/100
        </span>
      )}
    </div>
  );
}
