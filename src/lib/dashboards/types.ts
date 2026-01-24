/**
 * Custom Dashboards Types
 *
 * Types for the custom dashboard builder feature.
 * Aligns with database schema in 031_custom_dashboards.sql
 */

// ============================================
// WIDGET TYPES
// ============================================

export type WidgetType =
  // Stats widgets
  | 'stat_vendors_count'
  | 'stat_vendors_by_tier'
  | 'stat_vendors_by_risk'
  | 'stat_incidents_count'
  | 'stat_incidents_by_status'
  | 'stat_tasks_count'
  | 'stat_questionnaires_count'
  | 'stat_compliance_score'
  | 'stat_remediation_progress'
  // Chart widgets
  | 'chart_risk_distribution'
  | 'chart_compliance_trend'
  | 'chart_vendor_tier_pie'
  | 'chart_incident_trend'
  | 'chart_task_burndown'
  | 'chart_maturity_radar'
  // List widgets
  | 'list_recent_activity'
  | 'list_pending_deadlines'
  | 'list_open_incidents'
  | 'list_high_risk_vendors'
  | 'list_expiring_contracts'
  | 'list_pending_tasks'
  | 'list_monitoring_alerts'
  // Table widgets
  | 'table_vendors'
  | 'table_incidents'
  | 'table_tasks'
  | 'table_questionnaires'
  | 'table_contracts'
  // Special widgets
  | 'compliance_gauge'
  | 'risk_heat_map'
  | 'framework_overview'
  | 'getting_started'
  | 'quick_actions';

export type WidgetCategory = 'stats' | 'charts' | 'lists' | 'tables' | 'special';

export type LayoutType = 'grid' | 'freeform';

// ============================================
// CORE TYPES
// ============================================

export interface Dashboard {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  description: string | null;
  icon: string;
  is_default: boolean;
  is_shared: boolean;
  is_template: boolean;
  layout_type: LayoutType;
  columns: number;
  row_height: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  widget_type: WidgetType;
  title: string | null;
  grid_x: number;
  grid_y: number;
  grid_w: number;
  grid_h: number;
  config: WidgetConfig;
  created_at: string;
  updated_at: string;
}

export interface DashboardFavorite {
  id: string;
  user_id: string;
  dashboard_id: string;
  created_at: string;
}

// ============================================
// WIDGET CONFIGURATION
// ============================================

export interface WidgetConfig {
  /** Number of items to show in lists/tables */
  limit?: number;
  /** Filter by status, tier, or risk level */
  filter?: string;
  /** Show chart in stat widgets */
  showChart?: boolean;
  /** Date range for charts */
  dateRange?: 'week' | 'month' | 'quarter' | 'year';
  /** Framework filter */
  framework?: 'nis2' | 'dora' | 'gdpr' | 'iso27001';
  /** Custom colors */
  colorScheme?: string;
  /** Refresh interval in seconds */
  refreshInterval?: number;
  /** Additional widget-specific settings */
  [key: string]: unknown;
}

// ============================================
// AGGREGATED TYPES
// ============================================

export interface DashboardWithWidgets extends Dashboard {
  widgets: DashboardWidget[];
  is_favorited?: boolean;
  created_by_name?: string;
}

