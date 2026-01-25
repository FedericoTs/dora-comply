'use server';

/**
 * Custom Dashboards Server Actions
 *
 * Server actions for dashboard management.
 */

import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/lib/types';
import type {
  Dashboard,
  DashboardWidget,
  DashboardWithWidgets,
  DashboardSummary,
  CreateDashboardInput,
  UpdateDashboardInput,
  CreateWidgetInput,
  UpdateWidgetInput,
  WidgetPosition,
} from './types';
import * as queries from './queries';

// ============================================
// DASHBOARD ACTIONS
// ============================================

/**
 * Get all dashboards for the current user's organization
 */
export async function getDashboardsAction(): Promise<ActionResult<DashboardSummary[]>> {
  try {
    const dashboards = await queries.getDashboards();
    return { success: true, data: dashboards };
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboards',
    };
  }
}

/**
 * Get a single dashboard with all its widgets
 */
export async function getDashboardAction(
  id: string
): Promise<ActionResult<DashboardWithWidgets | null>> {
  try {
    const dashboard = await queries.getDashboard(id);
    return { success: true, data: dashboard };
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard',
    };
  }
}

/**
 * Get the default dashboard for the organization
 */
export async function getDefaultDashboardAction(): Promise<
  ActionResult<DashboardWithWidgets | null>
> {
  try {
    const dashboard = await queries.getDefaultDashboard();
    return { success: true, data: dashboard };
  } catch (error) {
    console.error('Error fetching default dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch default dashboard',
    };
  }
}

/**
 * Get user's favorited dashboards
 */
export async function getFavoriteDashboardsAction(): Promise<ActionResult<DashboardSummary[]>> {
  try {
    const dashboards = await queries.getFavoriteDashboards();
    return { success: true, data: dashboards };
  } catch (error) {
    console.error('Error fetching favorite dashboards:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch favorite dashboards',
    };
  }
}

/**
 * Get template dashboards for cloning
 */
export async function getTemplateDashboardsAction(): Promise<ActionResult<DashboardSummary[]>> {
  try {
    const dashboards = await queries.getTemplateDashboards();
    return { success: true, data: dashboards };
  } catch (error) {
    console.error('Error fetching template dashboards:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch template dashboards',
    };
  }
}

/**
 * Create a new dashboard
 */
export async function createDashboardAction(
  input: CreateDashboardInput
): Promise<ActionResult<Dashboard>> {
  try {
    const dashboard = await queries.createDashboard(input);
    revalidatePath('/dashboards');
    return { success: true, data: dashboard };
  } catch (error) {
    console.error('Error creating dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create dashboard',
    };
  }
}

/**
 * Update a dashboard
 */
export async function updateDashboardAction(
  id: string,
  input: UpdateDashboardInput
): Promise<ActionResult<Dashboard>> {
  try {
    const dashboard = await queries.updateDashboard(id, input);
    revalidatePath('/dashboards');
    revalidatePath(`/dashboards/${id}`);
    return { success: true, data: dashboard };
  } catch (error) {
    console.error('Error updating dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update dashboard',
    };
  }
}

/**
 * Delete a dashboard
 */
export async function deleteDashboardAction(id: string): Promise<ActionResult<void>> {
  try {
    await queries.deleteDashboard(id);
    revalidatePath('/dashboards');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete dashboard',
    };
  }
}

/**
 * Clone a dashboard (including widgets)
 */
export async function cloneDashboardAction(
  sourceId: string,
  newName: string
): Promise<ActionResult<DashboardWithWidgets>> {
  try {
    const dashboard = await queries.cloneDashboard(sourceId, newName);
    revalidatePath('/dashboards');
    return { success: true, data: dashboard };
  } catch (error) {
    console.error('Error cloning dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clone dashboard',
    };
  }
}

/**
 * Set a dashboard as the organization default
 */
export async function setDefaultDashboardAction(id: string): Promise<ActionResult<void>> {
  try {
    await queries.setDefaultDashboard(id);
    revalidatePath('/dashboards');
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error setting default dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set default dashboard',
    };
  }
}

// ============================================
// WIDGET ACTIONS
// ============================================

/**
 * Add a widget to a dashboard
 */
export async function createWidgetAction(
  input: CreateWidgetInput
): Promise<ActionResult<DashboardWidget>> {
  try {
    const widget = await queries.createWidget(input);
    revalidatePath(`/dashboards/${input.dashboard_id}`);
    return { success: true, data: widget };
  } catch (error) {
    console.error('Error creating widget:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create widget',
    };
  }
}

/**
 * Update a widget
 */
export async function updateWidgetAction(
  id: string,
  dashboardId: string,
  input: UpdateWidgetInput
): Promise<ActionResult<DashboardWidget>> {
  try {
    const widget = await queries.updateWidget(id, input);
    revalidatePath(`/dashboards/${dashboardId}`);
    return { success: true, data: widget };
  } catch (error) {
    console.error('Error updating widget:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update widget',
    };
  }
}

/**
 * Update multiple widget positions (for drag-and-drop)
 */
export async function updateWidgetPositionsAction(
  dashboardId: string,
  positions: WidgetPosition[]
): Promise<ActionResult<void>> {
  try {
    await queries.updateWidgetPositions(positions);
    revalidatePath(`/dashboards/${dashboardId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error updating widget positions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update widget positions',
    };
  }
}

/**
 * Delete a widget
 */
export async function deleteWidgetAction(
  id: string,
  dashboardId: string
): Promise<ActionResult<void>> {
  try {
    await queries.deleteWidget(id);
    revalidatePath(`/dashboards/${dashboardId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting widget:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete widget',
    };
  }
}

// ============================================
// FAVORITES ACTIONS
// ============================================

/**
 * Toggle favorite status
 */
export async function toggleFavoriteAction(dashboardId: string): Promise<ActionResult<boolean>> {
  try {
    const isFavorited = await queries.toggleFavorite(dashboardId);
    revalidatePath('/dashboards');
    return { success: true, data: isFavorited };
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle favorite',
    };
  }
}

// ============================================
// TEMPLATE SEEDING
// ============================================

/**
 * Seed default dashboard templates if none exist
 * This creates starter templates that users can clone
 */
export async function seedDefaultTemplatesAction(): Promise<ActionResult<void>> {
  try {
    await queries.seedDefaultTemplates();
    revalidatePath('/dashboards');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error seeding templates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to seed templates',
    };
  }
}
