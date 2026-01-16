'use client';

/**
 * NIS2 Category Badge Component
 *
 * Displays a badge for NIS2 risk categories.
 */

import { cn } from '@/lib/utils';
import type { NIS2Category } from '@/lib/compliance/nis2-types';

const CATEGORY_CONFIG: Record<NIS2Category, { label: string; color: string }> = {
  governance: { label: 'Governance', color: 'bg-purple-100 text-purple-700' },
  risk_management: { label: 'Risk Management', color: 'bg-blue-100 text-blue-700' },
  incident_handling: { label: 'Incident Handling', color: 'bg-red-100 text-red-700' },
  business_continuity: { label: 'Business Continuity', color: 'bg-amber-100 text-amber-700' },
  supply_chain: { label: 'Supply Chain', color: 'bg-teal-100 text-teal-700' },
  reporting: { label: 'Reporting', color: 'bg-orange-100 text-orange-700' },
};

interface CategoryBadgeProps {
  category: NIS2Category;
  size?: 'sm' | 'md';
  className?: string;
}

export function CategoryBadge({
  category,
  size = 'md',
  className,
}: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category];

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-medium whitespace-nowrap',
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function getCategoryLabel(category: NIS2Category): string {
  return CATEGORY_CONFIG[category]?.label ?? category;
}
