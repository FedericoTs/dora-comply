/**
 * Custom Dashboards Database Queries
 *
 * Server-side functions for querying dashboard data from Supabase.
 */

import { createClient } from '@/lib/supabase/server';
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

// ============================================
// DASHBOARD QUERIES
// ============================================

/**
 * Get all dashboards for the current user's organization
 */
export async function getDashboards(): Promise<DashboardSummary[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get dashboards without the users join (FK points to auth.users, not public.users)
  const { data, error } = await supabase
    .from('custom_dashboards')
    .select(
      `
      id,
      name,
      description,
      icon,
      is_default,
      is_shared,
      is_template,
      created_by,
      created_at,
      updated_at,
      dashboard_widgets(count),
      dashboard_favorites!left(id)
    `
    )
    .order('is_default', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) throw error;

  // Get creator names separately
  const creatorIds = [...new Set((data || []).map(d => d.created_by).filter(Boolean))];
  let creatorsMap: Record<string, string> = {};

  if (creatorIds.length > 0) {
    const { data: creators } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', creatorIds);

    if (creators) {
      creatorsMap = Object.fromEntries(creators.map(c => [c.id, c.full_name]));
    }
  }

  return (data || []).map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    icon: d.icon,
    is_default: d.is_default,
    is_shared: d.is_shared,
    is_template: d.is_template,
    widget_count: (d.dashboard_widgets as { count: number }[])?.[0]?.count || 0,
    is_favorited: ((d.dashboard_favorites as { id: string }[]) || []).length > 0,
    created_by: d.created_by,
    created_by_name: creatorsMap[d.created_by] || null,
    created_at: d.created_at,
    updated_at: d.updated_at,
  }));
}

/**
 * Get a single dashboard with all its widgets
 */
