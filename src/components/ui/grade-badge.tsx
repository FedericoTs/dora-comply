'use client';

import { cn } from '@/lib/utils';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

interface GradeBadgeProps {
  /** Letter grade (A-F) */
  grade: Grade;
  /** Optional numeric score (0-100) */
  score?: number;
  /** Show the numeric score */
  showScore?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const GRADE_CONFIG: Record<Grade, { color: string; bg: string; text: string }> = {
  A: {
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'Excellent',
  },
  B: {
    color: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-100 dark:bg-teal-900/40',
    text: 'Good',
  },
  C: {
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'Fair',
  },
  D: {
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    text: 'Poor',
  },
  F: {
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'Critical',
  },
};

const SIZE_CONFIG = {
  sm: { badge: 'px-1.5 py-0.5 text-xs', gap: 'gap-1' },
  md: { badge: 'px-2 py-1 text-sm', gap: 'gap-1.5' },
  lg: { badge: 'px-2.5 py-1.5 text-base', gap: 'gap-2' },
};

export function GradeBadge({
  grade,
  score,
  showScore = true,
  size = 'md',
  className,
}: GradeBadgeProps) {
  const gradeConfig = GRADE_CONFIG[grade];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-md',
        sizeConfig.badge,
        sizeConfig.gap,
        gradeConfig.bg,
        gradeConfig.color,
        className
      )}
    >
      <span>{grade}</span>
      {showScore && score !== undefined && (
        <span className="font-normal opacity-80">({score})</span>
      )}
    </span>
  );
}

// Convert numeric score to letter grade
export function scoreToGrade(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// Inline variant showing just the grade dot + letter
export function GradeIndicator({
  grade,
  size = 'sm',
  className,
}: {
  grade: Grade;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const gradeConfig = GRADE_CONFIG[grade];

  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const dotColors: Record<Grade, string> = {
    A: 'bg-emerald-500',
    B: 'bg-teal-500',
    C: 'bg-amber-500',
    D: 'bg-orange-500',
    F: 'bg-red-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        gradeConfig.color,
        className
      )}
    >
      <span className={cn('rounded-full', dotSize, dotColors[grade])} />
      <span className={textSize}>{grade}</span>
    </span>
  );
}
