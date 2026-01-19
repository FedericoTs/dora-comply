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
  ScrollText,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
} from 'lucide-react';
import { GradeBadge, scoreToGrade } from '@/components/ui/grade-badge';
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
  color: string;
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
  color,
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
            {/* Icon */}
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', color.replace('text-', 'bg-').replace('600', '100'), 'dark:bg-opacity-20')}>
              <Icon className={cn('h-5 w-5', color)} />
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
                    <span className={cn('text-3xl font-bold', color)}>
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
                    percentage >= 80 && 'bg-emerald-500',
                    percentage >= 60 && percentage < 80 && 'bg-amber-500',
                    percentage < 60 && 'bg-red-500'
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
  // Calculate scores
  const riskScore = vendor.risk_score ?? null;
  const externalScore = vendor.external_risk_score ?? null;

  // Calculate compliance score based on available data
  const hasLei = !!vendor.lei;
  const hasAssessment = !!vendor.last_assessment_date;
  const hasCriticalFunctions = (vendor.critical_functions?.length ?? 0) > 0;
  const hasMonitoring = vendor.monitoring_enabled ?? false;

  let complianceScore = 0;
  if (hasLei) complianceScore += 25;
  if (hasAssessment) complianceScore += 30;
  if (hasCriticalFunctions || !vendor.supports_critical_function) complianceScore += 25;
  if (hasMonitoring) complianceScore += 20;

  // Calculate documentation score
  const vendorWithRelations = vendor as VendorWithRelations;
  const docsCount = vendorWithRelations.documents_count ?? 0;
  const contractsCount = vendorWithRelations.contracts_count ?? 0;
  const contactsCount = vendorWithRelations.contacts?.length ?? 0;
  const hasParsedSoc2 = vendorWithRelations.has_parsed_soc2 ?? false;

  let docsScore = 0;
  if (contactsCount > 0) docsScore += 25;
  if (docsCount > 0) docsScore += 25;
  if (contractsCount > 0) docsScore += 25;
  if (hasParsedSoc2) docsScore += 25;

  // Overall health score (weighted average)
  const overallScore = Math.round(
    (riskScore ?? 50) * 0.35 +
    complianceScore * 0.35 +
    docsScore * 0.30
  );

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {/* Overall Health Score */}
      <ScoreCard
        label="Overall Health"
        score={overallScore}
        icon={Activity}
        color="text-primary"
        bgColor="bg-card border-primary/20"
        tooltip="Combined score based on risk assessment, compliance status, and documentation completeness"
      />

      {/* Risk Score */}
      <ScoreCard
        label="Risk Score"
        score={riskScore}
        icon={AlertTriangle}
        color={riskScore !== null && riskScore >= 60 ? 'text-emerald-600' : 'text-amber-600'}
        bgColor="bg-card"
        showGrade={true}
        tooltip={externalScore
          ? `Internal: ${riskScore ?? 'N/A'} | External: ${externalScore} (${vendor.external_risk_grade ?? 'N/A'})`
          : 'Risk assessment score based on vendor evaluation'
        }
      />

      {/* Compliance Score */}
      <ScoreCard
        label="Compliance"
        score={complianceScore}
        icon={Shield}
        color="text-blue-600"
        bgColor="bg-card"
        tooltip={`LEI: ${hasLei ? '✓' : '✗'} | Assessment: ${hasAssessment ? '✓' : '✗'} | Monitoring: ${hasMonitoring ? '✓' : '✗'}`}
      />

      {/* Documentation Score */}
      <ScoreCard
        label="Documentation"
        score={docsScore}
        icon={FileCheck}
        color="text-purple-600"
        bgColor="bg-card"
        tooltip={`Contacts: ${contactsCount > 0 ? '✓' : '✗'} | Documents: ${docsCount > 0 ? '✓' : '✗'} | Contracts: ${contractsCount > 0 ? '✓' : '✗'} | SOC 2: ${hasParsedSoc2 ? '✓' : '✗'}`}
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
