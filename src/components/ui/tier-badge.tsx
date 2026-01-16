'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

export type VendorTier = 1 | 2 | 3;

interface TierBadgeProps {
  /** Vendor tier level (1 = critical, 2 = important, 3 = standard) */
  tier: VendorTier;
  /** Is this a Critical Third Party Provider (CTPP) under DORA */
  ctpp?: boolean;
  /** Show tier label */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TIER_CONFIG: Record<VendorTier, { color: string; bg: string; icon: string; label: string }> = {
  1: {
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    icon: 'text-blue-500',
    label: 'Critical',
  },
  2: {
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    icon: 'text-amber-500',
    label: 'Important',
  },
  3: {
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800/40',
    icon: 'text-slate-400',
    label: 'Standard',
  },
};

const SIZE_CONFIG = {
  sm: { badge: 'px-1.5 py-0.5 text-xs', icon: 'h-3 w-3', gap: 'gap-1' },
  md: { badge: 'px-2 py-1 text-sm', icon: 'h-3.5 w-3.5', gap: 'gap-1.5' },
  lg: { badge: 'px-2.5 py-1.5 text-base', icon: 'h-4 w-4', gap: 'gap-2' },
};

export function TierBadge({
  tier,
  ctpp = false,
  showLabel = false,
  size = 'md',
  className,
}: TierBadgeProps) {
  const tierConfig = TIER_CONFIG[tier];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <span className={cn('inline-flex items-center', sizeConfig.gap, className)}>
      {/* Main tier badge */}
      <span
        className={cn(
          'inline-flex items-center font-semibold rounded-md',
          sizeConfig.badge,
          sizeConfig.gap,
          tierConfig.bg,
          tierConfig.color
        )}
      >
        <TierIcon tier={tier} className={sizeConfig.icon} />
        <span>T{tier}</span>
        {showLabel && <span className="font-normal opacity-80">{tierConfig.label}</span>}
      </span>

      {/* CTPP indicator */}
      {ctpp && (
        <span
          className={cn(
            'inline-flex items-center font-medium rounded-md',
            'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
            sizeConfig.badge,
            'gap-0.5'
          )}
          title="Critical Third Party Provider under DORA"
        >
          <AlertTriangle className={cn(sizeConfig.icon, 'text-red-500')} />
          <span className="text-[10px]">CTPP</span>
        </span>
      )}
    </span>
  );
}

// Tier icon (diamond shape with fills)
function TierIcon({ tier, className }: { tier: VendorTier; className?: string }) {
  const colors = {
    1: 'fill-blue-500',
    2: 'fill-amber-500',
    3: 'fill-slate-400',
  };

  return (
    <svg
      viewBox="0 0 10 10"
      className={cn('shrink-0', colors[tier], className)}
      aria-hidden="true"
    >
      <path d="M5 0 L10 5 L5 10 L0 5 Z" />
    </svg>
  );
}

// Compact inline tier indicator
export function TierIndicator({
  tier,
  className,
}: {
  tier: VendorTier;
  className?: string;
}) {
  const tierConfig = TIER_CONFIG[tier];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        tierConfig.color,
        className
      )}
    >
      <TierIcon tier={tier} className="h-2.5 w-2.5" />
      <span>T{tier}</span>
    </span>
  );
}