export interface DashboardSummary {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  is_default: boolean;
  is_shared: boolean;
  is_template: boolean;
  widget_count: number;
  is_favorited: boolean;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// INPUT TYPES
// ============================================

export interface CreateDashboardInput {
  name: string;
  description?: string;
  icon?: string;
  is_shared?: boolean;
  is_template?: boolean;
  layout_type?: LayoutType;
  columns?: number;
  row_height?: number;
}

export interface UpdateDashboardInput {
  name?: string;
  description?: string;
  icon?: string;
  is_default?: boolean;
  is_shared?: boolean;
  is_template?: boolean;
  layout_type?: LayoutType;
  columns?: number;
  row_height?: number;
}

export interface CreateWidgetInput {
  dashboard_id: string;
  widget_type: WidgetType;
  title?: string;
  grid_x?: number;
  grid_y?: number;
  grid_w?: number;
  grid_h?: number;
  config?: WidgetConfig;
}

export interface UpdateWidgetInput {
  title?: string;
  grid_x?: number;
  grid_y?: number;
  grid_w?: number;
  grid_h?: number;
  config?: WidgetConfig;
}

export interface WidgetPosition {
  id: string;
  grid_x: number;
  grid_y: number;
  grid_w: number;
  grid_h: number;
}

// ============================================
// WIDGET CATALOG
// ============================================

export interface WidgetDefinition {
  type: WidgetType;
  category: WidgetCategory;
  name: string;
  description: string;
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
}

export const WIDGET_CATALOG: WidgetDefinition[] = [
  // Stats widgets
  {
    type: 'stat_vendors_count',
    category: 'stats',
    name: 'Total Vendors',
    description: 'Display total vendor count with trend',
    icon: 'building-2',
    defaultWidth: 3,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 2,
  },
  {
    type: 'stat_vendors_by_tier',
    category: 'stats',
    name: 'Vendors by Tier',
    description: 'Breakdown of vendors by tier (Critical, Important, Standard)',
    icon: 'layers',
    defaultWidth: 4,
    defaultHeight: 2,
    minWidth: 3,
    minHeight: 2,
  },
  {
    type: 'stat_vendors_by_risk',
    category: 'stats',
    name: 'Vendors by Risk',
    description: 'Breakdown of vendors by risk level',
    icon: 'shield-alert',
    defaultWidth: 4,
    defaultHeight: 2,
    minWidth: 3,
    minHeight: 2,
  },
  {
    type: 'stat_incidents_count',
    category: 'stats',
    name: 'Total Incidents',
    description: 'Display total incident count with trend',
    icon: 'alert-triangle',
    defaultWidth: 3,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 2,
  },
  {
    type: 'stat_incidents_by_status',
    category: 'stats',
    name: 'Incidents by Status',
    description: 'Breakdown of incidents by status',
    icon: 'activity',
    defaultWidth: 4,
    defaultHeight: 2,
    minWidth: 3,
    minHeight: 2,
  },
  {
    type: 'stat_tasks_count',
    category: 'stats',
    name: 'Open Tasks',
    description: 'Count of open remediation tasks',
    icon: 'check-square',
    defaultWidth: 3,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 2,
  },
  {
    type: 'stat_questionnaires_count',
    category: 'stats',
    name: 'Questionnaires',
    description: 'Active questionnaire count',
    icon: 'clipboard-list',
    defaultWidth: 3,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 2,
  },
  {
    type: 'stat_compliance_score',
    category: 'stats',
    name: 'Compliance Score',
    description: 'Overall compliance score percentage',
    icon: 'target',
    defaultWidth: 3,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 2,
  },
  {
    type: 'stat_remediation_progress',
    category: 'stats',
    name: 'Remediation Progress',
    description: 'Overall remediation completion rate',
    icon: 'trending-up',
    defaultWidth: 3,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 2,
  },

  // Chart widgets
  {
    type: 'chart_risk_distribution',
    category: 'charts',
    name: 'Risk Distribution',
    description: 'Pie chart of vendor risk distribution',
    icon: 'pie-chart',
    defaultWidth: 4,
    defaultHeight: 4,
    minWidth: 3,
    minHeight: 3,
  },
  {
    type: 'chart_compliance_trend',
    category: 'charts',
    name: 'Compliance Trend',
    description: 'Line chart showing compliance score over time',
    icon: 'line-chart',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
  },
  {
    type: 'chart_vendor_tier_pie',
    category: 'charts',
    name: 'Vendor Tier Chart',
    description: 'Pie chart of vendor tier distribution',
    icon: 'pie-chart',
    defaultWidth: 4,
    defaultHeight: 4,
    minWidth: 3,
    minHeight: 3,
  },
  {
    type: 'chart_incident_trend',
    category: 'charts',
    name: 'Incident Trend',
    description: 'Bar chart showing incidents over time',
    icon: 'bar-chart-2',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
  },
  {
    type: 'chart_task_burndown',
    category: 'charts',
    name: 'Task Burndown',
    description: 'Burndown chart for remediation tasks',
    icon: 'trending-down',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
  },
  {
    type: 'chart_maturity_radar',
    category: 'charts',
    name: 'Maturity Radar',
    description: 'Radar chart showing maturity across domains',
    icon: 'radar',
    defaultWidth: 6,
    defaultHeight: 5,
    minWidth: 4,
    minHeight: 4,
  },

  // List widgets
  {
    type: 'list_recent_activity',
    category: 'lists',
    name: 'Recent Activity',
    description: 'Timeline of recent actions and events',
    icon: 'clock',
    defaultWidth: 4,
    defaultHeight: 5,
    minWidth: 3,
    minHeight: 3,
  },
  {
    type: 'list_pending_deadlines',
    category: 'lists',
    name: 'Upcoming Deadlines',
    description: 'List of approaching deadlines',
    icon: 'calendar',
    defaultWidth: 4,
    defaultHeight: 4,
    minWidth: 3,
    minHeight: 3,
  },
  {
    type: 'list_open_incidents',
    category: 'lists',
    name: 'Open Incidents',
    description: 'List of unresolved incidents',
    icon: 'alert-circle',
    defaultWidth: 4,
    defaultHeight: 4,
    minWidth: 3,
    minHeight: 3,
  },
  {
    type: 'list_high_risk_vendors',
    category: 'lists',
    name: 'High Risk Vendors',
    description: 'Vendors with elevated risk scores',
    icon: 'shield-off',
    defaultWidth: 4,
    defaultHeight: 4,
    minWidth: 3,
    minHeight: 3,
  },
  {
    type: 'list_expiring_contracts',
    category: 'lists',
    name: 'Expiring Contracts',
    description: 'Contracts expiring soon',
    icon: 'file-warning',
    defaultWidth: 4,
    defaultHeight: 4,
    minWidth: 3,
    minHeight: 3,
  },
  {
    type: 'list_pending_tasks',
    category: 'lists',
    name: 'Pending Tasks',
    description: 'Tasks awaiting completion',
    icon: 'list-todo',
    defaultWidth: 4,
    defaultHeight: 4,
    minWidth: 3,
    minHeight: 3,
  },
  {
    type: 'list_monitoring_alerts',
    category: 'lists',
    name: 'Monitoring Alerts',
    description: 'Recent vendor monitoring alerts',
    icon: 'bell',
    defaultWidth: 4,
    defaultHeight: 4,
    minWidth: 3,
    minHeight: 3,
  },

  // Table widgets
  {
    type: 'table_vendors',
    category: 'tables',
    name: 'Vendors Table',
    description: 'Compact table of vendors',
    icon: 'table',
    defaultWidth: 6,
    defaultHeight: 5,
    minWidth: 4,
    minHeight: 3,
  },
  {
    type: 'table_incidents',
    category: 'tables',
    name: 'Incidents Table',
    description: 'Compact table of incidents',
    icon: 'table',
    defaultWidth: 6,
    defaultHeight: 5,
    minWidth: 4,
    minHeight: 3,
  },
  {
    type: 'table_tasks',
    category: 'tables',
    name: 'Tasks Table',
    description: 'Compact table of tasks',
    icon: 'table',
    defaultWidth: 6,
    defaultHeight: 5,
    minWidth: 4,
    minHeight: 3,
  },
  {
    type: 'table_questionnaires',
    category: 'tables',
    name: 'Questionnaires Table',
    description: 'Compact table of questionnaires',
    icon: 'table',
    defaultWidth: 6,
    defaultHeight: 5,
    minWidth: 4,
    minHeight: 3,
  },
  {
    type: 'table_contracts',
    category: 'tables',
    name: 'Contracts Table',
    description: 'Compact table of contracts',
    icon: 'table',
    defaultWidth: 6,
    defaultHeight: 5,
    minWidth: 4,
    minHeight: 3,
  },

  // Special widgets
  {
    type: 'compliance_gauge',
    category: 'special',
    name: 'Compliance Gauge',
    description: 'Visual gauge showing compliance level',
    icon: 'gauge',
    defaultWidth: 4,
    defaultHeight: 4,
    minWidth: 3,
    minHeight: 3,
  },
  {
    type: 'risk_heat_map',
    category: 'special',
    name: 'Risk Heat Map',
    description: 'Heat map visualization of risk across vendors',
    icon: 'grid-3x3',
    defaultWidth: 6,
    defaultHeight: 5,
    minWidth: 4,
    minHeight: 4,
  },
  {
    type: 'framework_overview',
    category: 'special',
    name: 'Framework Overview',
    description: 'Multi-framework compliance overview',
    icon: 'layout-grid',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
  },
  {
    type: 'getting_started',
    category: 'special',
    name: 'Getting Started',
    description: 'Onboarding checklist for new users',
    icon: 'rocket',
    defaultWidth: 4,
    defaultHeight: 4,
    minWidth: 3,
    minHeight: 3,
  },
  {
    type: 'quick_actions',
    category: 'special',
    name: 'Quick Actions',
    description: 'Shortcuts to common actions',
    icon: 'zap',
    defaultWidth: 3,
    defaultHeight: 3,
    minWidth: 2,
    minHeight: 2,
  },
];

// Helper to get widget definition by type
export function getWidgetDefinition(type: WidgetType): WidgetDefinition | undefined {
  return WIDGET_CATALOG.find((w) => w.type === type);
}

// Helper to get widgets by category
export function getWidgetsByCategory(category: WidgetCategory): WidgetDefinition[] {
  return WIDGET_CATALOG.filter((w) => w.category === category);
}

// Category labels for UI
export const WIDGET_CATEGORY_LABELS: Record<WidgetCategory, { label: string; icon: string }> = {
  stats: { label: 'Statistics', icon: 'hash' },
  charts: { label: 'Charts', icon: 'bar-chart' },
  lists: { label: 'Lists', icon: 'list' },
  tables: { label: 'Tables', icon: 'table-2' },
  special: { label: 'Special', icon: 'sparkles' },
};
