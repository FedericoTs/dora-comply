/**
 * Indicator Components
 *
 * A collection of inline indicator components for smart tables and dashboards.
 * These components provide visual feedback for status, trends, progress, grades, and tiers.
 */

export { StatusDot, scoreToStatus, riskScoreToStatus, type StatusLevel } from './status-dot';
export { TrendArrow, TrendIndicator } from './trend-arrow';
export { ProgressMini, ProgressBlocks } from './progress-mini';
export { GradeBadge, GradeIndicator, scoreToGrade, type Grade } from './grade-badge';
export { TierBadge, TierIndicator, type VendorTier } from './tier-badge';
export { SmartTable, type SmartTableColumn, type SmartTableAction, type SmartTableProps, type IndicatorType } from './smart-table';
