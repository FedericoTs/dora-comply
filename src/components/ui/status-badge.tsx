/**
 * StatusBadge Component
 *
 * Unified status badge component with configuration-driven rendering.
 * Replaces inline switch statements across the codebase.
 *
 * @example
 * // Basic usage
 * <StatusBadge status="success" />
 * <StatusBadge status="warning" label="Expiring" />
 *
 * // With icon
 * <StatusBadge status="error" icon={AlertTriangle} label="Expired" />
 *
 * // Custom configuration
 * <StatusBadge
 *   config={DOCUMENT_STATUS_CONFIG}
 *   status="processing"
 * />
 *
 * // Risk level
 * <RiskBadge level="critical" />
 *
 * // Compliance status
 * <ComplianceBadge status="partial" />
 */

import * as React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  Shield,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

// ============================================================================
// Types
// ============================================================================

export interface StatusConfig {
  label: string;
  icon?: LucideIcon;
  variant?: BadgeVariant;
  className?: string;
}

export type StatusMap<T extends string> = Record<T, StatusConfig>;

// ============================================================================
// Predefined Status Configurations
// ============================================================================

/** General status types */
export type GeneralStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'pending';

export const GENERAL_STATUS_CONFIG: StatusMap<GeneralStatus> = {
  success: {
    label: 'Success',
    icon: CheckCircle2,
    variant: 'outline',
    className: 'border-success text-success bg-success/10',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    variant: 'outline',
    className: 'border-warning text-warning bg-warning/10',
  },
  error: {
    label: 'Error',
    icon: XCircle,
    variant: 'destructive',
    className: '',
  },
  info: {
    label: 'Info',
    icon: Info,
    variant: 'outline',
    className: 'border-info text-info bg-info/10',
  },
  neutral: {
    label: 'Neutral',
    variant: 'secondary',
    className: '',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'outline',
    className: 'border-muted-foreground text-muted-foreground',
  },
};

/** Document status types */
export type DocumentStatus = 'active' | 'expiring' | 'expired' | 'processing' | 'failed' | 'pending';

export const DOCUMENT_STATUS_CONFIG: StatusMap<DocumentStatus> = {
  active: {
    label: 'Active',
    icon: CheckCircle2,
    variant: 'outline',
    className: 'border-success text-success bg-success/10',
  },
  expiring: {
    label: 'Expiring',
    icon: Clock,
    variant: 'outline',
    className: 'border-warning text-warning bg-warning/10',
  },
  expired: {
    label: 'Expired',
    icon: AlertTriangle,
    variant: 'destructive',
    className: '',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    variant: 'outline',
    className: 'border-info text-info bg-info/10',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    variant: 'destructive',
    className: '',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'secondary',
    className: '',
  },
};

/** Compliance status types */
export type ComplianceStatus = 'compliant' | 'partial' | 'gap' | 'not_assessed';

export const COMPLIANCE_STATUS_CONFIG: StatusMap<ComplianceStatus> = {
  compliant: {
    label: 'Compliant',
    icon: CheckCircle2,
    variant: 'outline',
    className: 'border-success text-success bg-success/10',
  },
  partial: {
    label: 'Partial',
    icon: AlertTriangle,
    variant: 'outline',
    className: 'border-warning text-warning bg-warning/10',
  },
  gap: {
    label: 'Gap',
    icon: XCircle,
    variant: 'destructive',
    className: '',
  },
  not_assessed: {
    label: 'Not Assessed',
    variant: 'secondary',
    className: '',
  },
};

/** Risk level types */
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export const RISK_LEVEL_CONFIG: StatusMap<RiskLevel> = {
  critical: {
    label: 'Critical',
    icon: AlertTriangle,
    variant: 'destructive',
    className: 'bg-red-500 text-white border-red-500',
  },
  high: {
    label: 'High',
    variant: 'outline',
    className: 'border-orange-500 text-orange-600 bg-orange-500/10',
  },
  medium: {
    label: 'Medium',
    variant: 'outline',
    className: 'border-yellow-500 text-yellow-600 bg-yellow-500/10',
  },
  low: {
    label: 'Low',
    variant: 'outline',
    className: 'border-blue-500 text-blue-600 bg-blue-500/10',
  },
};

