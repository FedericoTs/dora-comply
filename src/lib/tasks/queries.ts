/**
 * Task Management Queries
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Task,
  TaskWithRelations,
  TaskComment,
  TaskCommentWithAuthor,
  TaskFilters,
  TaskStats,
} from './types';

/**
 * Get all tasks for the current organization with optional filters
 */
export async function getTasks(filters?: TaskFilters): Promise<TaskWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from('tasks')
    .select(`
      *,
      vendor:vendors(id, name),
      incident:incidents(id, title)
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters?.priority) {
    if (Array.isArray(filters.priority)) {
      query = query.in('priority', filters.priority);
    } else {
      query = query.eq('priority', filters.priority);
    }
  }

  if (filters?.assignee_id) {
    query = query.eq('assignee_id', filters.assignee_id);
  }

  if (filters?.task_type) {
    if (Array.isArray(filters.task_type)) {
      query = query.in('task_type', filters.task_type);
    } else {
      query = query.eq('task_type', filters.task_type);
    }
  }

  if (filters?.vendor_id) {
    query = query.eq('vendor_id', filters.vendor_id);
  }

  if (filters?.incident_id) {
    query = query.eq('incident_id', filters.incident_id);
  }

  if (filters?.questionnaire_id) {
    query = query.eq('questionnaire_id', filters.questionnaire_id);
  }

  if (filters?.due_before) {
    query = query.lte('due_date', filters.due_before);
  }

  if (filters?.due_after) {
    query = query.gte('due_date', filters.due_after);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  return (data || []) as TaskWithRelations[];
}

/**
 * Get tasks assigned to the current user
 */
export async function getMyTasks(): Promise<TaskWithRelations[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      vendor:vendors(id, name),
      incident:incidents(id, title)
    `)
    .eq('assignee_id', user.id)
    .not('status', 'in', '("completed","cancelled")')
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching my tasks:', error);
    throw error;
  }

  return (data || []) as TaskWithRelations[];
}

/**
 * Get a single task by ID
 */
export async function getTask(taskId: string): Promise<TaskWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      vendor:vendors(id, name),
      incident:incidents(id, title)
    `)
    .eq('id', taskId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching task:', error);
    throw error;
  }

  return data as TaskWithRelations;
}

/**
 * Get task comments
 */
export async function getTaskComments(taskId: string): Promise<TaskCommentWithAuthor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching task comments:', error);
    throw error;
  }

  return (data || []) as TaskCommentWithAuthor[];
}

/**
 * Get task statistics for the current organization
 */
export async function getTaskStats(): Promise<TaskStats> {
  const supabase = await createClient();

  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data, error } = await supabase
    .from('tasks')
    .select('id, status, due_date');

  if (error) {
    console.error('Error fetching task stats:', error);
    throw error;
  }

  const tasks = data || [];
  const todayStr = today.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  return {
    total: tasks.length,
    open: tasks.filter(t => t.status === 'open').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t =>
      t.due_date &&
      t.due_date < todayStr &&
      !['completed', 'cancelled'].includes(t.status)
    ).length,
    due_this_week: tasks.filter(t =>
      t.due_date &&
      t.due_date >= todayStr &&
      t.due_date <= weekEndStr &&
      !['completed', 'cancelled'].includes(t.status)
    ).length,
  };
}

/**
 * Get tasks for a specific vendor
 */
export async function getVendorTasks(vendorId: string): Promise<Task[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vendor tasks:', error);
    throw error;
  }

  return (data || []) as Task[];
}

/**
 * Get tasks for a specific incident
 */
export async function getIncidentTasks(incidentId: string): Promise<Task[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching incident tasks:', error);
    throw error;
  }

  return (data || []) as Task[];
}

/**
 * Get team members for task assignment dropdown
 */
export async function getTeamMembers(): Promise<Array<{ id: string; email: string; full_name: string | null }>> {
  const supabase = await createClient();

  // Get organization members from the organization_members table
  const { data, error } = await supabase
    .from('organization_members')
    .select('user_id, role');

  if (error) {
    console.error('Error fetching team members:', error);
    return [];
  }

  // Get user details from auth.users through a separate query
  // For now, return the user IDs - the UI can resolve names separately
  return (data || []).map(m => ({
    id: m.user_id,
    email: '',
    full_name: null,
  }));
}
