/**
 * Task Management Types
 */

export type TaskStatus = 'open' | 'in_progress' | 'review' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskType =
  | 'general'
  | 'vendor_assessment'
  | 'document_review'
  | 'incident_followup'
  | 'questionnaire_review'
  | 'compliance_review'
  | 'contract_renewal'
  | 'certification_renewal'
  | 'risk_assessment'
  | 'remediation';

export interface Task {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  created_by: string | null;
  due_date: string | null;
  completed_at: string | null;
  vendor_id: string | null;
  incident_id: string | null;
  questionnaire_id: string | null;
  task_type: TaskType;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface TaskWithRelations extends Task {
  assignee?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  creator?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  vendor?: {
    id: string;
    name: string;
  } | null;
  incident?: {
    id: string;
    title: string;
  } | null;
  questionnaire?: {
    id: string;
    vendor_name: string;
  } | null;
  comment_count?: number;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCommentWithAuthor extends TaskComment {
  author?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignee_id?: string;
  due_date?: string;
  vendor_id?: string;
  incident_id?: string;
  questionnaire_id?: string;
  task_type?: TaskType;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
  due_date?: string | null;
  vendor_id?: string | null;
  incident_id?: string | null;
  questionnaire_id?: string | null;
  task_type?: TaskType;
  tags?: string[];
}

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  assignee_id?: string;
  task_type?: TaskType | TaskType[];
  vendor_id?: string;
  incident_id?: string;
  questionnaire_id?: string;
  due_before?: string;
  due_after?: string;
  search?: string;
}

export interface TaskStats {
  total: number;
  open: number;
  in_progress: number;
  review: number;
  completed: number;
  overdue: number;
  due_this_week: number;
}

// Display helpers
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  review: 'In Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  general: 'General',
  vendor_assessment: 'Vendor Assessment',
  document_review: 'Document Review',
  incident_followup: 'Incident Follow-up',
  questionnaire_review: 'Questionnaire Review',
  compliance_review: 'Compliance Review',
  contract_renewal: 'Contract Renewal',
  certification_renewal: 'Certification Renewal',
  risk_assessment: 'Risk Assessment',
  remediation: 'Remediation',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
