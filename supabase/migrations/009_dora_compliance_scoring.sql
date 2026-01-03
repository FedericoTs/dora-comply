-- DORA Compliance Scoring System
-- Migration 009: Implements comprehensive DORA compliance tracking with maturity levels
-- Based on DORA (EU 2022/2554) Articles 5-45

-- =============================================================================
-- Table 1: DORA Requirements (All 64 articles organized by pillar)
-- =============================================================================
CREATE TABLE IF NOT EXISTS dora_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_number TEXT NOT NULL,           -- 'Art. 5', 'Art. 17', etc.
  article_title TEXT NOT NULL,            -- 'ICT Risk Management Framework'
  chapter TEXT NOT NULL,                  -- 'II', 'III', 'IV', 'V', 'VI'
  pillar TEXT NOT NULL,                   -- 'ICT_RISK', 'INCIDENT', 'TESTING', 'TPRM', 'SHARING'
  requirement_text TEXT NOT NULL,         -- Full requirement description
  evidence_needed TEXT[],                 -- Array of evidence types needed
  regulatory_reference TEXT,              -- Link to official RTS
  is_mandatory BOOLEAN DEFAULT true,
  applies_to TEXT[] DEFAULT ARRAY['all'], -- Entity types: 'credit_institution', 'investment_firm', etc.
  priority TEXT DEFAULT 'high',           -- 'critical', 'high', 'medium', 'low'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Table 2: Testable Criteria for Each Requirement
-- =============================================================================
CREATE TABLE IF NOT EXISTS dora_requirement_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID REFERENCES dora_requirements(id) ON DELETE CASCADE,
  criterion_code TEXT NOT NULL,           -- 'Art5.1a', 'Art5.1b'
  criterion_text TEXT NOT NULL,           -- Specific testable statement
  evidence_type TEXT NOT NULL,            -- 'document', 'system_config', 'log', 'interview'
  validation_method TEXT NOT NULL,        -- 'inspection', 'observation', 'reperformance', 'inquiry'
  weight FLOAT DEFAULT 1.0,               -- Importance weight for scoring
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Table 3: SOC 2 to DORA Mapping
-- =============================================================================
CREATE TABLE IF NOT EXISTS soc2_to_dora_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soc2_category TEXT NOT NULL,            -- 'CC1', 'CC6', 'A', 'C'
  soc2_control_pattern TEXT,              -- Regex pattern for control IDs
  dora_requirement_id UUID REFERENCES dora_requirements(id) ON DELETE CASCADE,
  mapping_strength TEXT NOT NULL,         -- 'full', 'partial', 'none'
  coverage_percentage INT DEFAULT 0,      -- For partial: what % is covered
  gap_description TEXT,                   -- What's missing for full compliance
  remediation_guidance TEXT,              -- How to close the gap
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Table 4: Vendor DORA Compliance Status
-- =============================================================================
CREATE TABLE IF NOT EXISTS vendor_dora_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  assessment_date TIMESTAMPTZ DEFAULT NOW(),

  -- Maturity levels per pillar (0-4)
  pillar_ict_risk_maturity INT CHECK (pillar_ict_risk_maturity BETWEEN 0 AND 4),
  pillar_incident_maturity INT CHECK (pillar_incident_maturity BETWEEN 0 AND 4),
  pillar_testing_maturity INT CHECK (pillar_testing_maturity BETWEEN 0 AND 4),
  pillar_tprm_maturity INT CHECK (pillar_tprm_maturity BETWEEN 0 AND 4),
  pillar_sharing_maturity INT CHECK (pillar_sharing_maturity BETWEEN 0 AND 4),

  -- Overall assessment
  overall_maturity_level INT CHECK (overall_maturity_level BETWEEN 0 AND 4),
  overall_readiness_status TEXT CHECK (overall_readiness_status IN ('compliant', 'partial', 'non_compliant', 'not_assessed')),
  estimated_remediation_months INT,

  -- Evidence summary
  evidence_summary JSONB DEFAULT '{}',    -- { total: 64, sufficient: 40, partial: 15, insufficient: 9 }
  critical_gaps TEXT[],                   -- Array of critical gap descriptions

  -- Source documents
  source_documents UUID[],                -- Array of document IDs used for assessment

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, organization_id)
);

