-- =============================================================================
-- Migration: 031_custom_dashboards
-- Description: Custom dashboard builder with drag-and-drop widgets
-- Date: 2026-01-24
-- =============================================================================

-- =============================================================================
-- Table: custom_dashboards
-- Stores user-created dashboard definitions
-- =============================================================================

CREATE TABLE IF NOT EXISTS custom_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Dashboard metadata
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'layout-dashboard', -- Lucide icon name

  -- Visibility & sharing
  is_default BOOLEAN DEFAULT false, -- Organization default dashboard
  is_shared BOOLEAN DEFAULT false, -- Visible to all org members
  is_template BOOLEAN DEFAULT false, -- Can be cloned by others

  -- Layout configuration
  layout_type TEXT NOT NULL DEFAULT 'grid' CHECK (layout_type IN ('grid', 'freeform')),
  columns INTEGER DEFAULT 12, -- Grid columns (12-column grid system)
  row_height INTEGER DEFAULT 80, -- Row height in pixels

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Table: dashboard_widgets
-- Stores individual widget instances placed on dashboards
-- =============================================================================

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES custom_dashboards(id) ON DELETE CASCADE,

  -- Widget type and configuration
  widget_type TEXT NOT NULL CHECK (widget_type IN (
    -- Stats widgets
    'stat_vendors_count',
    'stat_vendors_by_tier',
    'stat_vendors_by_risk',
    'stat_incidents_count',
    'stat_incidents_by_status',
    'stat_tasks_count',
    'stat_questionnaires_count',
    'stat_compliance_score',
    'stat_remediation_progress',

    -- Chart widgets
    'chart_risk_distribution',
    'chart_compliance_trend',
    'chart_vendor_tier_pie',
    'chart_incident_trend',
    'chart_task_burndown',
    'chart_maturity_radar',

    -- List widgets
    'list_recent_activity',
    'list_pending_deadlines',
    'list_open_incidents',
    'list_high_risk_vendors',
    'list_expiring_contracts',
    'list_pending_tasks',
    'list_monitoring_alerts',

    -- Table widgets
    'table_vendors',
    'table_incidents',
    'table_tasks',
    'table_questionnaires',
    'table_contracts',

    -- Special widgets
    'compliance_gauge',
    'risk_heat_map',
    'framework_overview',
    'getting_started',
    'quick_actions'
  )),

  -- Widget display
  title TEXT, -- Custom title (null = use default)

  -- Grid position (for grid layout)
  grid_x INTEGER NOT NULL DEFAULT 0, -- Column position (0-11)
  grid_y INTEGER NOT NULL DEFAULT 0, -- Row position
  grid_w INTEGER NOT NULL DEFAULT 4, -- Width in columns (1-12)
  grid_h INTEGER NOT NULL DEFAULT 3, -- Height in rows

  -- Widget-specific configuration
  config JSONB DEFAULT '{}', -- Widget-specific settings
  -- Example config: { "limit": 5, "filter": "critical", "showChart": true }

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Table: dashboard_favorites
-- Tracks which dashboards users have favorited
-- =============================================================================

CREATE TABLE IF NOT EXISTS dashboard_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_id UUID NOT NULL REFERENCES custom_dashboards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(user_id, dashboard_id)
);

-- =============================================================================
-- Indexes for performance
-- =============================================================================

CREATE INDEX idx_custom_dashboards_org ON custom_dashboards(organization_id);
CREATE INDEX idx_custom_dashboards_created_by ON custom_dashboards(created_by);
CREATE INDEX idx_custom_dashboards_default ON custom_dashboards(organization_id, is_default) WHERE is_default = true;
CREATE INDEX idx_custom_dashboards_shared ON custom_dashboards(organization_id, is_shared) WHERE is_shared = true;

CREATE INDEX idx_dashboard_widgets_dashboard ON dashboard_widgets(dashboard_id);
CREATE INDEX idx_dashboard_widgets_type ON dashboard_widgets(widget_type);

CREATE INDEX idx_dashboard_favorites_user ON dashboard_favorites(user_id);
CREATE INDEX idx_dashboard_favorites_dashboard ON dashboard_favorites(dashboard_id);

-- =============================================================================
-- Triggers for updated_at
-- =============================================================================

CREATE TRIGGER update_custom_dashboards_updated_at
  BEFORE UPDATE ON custom_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE custom_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_favorites ENABLE ROW LEVEL SECURITY;

-- Custom dashboards: Users can see their own + shared dashboards in their org
CREATE POLICY custom_dashboards_select ON custom_dashboards
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND (
      created_by = auth.uid()
      OR is_shared = true
      OR is_template = true
    )
  );

CREATE POLICY custom_dashboards_insert ON custom_dashboards
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY custom_dashboards_update ON custom_dashboards
  FOR UPDATE USING (
    created_by = auth.uid()
    OR (
      -- Admins can update org dashboards
      organization_id IN (
        SELECT organization_id FROM users
        WHERE id = auth.uid() AND role IN ('admin', 'owner')
      )
    )
  );

CREATE POLICY custom_dashboards_delete ON custom_dashboards
  FOR DELETE USING (
    created_by = auth.uid()
    OR (
      organization_id IN (
        SELECT organization_id FROM users
        WHERE id = auth.uid() AND role IN ('admin', 'owner')
      )
    )
  );

-- Dashboard widgets: Inherit access from parent dashboard
CREATE POLICY dashboard_widgets_select ON dashboard_widgets
  FOR SELECT USING (
    dashboard_id IN (
      SELECT id FROM custom_dashboards WHERE
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
        AND (created_by = auth.uid() OR is_shared = true OR is_template = true)
    )
  );

CREATE POLICY dashboard_widgets_insert ON dashboard_widgets
  FOR INSERT WITH CHECK (
    dashboard_id IN (
      SELECT id FROM custom_dashboards WHERE created_by = auth.uid()
    )
  );

CREATE POLICY dashboard_widgets_update ON dashboard_widgets
  FOR UPDATE USING (
    dashboard_id IN (
      SELECT id FROM custom_dashboards WHERE created_by = auth.uid()
    )
  );

CREATE POLICY dashboard_widgets_delete ON dashboard_widgets
  FOR DELETE USING (
    dashboard_id IN (
      SELECT id FROM custom_dashboards WHERE created_by = auth.uid()
    )
  );

-- Dashboard favorites: Users manage their own favorites
CREATE POLICY dashboard_favorites_select ON dashboard_favorites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY dashboard_favorites_insert ON dashboard_favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY dashboard_favorites_delete ON dashboard_favorites
  FOR DELETE USING (user_id = auth.uid());

-- =============================================================================
-- Default dashboard templates (inserted via seed, not migration)
-- =============================================================================

COMMENT ON TABLE custom_dashboards IS 'User-created custom dashboards with drag-and-drop widgets';
COMMENT ON TABLE dashboard_widgets IS 'Widget instances placed on custom dashboards';
COMMENT ON TABLE dashboard_favorites IS 'User favorites for quick access to dashboards';