/** Vendor tier types */
export type VendorTier = 'critical' | 'important' | 'standard';

export const VENDOR_TIER_CONFIG: StatusMap<VendorTier> = {
  critical: {
    label: 'Critical',
    icon: Shield,
    variant: 'outline',
    className: 'border-red-500 text-red-600 bg-red-500/10',
  },
  important: {
    label: 'Important',
    variant: 'outline',
    className: 'border-orange-500 text-orange-600 bg-orange-500/10',
  },
  standard: {
    label: 'Standard',
    variant: 'secondary',
    className: '',
  },
};

// ============================================================================
// Base StatusBadge Component
// ============================================================================

export interface StatusBadgeProps<T extends string = GeneralStatus> {
  /** Status key from the config */
  status: T;
  /** Optional custom label override */
  label?: string;
  /** Optional custom icon override */
  icon?: LucideIcon;
  /** Status configuration map */
  config?: StatusMap<T>;
  /** Show icon */
  showIcon?: boolean;
  /** Icon spins (for loading states) */
  iconSpin?: boolean;
  /** Additional class names */
  className?: string;
  /** Badge size */
  size?: 'sm' | 'default';
}

export function StatusBadge<T extends string = GeneralStatus>({
  status,
  label,
  icon: iconOverride,
  config = GENERAL_STATUS_CONFIG as StatusMap<T>,
  showIcon = true,
  iconSpin = false,
  className,
  size = 'default',
}: StatusBadgeProps<T>) {
  const statusConfig = config[status];

  if (!statusConfig) {
    return (
      <Badge variant="secondary" className={className}>
        {label ?? status}
      </Badge>
    );
  }

  const Icon = iconOverride ?? statusConfig.icon;
  const displayLabel = label ?? statusConfig.label;

  return (
    <Badge
      variant={statusConfig.variant}
      className={cn(
        'gap-1',
        statusConfig.className,
        size === 'sm' && 'text-[10px] px-1.5 py-0',
        className
      )}
    >
      {showIcon && Icon && (
        <Icon
          className={cn(
            size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3',
            iconSpin && 'animate-spin'
          )}
        />
      )}
      {displayLabel}
    </Badge>
  );
}

// ============================================================================
// Specialized Badge Components
// ============================================================================

export interface RiskBadgeProps {
  level: RiskLevel;
  label?: string;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'default';
}

export function RiskBadge({ level, ...props }: RiskBadgeProps) {
  return (
    <StatusBadge
      status={level}
      config={RISK_LEVEL_CONFIG}
      {...props}
    />
  );
}

export interface ComplianceBadgeProps {
  status: ComplianceStatus;
  label?: string;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'default';
}

export function ComplianceBadge({ status, ...props }: ComplianceBadgeProps) {
  return (
    <StatusBadge
      status={status}
      config={COMPLIANCE_STATUS_CONFIG}
      {...props}
    />
  );
}

export interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  label?: string;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'default';
}

export function DocumentStatusBadge({ status, ...props }: DocumentStatusBadgeProps) {
  return (
    <StatusBadge
      status={status}
      config={DOCUMENT_STATUS_CONFIG}
      iconSpin={status === 'processing'}
      {...props}
    />
  );
}

export interface VendorTierBadgeProps {
  tier: VendorTier;
  label?: string;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'default';
}

export function VendorTierBadge({ tier, ...props }: VendorTierBadgeProps) {
  return (
    <StatusBadge
      status={tier}
      config={VENDOR_TIER_CONFIG}
      {...props}
    />
  );
}

// ============================================================================
// Status Dot Component (for inline status indicators)
// ============================================================================

export interface StatusDotProps {
  status: GeneralStatus;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  pulse?: boolean;
  /** Show label next to dot */
  showLabel?: boolean;
  /** Custom label override */
  label?: string;
}

