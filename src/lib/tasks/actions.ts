'use server';

/**
 * Task Management Server Actions
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskComment,
  TaskCommentWithAuthor,
} from './types';

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a new task
 */
export async function createTask(input: CreateTaskInput): Promise<ActionResult<Task>> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Get user's organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return { success: false, error: 'Organization not found' };
    }

    // Create task
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        organization_id: member.organization_id,
        title: input.title,
        description: input.description || null,
        priority: input.priority || 'medium',
        assignee_id: input.assignee_id || null,
        created_by: user.id,
        due_date: input.due_date || null,
        vendor_id: input.vendor_id || null,
        incident_id: input.incident_id || null,
        questionnaire_id: input.questionnaire_id || null,
        task_type: input.task_type || 'general',
        tags: input.tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/tasks');
    return { success: true, data: data as Task };
  } catch (error) {
    console.error('Error creating task:', error);
    return { success: false, error: 'Failed to create task' };
  }
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: string,
  input: UpdateTaskInput
): Promise<ActionResult<Task>> {
  try {
    const supabase = await createClient();

    // Build update object, handling null values explicitly
    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status !== undefined) {
      updateData.status = input.status;
      // Set completed_at when status changes to completed
      if (input.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }
    }
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.assignee_id !== undefined) updateData.assignee_id = input.assignee_id;
    if (input.due_date !== undefined) updateData.due_date = input.due_date;
    if (input.vendor_id !== undefined) updateData.vendor_id = input.vendor_id;
    if (input.incident_id !== undefined) updateData.incident_id = input.incident_id;
    if (input.questionnaire_id !== undefined) updateData.questionnaire_id = input.questionnaire_id;
    if (input.task_type !== undefined) updateData.task_type = input.task_type;
    if (input.tags !== undefined) updateData.tags = input.tags;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/tasks');
    return { success: true, data: data as Task };
  } catch (error) {
    console.error('Error updating task:', error);
    return { success: false, error: 'Failed to update task' };
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/tasks');
    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { success: false, error: 'Failed to delete task' };
  }
}

/**
 * Fetch task comments (server action for client components)
 */
export async function fetchTaskComments(
  taskId: string
): Promise<TaskCommentWithAuthor[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('task_comments')
      .select(`
        *,
        author:author_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching task comments:', error);
      return [];
    }

    return (data || []).map(comment => ({
      ...comment,
      author: comment.author ? {
        id: comment.author.id,
        email: comment.author.email,
        full_name: comment.author.raw_user_meta_data?.full_name || null,
      } : null,
    })) as TaskCommentWithAuthor[];
  } catch (error) {
    console.error('Error fetching task comments:', error);
    return [];
  }
}

/**
 * Add a comment to a task
 */
export async function addTaskComment(
  taskId: string,
  content: string
): Promise<ActionResult<TaskComment>> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        author_id: user.id,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/tasks');
    return { success: true, data: data as TaskComment };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, error: 'Failed to add comment' };
  }
}

/**
 * Update a comment
 */
export async function updateTaskComment(
  commentId: string,
  content: string
): Promise<ActionResult<TaskComment>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('task_comments')
      .update({ content })
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/tasks');
    return { success: true, data: data as TaskComment };
  } catch (error) {
    console.error('Error updating comment:', error);
    return { success: false, error: 'Failed to update comment' };
  }
}

/**
 * Delete a comment
 */
export async function deleteTaskComment(commentId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/tasks');
    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { success: false, error: 'Failed to delete comment' };
  }
}

/**
 * Bulk update task status
 */
export async function bulkUpdateTaskStatus(
  taskIds: string[],
  status: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .in('id', taskIds);

    if (error) {
      console.error('Error bulk updating tasks:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/tasks');
    return { success: true };
  } catch (error) {
    console.error('Error bulk updating tasks:', error);
    return { success: false, error: 'Failed to update tasks' };
  }
}

/**
 * Bulk delete tasks
 */
export async function bulkDeleteTasks(taskIds: string[]): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', taskIds);

    if (error) {
      console.error('Error bulk deleting tasks:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/tasks');
    return { success: true };
  } catch (error) {
    console.error('Error bulk deleting tasks:', error);
    return { success: false, error: 'Failed to delete tasks' };
  }
}
