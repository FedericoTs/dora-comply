/**
 * Dashboard Components Exports
 *
 * Core components used by the main dashboard page.
 * Custom dashboard widgets are in /components/dashboards/widgets/
 */

// Internal components (used by main components)
export { ActivityItem } from './activity-item';
export { RiskRow } from './risk-row';
export { DeadlineItem } from './deadline-item';
export { DeadlineCard } from './deadline-card';

// Main dashboard components
export { VendorsByRiskCard } from './vendors-by-risk-card';
export { PendingDeadlinesCard } from './pending-deadlines-card';
export { RecentActivityCard } from './recent-activity-card';
export { ActionRequired, generateSampleActions, type ActionItem, type ActionPriority, type ActionType, type ActionIcon } from './action-required';
export { ComplianceGauge, ComplianceGaugeMini, getDefaultDORAPillars, type CompliancePillar } from './compliance-gauge';

// Custom dashboards support (used by /components/dashboards/widgets/)
export { GettingStartedCard } from './getting-started-card';
export { FrameworkOverviewCard } from './framework-overview-card';
export { KPICard, KPICardGrid, type KPICardProps } from './kpi-card';
export { RiskHeatMapMini, generateSampleRiskData, type RiskCount } from './risk-heat-map-mini';
