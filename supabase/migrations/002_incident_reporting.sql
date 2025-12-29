-- Migration: 002_incident_reporting
-- Description: Incident Reporting Module for DORA Article 19 compliance
-- Created: 2024-12-29
-- Depends on: 001_initial_schema.sql

-- ============================================
-- INCIDENTS TABLE
-- ============================================
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identification
  incident_ref TEXT NOT NULL, -- Internal reference (auto-generated)
  external_ref TEXT, -- Regulator reference (after submission)

  -- Classification (per EU 2024/1772, 2025/301-302)
  classification TEXT NOT NULL CHECK (classification IN ('major', 'significant', 'minor')),
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'cyber_attack', 'system_failure', 'human_error',
    'third_party_failure', 'natural_disaster', 'other'
  )),

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN (
    'draft', 'detected', 'initial_submitted',
    'intermediate_submitted', 'final_submitted', 'closed'
  )) DEFAULT 'draft',

  -- Timeline
  detection_datetime TIMESTAMPTZ NOT NULL,
  occurrence_datetime TIMESTAMPTZ,
  recovery_datetime TIMESTAMPTZ,
  resolution_datetime TIMESTAMPTZ,

  -- Impact assessment
  services_affected TEXT[] DEFAULT '{}',
  critical_functions_affected TEXT[] DEFAULT '{}',
  clients_affected_count INTEGER,
  clients_affected_percentage FLOAT CHECK (clients_affected_percentage >= 0 AND clients_affected_percentage <= 100),
  transactions_affected_count INTEGER,
  transactions_value_affected DECIMAL(18,2),
  data_breach BOOLEAN DEFAULT FALSE,
  data_records_affected INTEGER,
  geographic_spread TEXT[] DEFAULT '{}', -- Country codes (ISO 3166-1 alpha-2)
  economic_impact DECIMAL(18,2),
  reputational_impact TEXT CHECK (reputational_impact IN ('low', 'medium', 'high')),
  duration_hours FLOAT,

  -- Description
  title TEXT NOT NULL,
  description TEXT,
  root_cause TEXT,
  remediation_actions TEXT,
  lessons_learned TEXT,

  -- Vendor linkage (for third-party incidents)
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,

  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate incident reference
CREATE OR REPLACE FUNCTION generate_incident_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.incident_ref := 'INC-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD(CAST((
      SELECT COUNT(*) + 1 FROM incidents
      WHERE organization_id = NEW.organization_id
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    ) AS TEXT), 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_incident_ref
  BEFORE INSERT ON incidents
  FOR EACH ROW
  WHEN (NEW.incident_ref IS NULL)
  EXECUTE FUNCTION generate_incident_ref();

-- Auto-update updated_at
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- INCIDENT REPORTS TABLE
-- ============================================
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

  -- Report type (per DORA Article 19)
  report_type TEXT NOT NULL CHECK (report_type IN ('initial', 'intermediate', 'final')),
  version INTEGER NOT NULL DEFAULT 1,

  -- Submission status
  status TEXT NOT NULL CHECK (status IN ('draft', 'ready', 'submitted', 'acknowledged')) DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,

  -- Content (structured per ESA template)
  report_content JSONB NOT NULL DEFAULT '{}',

  -- Deadlines
  deadline TIMESTAMPTZ NOT NULL,

  -- Export
  export_format TEXT CHECK (export_format IN ('pdf', 'xml', 'json')),
  export_path TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one report type per incident per version
  UNIQUE(incident_id, report_type, version)
);

-- Auto-update updated_at
CREATE TRIGGER update_incident_reports_updated_at
  BEFORE UPDATE ON incident_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create reports with deadlines when incident is created
CREATE OR REPLACE FUNCTION create_incident_reports()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create reports for major or significant incidents
  IF NEW.classification IN ('major', 'significant') THEN
    -- Initial report: 4 hours from detection
    INSERT INTO incident_reports (incident_id, report_type, deadline)
    VALUES (NEW.id, 'initial', NEW.detection_datetime + INTERVAL '4 hours');

    -- Intermediate report: 72 hours from detection
    INSERT INTO incident_reports (incident_id, report_type, deadline)
    VALUES (NEW.id, 'intermediate', NEW.detection_datetime + INTERVAL '72 hours');

    -- Final report: 1 month from detection
    INSERT INTO incident_reports (incident_id, report_type, deadline)
    VALUES (NEW.id, 'final', NEW.detection_datetime + INTERVAL '1 month');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_incident_reports
  AFTER INSERT ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION create_incident_reports();

