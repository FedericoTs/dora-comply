/**
 * Dashboard Components Exports
 */

// Existing components
export { ActivityItem } from './activity-item';
export { RiskRow } from './risk-row';
export { GettingStartedCard } from './getting-started-card';
export { IncidentStatCard } from './incident-stat-card';
export { DeadlineItem } from './deadline-item';
export { TestingStatCard } from './testing-stat-card';

// New extracted components
export { AlertBanners } from './alert-banners';
export { DeadlineCard } from './deadline-card';
export { AhaMomentCard } from './aha-moment-card';
export { DashboardHeader } from './dashboard-header';
export { VendorsByRiskCard } from './vendors-by-risk-card';
export { PendingDeadlinesCard } from './pending-deadlines-card';
export { RecentActivityCard } from './recent-activity-card';
export { OnboardingDashboard } from './onboarding-dashboard';
export { FrameworkOverviewCard } from './framework-overview-card';

// UI/UX Redesign Phase 2 components
export { ActionRequired, generateSampleActions, type ActionItem, type ActionPriority, type ActionType, type ActionIcon } from './action-required';
export { KPICard, KPICardGrid, type KPICardProps } from './kpi-card';
export { ComplianceGauge, ComplianceGaugeMini, getDefaultDORAPillars, type CompliancePillar } from './compliance-gauge';
export { RiskHeatMapMini, generateSampleRiskData, type RiskCount } from './risk-heat-map-mini';