-- =============================================================================
-- Table 5: Requirement-Level Evidence Tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS vendor_dora_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES dora_requirements(id) ON DELETE CASCADE,

  -- Evidence status
  design_status TEXT CHECK (design_status IN ('validated', 'partial', 'missing', 'not_applicable')),
  operating_status TEXT CHECK (operating_status IN ('validated', 'partial', 'missing', 'not_tested')),

  -- Maturity assessment
  maturity_level INT CHECK (maturity_level BETWEEN 0 AND 4),

  -- Evidence sources
  evidence_sources JSONB DEFAULT '[]',    -- [{ documentId, controlId, pageRef, confidence }]

  -- Gap details
  gap_type TEXT CHECK (gap_type IN ('design', 'operational', 'both', 'none')),
  gap_description TEXT,
  remediation_priority TEXT CHECK (remediation_priority IN ('critical', 'high', 'medium', 'low')),
  remediation_status TEXT CHECK (remediation_status IN ('not_started', 'in_progress', 'completed', 'verified')) DEFAULT 'not_started',
  remediation_notes TEXT,

  -- Verification
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  verification_method TEXT CHECK (verification_method IN ('ai_extracted', 'manual_review', 'audit_report')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, organization_id, requirement_id)
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================
CREATE INDEX idx_dora_requirements_pillar ON dora_requirements(pillar);
CREATE INDEX idx_dora_requirements_article ON dora_requirements(article_number);
CREATE INDEX idx_soc2_dora_mapping_category ON soc2_to_dora_mapping(soc2_category);
CREATE INDEX idx_vendor_dora_compliance_vendor ON vendor_dora_compliance(vendor_id);
CREATE INDEX idx_vendor_dora_evidence_vendor ON vendor_dora_evidence(vendor_id);
CREATE INDEX idx_vendor_dora_evidence_requirement ON vendor_dora_evidence(requirement_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================
ALTER TABLE dora_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE dora_requirement_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc2_to_dora_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_dora_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_dora_evidence ENABLE ROW LEVEL SECURITY;

-- Public read access to DORA requirements (reference data)
CREATE POLICY "Anyone can view DORA requirements"
  ON dora_requirements FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view DORA criteria"
  ON dora_requirement_criteria FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view SOC2-DORA mappings"
  ON soc2_to_dora_mapping FOR SELECT
  USING (true);

-- Organization-scoped policies for vendor compliance data
CREATE POLICY "Users can view their org vendor compliance"
  ON vendor_dora_compliance FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert their org vendor compliance"
  ON vendor_dora_compliance FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their org vendor compliance"
  ON vendor_dora_compliance FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can view their org vendor evidence"
  ON vendor_dora_evidence FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert their org vendor evidence"
  ON vendor_dora_evidence FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their org vendor evidence"
  ON vendor_dora_evidence FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- Service role full access
CREATE POLICY "Service role full access dora_requirements"
  ON dora_requirements FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access dora_requirement_criteria"
  ON dora_requirement_criteria FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access soc2_to_dora_mapping"
  ON soc2_to_dora_mapping FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access vendor_dora_compliance"
  ON vendor_dora_compliance FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access vendor_dora_evidence"
  ON vendor_dora_evidence FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- SEED DATA: DORA Requirements (Key Articles from 5 Pillars)
-- =============================================================================

-- PILLAR 1: ICT RISK MANAGEMENT (Chapter II, Articles 5-16)
INSERT INTO dora_requirements (article_number, article_title, chapter, pillar, requirement_text, evidence_needed, priority) VALUES
('Art. 5', 'Governance and Organisation', 'II', 'ICT_RISK',
 'Financial entities shall have an internal governance and control framework ensuring effective and prudent ICT risk management. The management body shall define, approve, oversee and be accountable for the ICT risk management framework.',
 ARRAY['ICT risk management policy', 'Board approval minutes', 'RACI matrix', 'Risk appetite statement'],
 'critical'),

('Art. 6', 'ICT Risk Management Framework', 'II', 'ICT_RISK',
 'Financial entities shall establish a sound, comprehensive and well-documented ICT risk management framework as part of their overall risk management system. The framework shall include strategies, policies, procedures, protocols and tools necessary to protect ICT assets.',
 ARRAY['ICT risk framework document', 'ICT policies', 'Risk assessment methodology', 'Three lines of defense documentation'],
 'critical'),

('Art. 7', 'ICT Systems, Protocols and Tools', 'II', 'ICT_RISK',
 'Financial entities shall ensure that ICT systems are reliable and that their capacity is sufficient to meet business requirements and that they are technologically resilient to withstand adverse conditions.',
 ARRAY['System architecture documentation', 'Capacity planning reports', 'Technology roadmap', 'Patch management records'],
 'high'),

('Art. 8', 'Identification', 'II', 'ICT_RISK',
 'Financial entities shall identify, classify and adequately document all ICT supported business functions, roles and responsibilities, ICT assets and their dependencies.',
 ARRAY['ICT asset inventory', 'Business impact analysis', 'Criticality classification', 'Data flow diagrams'],
 'high'),

('Art. 9', 'Protection and Prevention', 'II', 'ICT_RISK',
 'Financial entities shall continuously monitor and control the security and functioning of ICT systems and shall minimise the impact of ICT risk through the deployment of appropriate ICT security tools, policies and procedures.',
 ARRAY['Security monitoring tools', 'Access control policies', 'Vulnerability management program', 'Security awareness training records'],
 'high'),

('Art. 10', 'Detection', 'II', 'ICT_RISK',
 'Financial entities shall have mechanisms in place to promptly detect anomalous activities, including ICT network performance issues and ICT-related incidents.',
 ARRAY['SIEM configuration', 'Alert thresholds', 'Detection procedures', 'Incident detection metrics'],
 'high'),

('Art. 11', 'Response and Recovery', 'II', 'ICT_RISK',
 'Financial entities shall put in place a comprehensive ICT business continuity policy as part of their operational resilience policy. Recovery time objectives and recovery point objectives shall be established for each function.',
 ARRAY['BCP/DRP documentation', 'RTO/RPO definitions', 'Recovery procedures', 'Backup policies'],
 'critical'),

('Art. 12', 'Backup Policies and Procedures', 'II', 'ICT_RISK',
 'Financial entities shall ensure data backup and recovery capabilities. Backup data shall be stored in a geographically separate location, sufficiently distant from the primary location.',
 ARRAY['Backup policy', 'Backup test results', 'Geographic separation evidence', 'Restoration test logs'],
 'high'),

('Art. 13', 'Learning and Evolving', 'II', 'ICT_RISK',
 'Financial entities shall gather information on vulnerabilities and cyber threats relevant to ICT-supported business functions. Post-incident reviews shall be conducted after major ICT incidents.',
 ARRAY['Threat intelligence feeds', 'Post-incident review reports', 'Lessons learned documentation', 'Improvement tracking'],
 'medium'),

('Art. 14', 'Communication', 'II', 'ICT_RISK',
 'Financial entities shall have crisis communication plans and ensure that responsible staff members are able to communicate, escalate and share information in a timely manner.',
 ARRAY['Crisis communication plan', 'Escalation procedures', 'Contact lists', 'Communication drills evidence'],
 'medium'),

('Art. 15', 'ICT Risk Management Tools', 'II', 'ICT_RISK',
 'Financial entities shall use and maintain updated ICT systems, protocols and tools that are appropriate, reliable and technologically resilient.',
 ARRAY['Tool inventory', 'Tool evaluation criteria', 'Update/patch records', 'Tool effectiveness reviews'],
 'medium'),

('Art. 16', 'Simplified ICT Risk Management', 'II', 'ICT_RISK',
 'Microenterprises and entities meeting Article 16 criteria may apply simplified ICT risk management requirements.',
 ARRAY['Entity classification evidence', 'Simplified framework documentation'],
 'low');

-- PILLAR 2: INCIDENT MANAGEMENT (Chapter III, Articles 17-23)
INSERT INTO dora_requirements (article_number, article_title, chapter, pillar, requirement_text, evidence_needed, priority) VALUES
('Art. 17', 'ICT-related Incident Management Process', 'III', 'INCIDENT',
 'Financial entities shall define, establish and implement an ICT-related incident management process to detect, manage and notify ICT-related incidents.',
 ARRAY['Incident management policy', 'Incident response procedures', 'Classification criteria', 'Response team structure'],
 'critical'),

('Art. 18', 'Classification of ICT-related Incidents', 'III', 'INCIDENT',
 'Financial entities shall classify ICT-related incidents based on criteria including number of clients affected, duration, geographical spread, data losses, criticality of services affected, and economic impact.',
 ARRAY['Incident classification matrix', 'Threshold definitions', 'Major incident criteria', 'Impact assessment methodology'],
 'critical'),

('Art. 19', 'Reporting of Major ICT-related Incidents', 'III', 'INCIDENT',
 'Financial entities shall report major ICT-related incidents to the competent authority. Initial notification within 4 hours, intermediate report within 72 hours, final report within 1 month.',
 ARRAY['Incident reporting procedures', 'Notification templates', 'Reporting timeline evidence', 'Authority contact details'],
 'critical'),

('Art. 20', 'Content of Reports', 'III', 'INCIDENT',
 'Incident reports shall contain specific information as defined by regulatory technical standards including root cause, impact, resolution steps and preventive measures.',
 ARRAY['Report templates', 'ESA-compliant formats', 'Sample incident reports'],
 'high'),

('Art. 21', 'Centralised Reporting', 'III', 'INCIDENT',
 'ESAs shall develop a single EU Hub for incident reporting to enable centralised reporting.',
 ARRAY['Hub registration', 'Reporting integration documentation'],
 'medium'),

('Art. 22', 'Supervisory Feedback', 'III', 'INCIDENT',
 'Competent authorities shall provide feedback and guidance to financial entities on reported incidents.',
 ARRAY['Feedback tracking', 'Remediation evidence'],
 'low'),

('Art. 23', 'Voluntary Notification', 'III', 'INCIDENT',
 'Financial entities may, on a voluntary basis, notify significant cyber threats to the competent authority.',
 ARRAY['Voluntary notification procedures', 'Threat notification records'],
 'low');

-- PILLAR 3: DIGITAL OPERATIONAL RESILIENCE TESTING (Chapter IV, Articles 24-27)
INSERT INTO dora_requirements (article_number, article_title, chapter, pillar, requirement_text, evidence_needed, priority) VALUES
('Art. 24', 'General Requirements for Testing', 'IV', 'TESTING',
 'Financial entities shall establish and maintain a sound and comprehensive digital operational resilience testing programme. Testing shall be carried out by independent parties.',
 ARRAY['Testing programme documentation', 'Annual testing schedule', 'Independence requirements', 'Testing methodology'],
 'critical'),

('Art. 25', 'Testing of ICT Tools and Systems', 'IV', 'TESTING',
 'The testing programme shall include vulnerability assessments and scans, open source analysis, network security assessments, gap analyses, physical security reviews, questionnaires and scanning software solutions, source code reviews, scenario-based tests, compatibility testing, performance testing, end-to-end testing, penetration testing.',
 ARRAY['Vulnerability scan reports', 'Penetration test reports', 'Source code review results', 'Performance test results'],
 'high'),

('Art. 26', 'Advanced Testing (TLPT)', 'IV', 'TESTING',
 'Significant financial entities shall carry out threat-led penetration testing (TLPT) at least every 3 years. TLPT shall cover critical or important functions and shall be performed on live production systems.',
 ARRAY['TLPT programme', 'Red team assessment reports', 'TIBER-EU compliance evidence', 'Production testing authorization'],
 'critical'),

('Art. 27', 'Requirements for Testers', 'IV', 'TESTING',
 'TLPT testers shall be certified (CREST, OSCP equivalent), have professional indemnity insurance, and follow approved threat intelligence frameworks.',
 ARRAY['Tester certifications', 'Insurance certificates', 'Framework compliance evidence'],
 'high');

-- PILLAR 4: THIRD-PARTY RISK MANAGEMENT (Chapter V, Articles 28-44)
INSERT INTO dora_requirements (article_number, article_title, chapter, pillar, requirement_text, evidence_needed, priority) VALUES
('Art. 28', 'General Principles', 'V', 'TPRM',
 'Financial entities shall manage ICT third-party risk as an integral component of ICT risk. A strategy on ICT third-party risk shall be adopted and reviewed at least annually.',
 ARRAY['ICT third-party risk strategy', 'Annual review evidence', 'Risk assessment methodology'],
 'critical'),

('Art. 29', 'Register of Information', 'V', 'TPRM',
 'Financial entities shall maintain and update a register of information in relation to all contractual arrangements on the use of ICT services provided by third-party service providers.',
 ARRAY['Register of Information (complete)', 'Update procedures', 'RoI audit trail'],
 'critical'),

('Art. 30', 'Key Contractual Provisions', 'V', 'TPRM',
 'Contractual arrangements shall include specific provisions on: service level descriptions, data location, access rights, performance targets, termination rights, exit strategies, cooperation with authorities.',
 ARRAY['Contract templates', 'Clause compliance matrix', 'Sample contracts with mandatory clauses'],
 'critical'),

('Art. 31', 'Concentration Risk', 'V', 'TPRM',
 'Financial entities shall identify and assess ICT concentration risk arising from reliance on critical third-party ICT service providers. Pre-contractual concentration risk assessment shall be performed.',
 ARRAY['Concentration risk assessment', 'Substitutability analysis', 'Alternative provider evaluation'],
 'high'),

('Art. 32', 'Subcontracting', 'V', 'TPRM',
 'Where ICT third-party service providers subcontract ICT services to other providers, financial entities shall ensure contractual obligations flow through.',
 ARRAY['Subcontracting policy', 'Subcontractor register', 'Flow-down clause evidence'],
 'high'),

('Art. 33-44', 'CTPP Oversight Framework', 'V', 'TPRM',
 'Critical third-party providers (CTPPs) are subject to direct oversight by Lead Overseers. Financial entities using CTPPs must ensure compliance with oversight requirements.',
 ARRAY['CTPP identification', 'Oversight compliance evidence', 'Lead Overseer communications'],
 'high');

-- PILLAR 5: INFORMATION SHARING (Chapter VI, Article 45)
INSERT INTO dora_requirements (article_number, article_title, chapter, pillar, requirement_text, evidence_needed, priority) VALUES
('Art. 45', 'Information Sharing Arrangements', 'VI', 'SHARING',
 'Financial entities may exchange amongst themselves cyber threat information and intelligence, including indicators of compromise, tactics, techniques and procedures, cybersecurity alerts and configuration tools.',
 ARRAY['FS-ISAC membership', 'Information sharing agreements', 'TLP compliance procedures', 'Shared threat intelligence records'],
 'medium');

-- =============================================================================
-- SEED DATA: SOC 2 to DORA Mappings
-- =============================================================================

-- CC1 (Control Environment) -> DORA Mappings
INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'CC1', '^CC1\.', id, 'partial', 60,
  'SOC 2 CC1 covers general control environment but lacks DORA-specific board accountability requirements for ICT risk.',
  'Add explicit board-level ICT risk oversight documentation, RACI matrix for ICT responsibilities, and quantified risk appetite statement.'
FROM dora_requirements WHERE article_number = 'Art. 5';

INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'CC1', '^CC1\.', id, 'partial', 50,
  'SOC 2 CC1 addresses risk management but not the three lines of defense model required by DORA.',
  'Document ICT risk framework with explicit three lines of defense, ICT-specific policies, and annual review cycle.'
FROM dora_requirements WHERE article_number = 'Art. 6';

-- CC3 (Risk Assessment) -> DORA Mappings
INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'CC3', '^CC3\.', id, 'partial', 70,
  'SOC 2 CC3 covers risk assessment but lacks ICT asset criticality classification methodology.',
  'Add formal ICT asset inventory with criticality ratings, business function dependencies, and data flow mapping.'
FROM dora_requirements WHERE article_number = 'Art. 8';

-- CC4 (Monitoring) -> DORA Mappings
INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'CC4', '^CC4\.', id, 'full', 90,
  'SOC 2 CC4 monitoring controls align well with DORA detection requirements.',
  'Ensure SIEM covers all critical ICT assets and detection metrics are documented.'
FROM dora_requirements WHERE article_number = 'Art. 10';

-- CC5 (Control Activities) -> DORA Mappings
INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'CC5', '^CC5\.', id, 'full', 85,
  'SOC 2 CC5 access controls align with DORA protection requirements.',
  'Verify continuous monitoring is in place and access reviews are documented.'
FROM dora_requirements WHERE article_number = 'Art. 9';

-- CC6 (Logical Access) -> DORA Mappings
INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'CC6', '^CC6\.', id, 'full', 85,
  'SOC 2 CC6 logical access controls map well to DORA ICT system requirements.',
  'Ensure capacity monitoring and technology resilience testing are documented.'
FROM dora_requirements WHERE article_number = 'Art. 7';

-- CC7 (System Operations) -> DORA Mappings
INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'CC7', '^CC7\.', id, 'partial', 60,
  'SOC 2 CC7 covers incident response but lacks DORA-specific classification thresholds and reporting timelines.',
  'Implement DORA incident classification matrix with major incident criteria and 4h/72h/1m reporting workflow.'
FROM dora_requirements WHERE article_number = 'Art. 17';

INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'CC7', '^CC7\.', id, 'partial', 50,
  'SOC 2 CC7 covers BCP but lacks specific RTO/RPO per function as required by DORA.',
  'Define explicit RTO/RPO for each critical business function and test annually.'
FROM dora_requirements WHERE article_number = 'Art. 11';

-- CC8 (Change Management) -> DORA Mappings
INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'CC8', '^CC8\.', id, 'partial', 60,
  'SOC 2 CC8 covers change management but lacks comprehensive testing programme requirements.',
  'Establish formal testing programme with annual schedule including vulnerability scans, penetration tests, and scenario-based tests.'
FROM dora_requirements WHERE article_number = 'Art. 25';

-- CC9 (Risk Mitigation) -> DORA Mappings
INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'CC9', '^CC9\.', id, 'partial', 40,
  'SOC 2 CC9 covers vendor risk but lacks DORA-specific Register of Information and concentration risk requirements.',
  'Implement full Register of Information per ESA templates and conduct concentration risk assessments.'
FROM dora_requirements WHERE article_number = 'Art. 29';

INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'CC9', '^CC9\.', id, 'partial', 50,
  'SOC 2 CC9 covers vendor contracts but lacks DORA mandatory clauses (exit, audit rights, data location).',
  'Review all ICT contracts for DORA Article 30 mandatory provisions and remediate gaps.'
FROM dora_requirements WHERE article_number = 'Art. 30';

-- Availability (A) -> DORA Mappings
INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'A', '^A\.', id, 'full', 90,
  'SOC 2 Availability criteria align well with DORA backup requirements.',
  'Verify geographic separation of backups and annual restoration testing.'
FROM dora_requirements WHERE article_number = 'Art. 12';

-- NO SOC 2 COVERAGE - Gaps requiring additional evidence
INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'NONE', NULL, id, 'none', 0,
  'No SOC 2 equivalent. DORA requires specific incident classification thresholds for major incidents.',
  'Create incident classification matrix with thresholds for clients affected, duration, data loss, economic impact.'
FROM dora_requirements WHERE article_number = 'Art. 18';

INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'NONE', NULL, id, 'none', 0,
  'No SOC 2 equivalent. DORA requires specific reporting timelines: 4h initial, 72h intermediate, 1m final.',
  'Implement automated incident reporting workflow with ESA templates and SLA monitoring.'
FROM dora_requirements WHERE article_number = 'Art. 19';

INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'NONE', NULL, id, 'none', 0,
  'No SOC 2 equivalent. DORA requires TLPT (threat-led penetration testing) every 3 years on production systems.',
  'Engage CREST-certified red team for TIBER-EU compliant TLPT covering critical functions.'
FROM dora_requirements WHERE article_number = 'Art. 26';

INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'NONE', NULL, id, 'none', 0,
  'No SOC 2 equivalent. DORA requires concentration risk assessment for third-party providers.',
  'Assess substitutability of critical ICT providers and document alternative provider options.'
FROM dora_requirements WHERE article_number = 'Art. 31';

INSERT INTO soc2_to_dora_mapping (soc2_category, soc2_control_pattern, dora_requirement_id, mapping_strength, coverage_percentage, gap_description, remediation_guidance)
SELECT 'NONE', NULL, id, 'none', 0,
  'No SOC 2 equivalent. DORA encourages information sharing via ISACs.',
  'Consider FS-ISAC membership and establish TLP-compliant information sharing procedures.'
FROM dora_requirements WHERE article_number = 'Art. 45';

-- =============================================================================
-- Update trigger for vendor_dora_compliance
-- =============================================================================
CREATE OR REPLACE FUNCTION update_vendor_dora_compliance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendor_dora_compliance_updated
  BEFORE UPDATE ON vendor_dora_compliance
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_dora_compliance_timestamp();

CREATE TRIGGER vendor_dora_evidence_updated
  BEFORE UPDATE ON vendor_dora_evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_dora_compliance_timestamp();
