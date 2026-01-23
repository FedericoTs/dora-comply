-- Migration: 037_task_management.sql
-- Description: Task management system for tracking compliance activities

-- =============================================================================
-- TASKS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Task details
  title TEXT NOT NULL,
  description TEXT,

  -- Status and priority
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'review', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Assignment
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Dates
  due_date DATE,
  completed_at TIMESTAMPTZ,

  -- Linked entities (optional)
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  questionnaire_id UUID REFERENCES nis2_vendor_questionnaires(id) ON DELETE SET NULL,

  -- Task type/category
  task_type TEXT NOT NULL DEFAULT 'general' CHECK (task_type IN (
    'general',
    'vendor_assessment',
    'document_review',
    'incident_followup',
    'questionnaire_review',
    'compliance_review',
    'contract_renewal',
    'certification_renewal',
    'risk_assessment',
    'remediation'
  )),

  -- Optional tags for additional categorization
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_organization ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(organization_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_vendor ON tasks(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_incident ON tasks(incident_id) WHERE incident_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_questionnaire ON tasks(questionnaire_id) WHERE questionnaire_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks in their organization"
  ON tasks FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create tasks in their organization"
  ON tasks FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update tasks in their organization"
  ON tasks FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete tasks in their organization"
  ON tasks FOR DELETE
  USING (organization_id = get_user_organization_id());

-- =============================================================================
-- TASK COMMENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  content TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching comments by task
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author ON task_comments(author_id);

-- Enable RLS
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_comments (inherit from task access)
CREATE POLICY "Users can view comments on tasks in their organization"
  ON task_comments FOR SELECT
  USING (task_id IN (
    SELECT id FROM tasks WHERE organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can create comments on tasks in their organization"
  ON task_comments FOR INSERT
  WITH CHECK (task_id IN (
    SELECT id FROM tasks WHERE organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can update their own comments"
  ON task_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON task_comments FOR DELETE
  USING (author_id = auth.uid());

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp trigger for tasks
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Update timestamp trigger for task_comments
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- NOTIFICATION TRIGGER FOR TASK ASSIGNMENT
-- =============================================================================

CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify when a task is assigned to someone
  IF NEW.assignee_id IS NOT NULL AND
     (TG_OP = 'INSERT' OR OLD.assignee_id IS NULL OR OLD.assignee_id != NEW.assignee_id) THEN
    INSERT INTO notifications (
      organization_id,
      user_id,
      type,
      title,
      message,
      link,
      metadata
    ) VALUES (
      NEW.organization_id,
      NEW.assignee_id,
      'task_assigned',
      'New Task Assigned',
      'You have been assigned a new task: ' || NEW.title,
      '/tasks?task=' || NEW.id,
      jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'priority', NEW.priority,
        'due_date', NEW.due_date
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER task_assignment_notification
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assignment();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE tasks IS 'Task management for compliance activities';
COMMENT ON COLUMN tasks.task_type IS 'Category of task: general, vendor_assessment, document_review, etc.';
COMMENT ON COLUMN tasks.tags IS 'Optional tags for flexible categorization';
COMMENT ON TABLE task_comments IS 'Comments and discussion on tasks';