export async function getDashboard(id: string): Promise<DashboardWithWidgets | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('custom_dashboards')
    .select(
      `
      *,
      dashboard_widgets(*),
      dashboard_favorites!left(id)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Get creator name separately
  let createdByName: string | undefined;
  if (data.created_by) {
    const { data: creator } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', data.created_by)
      .single();
    createdByName = creator?.full_name;
  }

  return {
    ...data,
    widgets: (data.dashboard_widgets || []) as DashboardWidget[],
    is_favorited: ((data.dashboard_favorites as { id: string }[]) || []).length > 0,
    created_by_name: createdByName,
  };
}

/**
 * Get the default dashboard for the organization
 */
export async function getDefaultDashboard(): Promise<DashboardWithWidgets | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('custom_dashboards')
    .select(
      `
      *,
      dashboard_widgets(*)
    `
    )
    .eq('is_default', true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    widgets: (data.dashboard_widgets || []) as DashboardWidget[],
  };
}

/**
 * Get user's favorited dashboards
 */
export async function getFavoriteDashboards(): Promise<DashboardSummary[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('dashboard_favorites')
    .select(
      `
      dashboard_id,
      custom_dashboards(
        id,
        name,
        description,
        icon,
        is_default,
        is_shared,
        is_template,
        created_by,
        created_at,
        updated_at,
        dashboard_widgets(count)
      )
    `
    )
    .eq('user_id', user.id);

  if (error) throw error;

  const dashboards = (data || [])
    .filter((f) => f.custom_dashboards)
    .map((f) => f.custom_dashboards as unknown as Dashboard & {
      dashboard_widgets: { count: number }[];
    });

  // Get creator names separately
  const creatorIds = [...new Set(dashboards.map(d => d.created_by).filter(Boolean))];
  let creatorsMap: Record<string, string> = {};

  if (creatorIds.length > 0) {
    const { data: creators } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', creatorIds);

    if (creators) {
      creatorsMap = Object.fromEntries(creators.map(c => [c.id, c.full_name]));
    }
  }

  return dashboards.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    icon: d.icon,
    is_default: d.is_default,
    is_shared: d.is_shared,
    is_template: d.is_template,
    widget_count: d.dashboard_widgets?.[0]?.count || 0,
    is_favorited: true,
    created_by: d.created_by,
    created_by_name: creatorsMap[d.created_by] || null,
    created_at: d.created_at,
    updated_at: d.updated_at,
  }));
}

/**
 * Get template dashboards for cloning
 */
export async function getTemplateDashboards(): Promise<DashboardSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('custom_dashboards')
    .select(
      `
      id,
      name,
      description,
      icon,
      is_default,
      is_shared,
      is_template,
      created_by,
      created_at,
      updated_at,
      dashboard_widgets(count)
    `
    )
    .eq('is_template', true)
    .order('name');

  if (error) throw error;

  // Get creator names separately
  const creatorIds = [...new Set((data || []).map(d => d.created_by).filter(Boolean))];
  let creatorsMap: Record<string, string> = {};

  if (creatorIds.length > 0) {
    const { data: creators } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', creatorIds);

    if (creators) {
      creatorsMap = Object.fromEntries(creators.map(c => [c.id, c.full_name]));
    }
  }

  return (data || []).map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    icon: d.icon,
    is_default: d.is_default,
    is_shared: d.is_shared,
    is_template: d.is_template,
    widget_count: (d.dashboard_widgets as { count: number }[])?.[0]?.count || 0,
    is_favorited: false,
    created_by: d.created_by,
    created_by_name: creatorsMap[d.created_by] || null,
    created_at: d.created_at,
    updated_at: d.updated_at,
  }));
}

// ============================================
// DASHBOARD MUTATIONS
// ============================================

/**
 * Create a new dashboard
 */
export async function createDashboard(input: CreateDashboardInput): Promise<Dashboard> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get user's organization
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (userError) throw userError;

  const { data, error } = await supabase
    .from('custom_dashboards')
    .insert({
      organization_id: userData.organization_id,
      created_by: user.id,
      name: input.name,
      description: input.description || null,
      icon: input.icon || 'layout-dashboard',
      is_shared: input.is_shared || false,
      is_template: input.is_template || false,
      layout_type: input.layout_type || 'grid',
      columns: input.columns || 12,
      row_height: input.row_height || 80,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a dashboard
 */
export async function updateDashboard(id: string, input: UpdateDashboardInput): Promise<Dashboard> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('custom_dashboards')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.is_default !== undefined && { is_default: input.is_default }),
      ...(input.is_shared !== undefined && { is_shared: input.is_shared }),
      ...(input.is_template !== undefined && { is_template: input.is_template }),
      ...(input.layout_type !== undefined && { layout_type: input.layout_type }),
      ...(input.columns !== undefined && { columns: input.columns }),
      ...(input.row_height !== undefined && { row_height: input.row_height }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a dashboard
 */
export async function deleteDashboard(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('custom_dashboards').delete().eq('id', id);

  if (error) throw error;
}

/**
 * Clone a dashboard (including widgets)
 */
export async function cloneDashboard(
  sourceId: string,
  newName: string
): Promise<DashboardWithWidgets> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get source dashboard with widgets
  const source = await getDashboard(sourceId);
  if (!source) throw new Error('Source dashboard not found');

  // Get user's organization
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (userError) throw userError;

  // Create new dashboard
  const { data: newDashboard, error: dashError } = await supabase
    .from('custom_dashboards')
    .insert({
      organization_id: userData.organization_id,
      created_by: user.id,
      name: newName,
      description: source.description,
      icon: source.icon,
      is_shared: false,
      is_template: false,
      layout_type: source.layout_type,
      columns: source.columns,
      row_height: source.row_height,
    })
    .select()
    .single();

  if (dashError) throw dashError;

  // Clone widgets
  if (source.widgets.length > 0) {
    const widgetsToInsert = source.widgets.map((w) => ({
      dashboard_id: newDashboard.id,
      widget_type: w.widget_type,
      title: w.title,
      grid_x: w.grid_x,
      grid_y: w.grid_y,
      grid_w: w.grid_w,
      grid_h: w.grid_h,
      config: w.config,
    }));

    const { data: newWidgets, error: widgetError } = await supabase
      .from('dashboard_widgets')
      .insert(widgetsToInsert)
      .select();

    if (widgetError) throw widgetError;

    return {
      ...newDashboard,
      widgets: newWidgets || [],
    };
  }

  return {
    ...newDashboard,
    widgets: [],
  };
}

/**
 * Set a dashboard as the organization default
 */
export async function setDefaultDashboard(id: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get user's organization
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (userError) throw userError;

  // Clear existing default
  await supabase
    .from('custom_dashboards')
    .update({ is_default: false })
    .eq('organization_id', userData.organization_id)
    .eq('is_default', true);

  // Set new default
  const { error } = await supabase
    .from('custom_dashboards')
    .update({ is_default: true })
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// WIDGET MUTATIONS
// ============================================

/**
 * Add a widget to a dashboard
 */
export async function createWidget(input: CreateWidgetInput): Promise<DashboardWidget> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('dashboard_widgets')
    .insert({
      dashboard_id: input.dashboard_id,
      widget_type: input.widget_type,
      title: input.title || null,
      grid_x: input.grid_x || 0,
      grid_y: input.grid_y || 0,
      grid_w: input.grid_w || 4,
      grid_h: input.grid_h || 3,
      config: input.config || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a widget
 */
export async function updateWidget(id: string, input: UpdateWidgetInput): Promise<DashboardWidget> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('dashboard_widgets')
    .update({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.grid_x !== undefined && { grid_x: input.grid_x }),
      ...(input.grid_y !== undefined && { grid_y: input.grid_y }),
      ...(input.grid_w !== undefined && { grid_w: input.grid_w }),
      ...(input.grid_h !== undefined && { grid_h: input.grid_h }),
      ...(input.config !== undefined && { config: input.config }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update multiple widget positions (for drag-and-drop)
 */
export async function updateWidgetPositions(positions: WidgetPosition[]): Promise<void> {
  const supabase = await createClient();

  // Use Promise.all for batch updates
  const updates = positions.map((pos) =>
    supabase
      .from('dashboard_widgets')
      .update({
        grid_x: pos.grid_x,
        grid_y: pos.grid_y,
        grid_w: pos.grid_w,
        grid_h: pos.grid_h,
      })
      .eq('id', pos.id)
  );

  const results = await Promise.all(updates);

  // Check for errors
  const error = results.find((r) => r.error)?.error;
  if (error) throw error;
}

/**
 * Delete a widget
 */
export async function deleteWidget(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('dashboard_widgets').delete().eq('id', id);

  if (error) throw error;
}

// ============================================
// FAVORITES
// ============================================

/**
 * Add dashboard to favorites
 */
export async function addFavorite(dashboardId: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('dashboard_favorites').insert({
    user_id: user.id,
    dashboard_id: dashboardId,
  });

  // Ignore duplicate error
  if (error && error.code !== '23505') throw error;
}

/**
 * Remove dashboard from favorites
 */
export async function removeFavorite(dashboardId: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('dashboard_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('dashboard_id', dashboardId);

  if (error) throw error;
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(dashboardId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if favorited
  const { data: existing } = await supabase
    .from('dashboard_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('dashboard_id', dashboardId)
    .maybeSingle();

  if (existing) {
    await removeFavorite(dashboardId);
    return false;
  } else {
    await addFavorite(dashboardId);
    return true;
  }
}