const DOT_COLORS: Record<GeneralStatus, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-destructive',
  info: 'bg-info',
  neutral: 'bg-muted-foreground',
  pending: 'bg-muted-foreground',
};

const DOT_SIZES = {
  sm: 'h-1.5 w-1.5',
  default: 'h-2 w-2',
  lg: 'h-3 w-3',
};

const DOT_TEXT_SIZES = {
  sm: 'text-xs',
  default: 'text-sm',
  lg: 'text-base',
};

export function StatusDot({ status, size = 'default', className, pulse, showLabel, label }: StatusDotProps) {
  const displayLabel = label ?? GENERAL_STATUS_CONFIG[status]?.label ?? status;

  if (showLabel) {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <span
          className={cn(
            'rounded-full',
            DOT_SIZES[size],
            DOT_COLORS[status],
            pulse && 'animate-pulse'
          )}
        />
        <span className={cn('font-medium capitalize', DOT_TEXT_SIZES[size])}>
          {displayLabel}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        DOT_SIZES[size],
        DOT_COLORS[status],
        pulse && 'animate-pulse',
        className
      )}
    />
  );
}

// ============================================================================
// Risk Status Dot Component (for risk level indicators)
// Replaces standalone status-dot.tsx
// ============================================================================

export type RiskStatusLevel = 'critical' | 'high' | 'medium' | 'low' | 'none' | 'info';

export interface RiskStatusDotProps {
  status: RiskStatusLevel;
  /** Show label next to dot */
  showLabel?: boolean;
  /** Custom label override */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Pulse animation for active/critical states */
  pulse?: boolean;
  className?: string;
}

const RISK_DOT_CONFIG: Record<RiskStatusLevel, { color: string; bg: string; label: string }> = {
  critical: {
    color: 'bg-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
    label: 'Critical',
  },
  high: {
    color: 'bg-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'High',
  },
  medium: {
    color: 'bg-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Medium',
  },
  low: {
    color: 'bg-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    label: 'Low',
  },
  none: {
    color: 'bg-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800/30',
    label: 'None',
  },
  info: {
    color: 'bg-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Info',
  },
};

const RISK_DOT_SIZES = {
  sm: { dot: 'h-2 w-2', text: 'text-xs', gap: 'gap-1' },
  md: { dot: 'h-2.5 w-2.5', text: 'text-sm', gap: 'gap-1.5' },
  lg: { dot: 'h-3 w-3', text: 'text-base', gap: 'gap-2' },
};

export function RiskStatusDot({
  status,
  showLabel = false,
  label,
  size = 'md',
  pulse = false,
  className,
}: RiskStatusDotProps) {
  const config = RISK_DOT_CONFIG[status];
  const sizeConfig = RISK_DOT_SIZES[size];

  return (
    <span
      className={cn(
        'inline-flex items-center',
        sizeConfig.gap,
        className
      )}
    >
      <span className="relative flex">
        <span
          className={cn(
            'rounded-full',
            sizeConfig.dot,
            config.color,
            pulse && 'animate-pulse'
          )}
        />
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              config.color
            )}
          />
        )}
      </span>
      {showLabel && (
        <span className={cn('font-medium', sizeConfig.text)}>
          {label || config.label}
        </span>
      )}
    </span>
  );
}

// Utility function to convert numeric risk score to status level
export function scoreToRiskStatus(score: number, max: number = 25): RiskStatusLevel {
  const percentage = (score / max) * 100;
  if (percentage >= 80) return 'critical';
  if (percentage >= 60) return 'high';
  if (percentage >= 40) return 'medium';
  if (percentage >= 20) return 'low';
  return 'none';
}

// Risk level based on raw score (1-25 scale)
export function riskScoreToRiskStatus(score: number): RiskStatusLevel {
  if (score >= 16) return 'critical';
  if (score >= 10) return 'high';
  if (score >= 5) return 'medium';
  if (score >= 1) return 'low';
  return 'none';
}