-- ============================================
-- INCIDENT EVENTS TABLE (Timeline)
-- ============================================
CREATE TABLE incident_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'classified', 'escalated', 'updated',
    'report_submitted', 'report_acknowledged',
    'mitigation_started', 'service_restored', 'resolved', 'closed'
  )),
  event_datetime TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'
);

-- Auto-create initial event
CREATE OR REPLACE FUNCTION create_incident_created_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO incident_events (incident_id, event_type, description, user_id)
  VALUES (NEW.id, 'created', 'Incident reported', NEW.created_by);

  INSERT INTO incident_events (incident_id, event_type, description, metadata)
  VALUES (NEW.id, 'classified', 'Auto-classified as ' || NEW.classification,
    jsonb_build_object('classification', NEW.classification));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_incident_events
  AFTER INSERT ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION create_incident_created_event();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_incidents_organization ON incidents(organization_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_classification ON incidents(classification);
CREATE INDEX idx_incidents_detection ON incidents(detection_datetime DESC);
CREATE INDEX idx_incidents_vendor ON incidents(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX idx_incidents_ref ON incidents(incident_ref);

CREATE INDEX idx_incident_reports_incident ON incident_reports(incident_id);
CREATE INDEX idx_incident_reports_status ON incident_reports(status);
CREATE INDEX idx_incident_reports_deadline ON incident_reports(deadline)
  WHERE status NOT IN ('submitted', 'acknowledged');

CREATE INDEX idx_incident_events_incident ON incident_events(incident_id);
CREATE INDEX idx_incident_events_datetime ON incident_events(event_datetime DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_events ENABLE ROW LEVEL SECURITY;

-- Incidents: org-level access
CREATE POLICY "Users can view org incidents"
  ON incidents FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create org incidents"
  ON incidents FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update org incidents"
  ON incidents FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- Incident reports: via incident relationship
CREATE POLICY "Users can view org incident_reports"
  ON incident_reports FOR SELECT
  USING (incident_id IN (
    SELECT id FROM incidents WHERE organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can create org incident_reports"
  ON incident_reports FOR INSERT
  WITH CHECK (incident_id IN (
    SELECT id FROM incidents WHERE organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can update org incident_reports"
  ON incident_reports FOR UPDATE
  USING (incident_id IN (
    SELECT id FROM incidents WHERE organization_id = get_user_organization_id()
  ));

-- Incident events: via incident relationship
CREATE POLICY "Users can view org incident_events"
  ON incident_events FOR SELECT
  USING (incident_id IN (
    SELECT id FROM incidents WHERE organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can create org incident_events"
  ON incident_events FOR INSERT
  WITH CHECK (incident_id IN (
    SELECT id FROM incidents WHERE organization_id = get_user_organization_id()
  ));

-- ============================================
-- HELPER VIEWS
-- ============================================

-- View: Incidents with overdue reports
CREATE VIEW incidents_with_overdue_reports AS
SELECT
  i.*,
  ir.report_type,
  ir.deadline,
  ir.status AS report_status,
  (NOW() > ir.deadline AND ir.status NOT IN ('submitted', 'acknowledged')) AS is_overdue
FROM incidents i
JOIN incident_reports ir ON ir.incident_id = i.id
WHERE ir.status NOT IN ('submitted', 'acknowledged')
ORDER BY ir.deadline ASC;

-- View: Incident statistics by organization
CREATE VIEW incident_stats AS
SELECT
  organization_id,
  COUNT(*) AS total_incidents,
  COUNT(*) FILTER (WHERE classification = 'major') AS major_incidents,
  COUNT(*) FILTER (WHERE classification = 'significant') AS significant_incidents,
  COUNT(*) FILTER (WHERE classification = 'minor') AS minor_incidents,
  COUNT(*) FILTER (WHERE status NOT IN ('final_submitted', 'closed')) AS open_incidents,
  COUNT(*) FILTER (WHERE data_breach = TRUE) AS data_breaches,
  AVG(duration_hours) FILTER (WHERE duration_hours IS NOT NULL) AS avg_duration_hours
FROM incidents
WHERE created_at >= NOW() - INTERVAL '1 year'
GROUP BY organization_id;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE incidents IS 'ICT-related incidents per DORA Article 19';
COMMENT ON TABLE incident_reports IS 'Regulatory reports (initial/intermediate/final) for incidents';
COMMENT ON TABLE incident_events IS 'Timeline of incident lifecycle events';
COMMENT ON COLUMN incidents.classification IS 'Major/Significant/Minor per EU 2024/1772 criteria';
COMMENT ON COLUMN incident_reports.deadline IS 'Regulatory deadline: 4h (initial), 72h (intermediate), 1 month (final)';
