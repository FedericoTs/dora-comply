/**
 * Pace Calculator for RoI Progress
 *
 * Calculates completion velocity and deadline projections
 */

export interface ProgressSnapshot {
  date: Date;
  totalFields: number;
  completedFields: number;
  errorCount: number;
  warningCount: number;
}

export interface PaceAnalysis {
  currentPace: number; // Fields per day
  requiredPace: number; // Fields per day needed to meet deadline
  projectedCompletion: Date | null;
  onTrack: boolean;
  daysAhead: number; // Positive = ahead, negative = behind
  trend: 'accelerating' | 'steady' | 'slowing' | 'stalled';
  confidence: number; // 0-1 confidence in projection
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  targetDate: Date;
  targetCompletion: number; // Percentage
  actualCompletion?: number;
  status: 'upcoming' | 'on_track' | 'at_risk' | 'missed' | 'completed';
}

// Default DORA deadline
export const DORA_DEADLINE = new Date('2026-04-30');

// Default milestones for RoI completion
export const DEFAULT_MILESTONES: Omit<Milestone, 'actualCompletion' | 'status'>[] = [
  {
    id: 'entity-setup',
    name: 'Entity Setup',
    description: 'Complete organization and entity information (B_01.01)',
    targetDate: new Date('2026-01-31'),
    targetCompletion: 10,
  },
  {
    id: 'vendors-onboarded',
    name: 'Vendors Onboarded',
    description: 'All ICT providers added with basic information (B_02.01)',
    targetDate: new Date('2026-02-15'),
    targetCompletion: 30,
  },
  {
    id: 'contracts-linked',
    name: 'Contracts Linked',
    description: 'Contractual arrangements documented (B_03.01)',
    targetDate: new Date('2026-02-28'),
    targetCompletion: 50,
  },
  {
    id: 'functions-mapped',
    name: 'Functions Mapped',
    description: 'Critical functions identified and linked (B_04.01, B_05.01)',
    targetDate: new Date('2026-03-15'),
    targetCompletion: 70,
  },
  {
    id: 'validation-clean',
    name: 'Validation Clean',
    description: 'All validation errors resolved',
    targetDate: new Date('2026-04-01'),
    targetCompletion: 90,
  },
  {
    id: 'submission-ready',
    name: 'Submission Ready',
    description: 'Full RoI package ready for ESA submission',
    targetDate: new Date('2026-04-15'),
    targetCompletion: 100,
  },
];

/**
 * Calculate pace from progress history
 */
export function calculatePace(history: ProgressSnapshot[]): number {
  if (history.length < 2) return 0;

  // Sort by date descending
  const sorted = [...history].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Use last 7 days or available data
  const recentHistory = sorted.slice(0, Math.min(7, sorted.length));

  if (recentHistory.length < 2) return 0;

  const oldest = recentHistory[recentHistory.length - 1];
  const newest = recentHistory[0];

  const fieldsDiff = newest.completedFields - oldest.completedFields;
  const daysDiff = Math.max(1, (newest.date.getTime() - oldest.date.getTime()) / (1000 * 60 * 60 * 24));

  return fieldsDiff / daysDiff;
}

/**
 * Determine trend from pace history
 */
export function determineTrend(
  history: ProgressSnapshot[]
): 'accelerating' | 'steady' | 'slowing' | 'stalled' {
  if (history.length < 3) return 'steady';

  const sorted = [...history].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate pace for first half and second half
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const firstPace = calculatePace(firstHalf);
  const secondPace = calculatePace(secondHalf);

  // If recent pace is near zero, stalled
  if (secondPace < 0.1) return 'stalled';

  const paceChange = (secondPace - firstPace) / Math.max(0.1, firstPace);

  if (paceChange > 0.2) return 'accelerating';
  if (paceChange < -0.2) return 'slowing';
  return 'steady';
}

/**
 * Project completion date based on current pace
 */
