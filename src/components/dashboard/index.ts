/**
 * Dashboard Components Exports
 *
 * Core components used by the main dashboard page.
 * Custom dashboard widgets are in /components/dashboards/widgets/
 */

// Internal components (used by main card components)
export { ActivityItem } from './activity-item';
export { RiskRow } from './risk-row';
export { DeadlineItem } from './deadline-item';

// Main dashboard components
export { VendorsByRiskCard } from './vendors-by-risk-card';
export { PendingDeadlinesCard } from './pending-deadlines-card';
export { RecentActivityCard } from './recent-activity-card';
export { ActionRequired, generateSampleActions, type ActionItem, type ActionPriority, type ActionType, type ActionIcon } from './action-required';
export { ComplianceGauge, ComplianceGaugeMini, getDefaultDORAPillars, type CompliancePillar } from './compliance-gauge';
