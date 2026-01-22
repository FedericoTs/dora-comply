/**
 * Indicator Components
 *
 * A collection of inline indicator components for smart tables and dashboards.
 * These components provide visual feedback for status, trends, progress, grades, and tiers.
 */

// Status indicators - now consolidated in status-badge.tsx
export {
  StatusDot,
  RiskStatusDot,
  scoreToRiskStatus,
  riskScoreToRiskStatus,
  type RiskStatusLevel,
} from './status-badge';

// Trend indicators - TrendArrow consolidated into trend-indicator.tsx
export {
  TrendArrow,
  TrendIndicator,
  TrendBadge,
  TrendDirectionIndicator,
  type TrendIndicatorProps,
  type TrendArrowProps,
} from './trend-indicator';

// Progress indicators
export { ProgressMini, ProgressBlocks } from './progress-mini';

// Grade indicators
export { GradeBadge, GradeIndicator, scoreToGrade, type Grade } from './grade-badge';

// Tier indicators
export { TierBadge, TierIndicator, type VendorTier } from './tier-badge';

// Smart table
export { SmartTable, type SmartTableColumn, type SmartTableAction, type SmartTableProps, type IndicatorType } from './smart-table';