export function projectCompletion(
  currentCompletion: number,
  totalFields: number,
  pace: number
): Date | null {
  if (pace <= 0) return null;
  if (currentCompletion >= totalFields) return new Date();

  const remainingFields = totalFields - currentCompletion;
  const daysToComplete = remainingFields / pace;

  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + daysToComplete);

  return projectedDate;
}

/**
 * Full pace analysis
 */
export function analyzePace(
  history: ProgressSnapshot[],
  totalFields: number,
  deadline: Date = DORA_DEADLINE
): PaceAnalysis {
  const currentPace = calculatePace(history);
  const trend = determineTrend(history);

  // Get current completion
  const latestSnapshot = history.length > 0
    ? [...history].sort((a, b) => b.date.getTime() - a.date.getTime())[0]
    : { completedFields: 0 };

  const remainingFields = totalFields - latestSnapshot.completedFields;
  const today = new Date();
  const daysUntilDeadline = Math.max(0, (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const requiredPace = daysUntilDeadline > 0 ? remainingFields / daysUntilDeadline : Infinity;

  const projectedCompletion = projectCompletion(
    latestSnapshot.completedFields,
    totalFields,
    currentPace
  );

  const onTrack = currentPace >= requiredPace * 0.9; // 90% of required pace

  const daysAhead = projectedCompletion
    ? (deadline.getTime() - projectedCompletion.getTime()) / (1000 * 60 * 60 * 24)
    : -Infinity;

  // Confidence based on data quality
  const confidence = Math.min(1, history.length / 14); // Max confidence after 2 weeks of data

  return {
    currentPace,
    requiredPace,
    projectedCompletion,
    onTrack,
    daysAhead,
    trend,
    confidence,
  };
}

/**
 * Calculate milestone status
 */
export function calculateMilestoneStatus(
  milestone: Omit<Milestone, 'status'> & { actualCompletion?: number }
): Milestone['status'] {
  const today = new Date();
  const { targetDate, targetCompletion, actualCompletion = 0 } = milestone;

  // Already achieved target
  if (actualCompletion >= targetCompletion) {
    return 'completed';
  }

  // Past due date
  if (today > targetDate) {
    return 'missed';
  }

  // Calculate days until due
  const daysUntilDue = (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  // How much progress needed
  const progressNeeded = targetCompletion - actualCompletion;

  // If due soon and far from target
  if (daysUntilDue < 7 && progressNeeded > 10) {
    return 'at_risk';
  }

  if (daysUntilDue < 14 && progressNeeded > 20) {
    return 'at_risk';
  }

  if (daysUntilDue > 14) {
    return 'upcoming';
  }

  return 'on_track';
}

/**
 * Get milestones with current status
 */
export function getMilestonesWithStatus(
  currentCompletion: number,
  customMilestones?: Omit<Milestone, 'actualCompletion' | 'status'>[]
): Milestone[] {
  const milestones = customMilestones || DEFAULT_MILESTONES;

  return milestones.map(milestone => ({
    ...milestone,
    actualCompletion: currentCompletion,
    status: calculateMilestoneStatus({ ...milestone, actualCompletion: currentCompletion }),
  }));
}

/**
 * Format days in human readable form
 */
export function formatDaysRemaining(days: number): string {
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 7) return `${Math.round(days)} days`;
  if (days < 30) return `${Math.round(days / 7)} weeks`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${Math.round(days / 365)} years`;
}

/**
 * Get pace status message
 */
export function getPaceStatusMessage(analysis: PaceAnalysis): string {
  if (analysis.currentPace === 0) {
    return 'No progress recorded yet. Start adding data to track your pace.';
  }

  if (analysis.onTrack) {
    if (analysis.daysAhead > 14) {
      return `Excellent pace! You're projected to finish ${Math.round(analysis.daysAhead)} days early.`;
    }
    return "You're on track to meet the deadline.";
  }

  if (analysis.daysAhead < -30) {
    return 'Significantly behind schedule. Consider prioritizing RoI completion.';
  }

  if (analysis.daysAhead < 0) {
    return `Behind schedule by ${Math.abs(Math.round(analysis.daysAhead))} days. Increase your completion pace.`;
  }

  return 'Keep up the current pace to meet the deadline.';
}
