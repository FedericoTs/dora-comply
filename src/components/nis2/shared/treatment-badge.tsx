'use client';

/**
 * Treatment Strategy Badge Component
 *
 * Displays a badge for risk treatment strategy.
 */

import { cn } from '@/lib/utils';
import type { TreatmentStrategy } from '@/lib/nis2/types';
import { Shield, ShieldCheck, ArrowRightLeft, XCircle } from 'lucide-react';

const TREATMENT_CONFIG: Record<TreatmentStrategy, {
  label: string;
  color: string;
  icon: typeof Shield;
}> = {
  mitigate: {
    label: 'Mitigate',
    color: 'bg-blue-100 text-blue-700',
    icon: Shield,
  },
  accept: {
    label: 'Accept',
    color: 'bg-emerald-100 text-emerald-700',
    icon: ShieldCheck,
  },
  transfer: {
    label: 'Transfer',
    color: 'bg-purple-100 text-purple-700',
    icon: ArrowRightLeft,
  },
  avoid: {
    label: 'Avoid',
    color: 'bg-slate-100 text-slate-700',
    icon: XCircle,
  },
};

interface TreatmentBadgeProps {
  strategy: TreatmentStrategy;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function TreatmentBadge({
  strategy,
  showIcon = false,
  size = 'md',
  className,
}: TreatmentBadgeProps) {
  const config = TREATMENT_CONFIG[strategy];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium',
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}

export function getTreatmentLabel(strategy: TreatmentStrategy): string {
  return TREATMENT_CONFIG[strategy]?.label ?? strategy;
}
