/**
 * Custom Dashboards Module
 *
 * Exports all dashboard-related types, queries, and actions.
 */

// Types
export * from './types';

// Queries (for server components)
export * from './queries';

// Actions (for client components)
export {
  getDashboardsAction,
  getDashboardAction,
  getDefaultDashboardAction,
  getFavoriteDashboardsAction,
  getTemplateDashboardsAction,
  createDashboardAction,
  updateDashboardAction,
  deleteDashboardAction,
  cloneDashboardAction,
  setDefaultDashboardAction,
  createWidgetAction,
  updateWidgetAction,
  updateWidgetPositionsAction,
  deleteWidgetAction,
  toggleFavoriteAction,
} from './actions';
