/**
 * DORA Requirements Static Data
 *
 * Complete mapping of DORA articles to SOC 2 controls
 * Based on EU Regulation 2022/2554 (Digital Operational Resilience Act)
 *
 * This data can be used client-side without database access.
 * For production, sync with dora_requirements table.
 */

import type { DORARequirement, SOC2ToDORAMapping, DORAPillar } from './dora-types';

// =============================================================================
// DORA Requirements (Key Articles from 5 Pillars)
// =============================================================================

export const DORA_REQUIREMENTS: DORARequirement[] = [
  // PILLAR 1: ICT RISK MANAGEMENT (Chapter II, Articles 5-16)
  {
    id: 'dora-art-5',
    article_number: 'Art. 5',
    article_title: 'Governance and Organisation',
    chapter: 'II',
    pillar: 'ICT_RISK',
    requirement_text: 'Financial entities shall have an internal governance and control framework ensuring effective and prudent ICT risk management. The management body shall define, approve, oversee and be accountable for the ICT risk management framework.',
    evidence_needed: ['ICT risk management policy', 'Board approval minutes', 'RACI matrix', 'Risk appetite statement'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'critical',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-6',
    article_number: 'Art. 6',
    article_title: 'ICT Risk Management Framework',
    chapter: 'II',
    pillar: 'ICT_RISK',
    requirement_text: 'Financial entities shall establish a sound, comprehensive and well-documented ICT risk management framework as part of their overall risk management system. The framework shall include strategies, policies, procedures, protocols and tools necessary to protect ICT assets.',
    evidence_needed: ['ICT risk framework document', 'ICT policies', 'Risk assessment methodology', 'Three lines of defense documentation'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'critical',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-7',
    article_number: 'Art. 7',
    article_title: 'ICT Systems, Protocols and Tools',
    chapter: 'II',
    pillar: 'ICT_RISK',
    requirement_text: 'Financial entities shall ensure that ICT systems are reliable and that their capacity is sufficient to meet business requirements and that they are technologically resilient to withstand adverse conditions.',
    evidence_needed: ['System architecture documentation', 'Capacity planning reports', 'Technology roadmap', 'Patch management records'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-8',
    article_number: 'Art. 8',
    article_title: 'Identification',
    chapter: 'II',
    pillar: 'ICT_RISK',
    requirement_text: 'Financial entities shall identify, classify and adequately document all ICT supported business functions, roles and responsibilities, ICT assets and their dependencies.',
    evidence_needed: ['ICT asset inventory', 'Business impact analysis', 'Criticality classification', 'Data flow diagrams'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-9',
    article_number: 'Art. 9',
    article_title: 'Protection and Prevention',
    chapter: 'II',
    pillar: 'ICT_RISK',
    requirement_text: 'Financial entities shall continuously monitor and control the security and functioning of ICT systems and shall minimise the impact of ICT risk through the deployment of appropriate ICT security tools, policies and procedures.',
    evidence_needed: ['Security monitoring tools', 'Access control policies', 'Vulnerability management program', 'Security awareness training records'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-10',
    article_number: 'Art. 10',
    article_title: 'Detection',
    chapter: 'II',
    pillar: 'ICT_RISK',
    requirement_text: 'Financial entities shall have mechanisms in place to promptly detect anomalous activities, including ICT network performance issues and ICT-related incidents.',
    evidence_needed: ['SIEM configuration', 'Alert thresholds', 'Detection procedures', 'Incident detection metrics'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-11',
    article_number: 'Art. 11',
    article_title: 'Response and Recovery',
    chapter: 'II',
    pillar: 'ICT_RISK',
    requirement_text: 'Financial entities shall put in place a comprehensive ICT business continuity policy as part of their operational resilience policy. Recovery time objectives and recovery point objectives shall be established for each function.',
    evidence_needed: ['BCP/DRP documentation', 'RTO/RPO definitions', 'Recovery procedures', 'Backup policies'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'critical',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-12',
    article_number: 'Art. 12',
    article_title: 'Backup Policies and Procedures',
    chapter: 'II',
    pillar: 'ICT_RISK',
    requirement_text: 'Financial entities shall ensure data backup and recovery capabilities. Backup data shall be stored in a geographically separate location, sufficiently distant from the primary location.',
    evidence_needed: ['Backup policy', 'Backup test results', 'Geographic separation evidence', 'Restoration test logs'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-13',
    article_number: 'Art. 13',
    article_title: 'Learning and Evolving',
    chapter: 'II',
    pillar: 'ICT_RISK',
    requirement_text: 'Financial entities shall gather information on vulnerabilities and cyber threats relevant to ICT-supported business functions. Post-incident reviews shall be conducted after major ICT incidents.',
    evidence_needed: ['Threat intelligence feeds', 'Post-incident review reports', 'Lessons learned documentation', 'Improvement tracking'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'medium',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-14',
    article_number: 'Art. 14',
    article_title: 'Communication',
    chapter: 'II',
    pillar: 'ICT_RISK',
    requirement_text: 'Financial entities shall have crisis communication plans and ensure that responsible staff members are able to communicate, escalate and share information in a timely manner.',
    evidence_needed: ['Crisis communication plan', 'Escalation procedures', 'Contact lists', 'Communication drills evidence'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'medium',
    created_at: new Date().toISOString(),
  },

  // PILLAR 2: INCIDENT MANAGEMENT (Chapter III, Articles 17-23)
  {
    id: 'dora-art-17',
    article_number: 'Art. 17',
    article_title: 'ICT-related Incident Management Process',
    chapter: 'III',
    pillar: 'INCIDENT',
    requirement_text: 'Financial entities shall define, establish and implement an ICT-related incident management process to detect, manage and notify ICT-related incidents.',
    evidence_needed: ['Incident management policy', 'Incident response procedures', 'Classification criteria', 'Response team structure'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'critical',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-18',
    article_number: 'Art. 18',
    article_title: 'Classification of ICT-related Incidents',
    chapter: 'III',
    pillar: 'INCIDENT',
    requirement_text: 'Financial entities shall classify ICT-related incidents based on criteria including number of clients affected, duration, geographical spread, data losses, criticality of services affected, and economic impact.',
    evidence_needed: ['Incident classification matrix', 'Threshold definitions', 'Major incident criteria', 'Impact assessment methodology'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'critical',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-19',
    article_number: 'Art. 19',
    article_title: 'Reporting of Major ICT-related Incidents',
    chapter: 'III',
    pillar: 'INCIDENT',
    requirement_text: 'Financial entities shall report major ICT-related incidents to the competent authority. Initial notification within 4 hours, intermediate report within 72 hours, final report within 1 month.',
    evidence_needed: ['Incident reporting procedures', 'Notification templates', 'Reporting timeline evidence', 'Authority contact details'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'critical',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-20',
    article_number: 'Art. 20',
    article_title: 'Content of Reports',
    chapter: 'III',
    pillar: 'INCIDENT',
    requirement_text: 'Incident reports shall contain specific information as defined by regulatory technical standards including root cause, impact, resolution steps and preventive measures.',
    evidence_needed: ['Report templates', 'ESA-compliant formats', 'Sample incident reports'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'high',
    created_at: new Date().toISOString(),
  },

  // PILLAR 3: DIGITAL OPERATIONAL RESILIENCE TESTING (Chapter IV, Articles 24-27)
  {
    id: 'dora-art-24',
    article_number: 'Art. 24',
    article_title: 'General Requirements for Testing',
    chapter: 'IV',
    pillar: 'TESTING',
    requirement_text: 'Financial entities shall establish and maintain a sound and comprehensive digital operational resilience testing programme. Testing shall be carried out by independent parties.',
    evidence_needed: ['Testing programme documentation', 'Annual testing schedule', 'Independence requirements', 'Testing methodology'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'critical',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-25',
    article_number: 'Art. 25',
    article_title: 'Testing of ICT Tools and Systems',
    chapter: 'IV',
    pillar: 'TESTING',
    requirement_text: 'The testing programme shall include vulnerability assessments and scans, open source analysis, network security assessments, gap analyses, physical security reviews, source code reviews, scenario-based tests, compatibility testing, performance testing, penetration testing.',
    evidence_needed: ['Vulnerability scan reports', 'Penetration test reports', 'Source code review results', 'Performance test results'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-26',
    article_number: 'Art. 26',
    article_title: 'Advanced Testing (TLPT)',
    chapter: 'IV',
    pillar: 'TESTING',
    requirement_text: 'Significant financial entities shall carry out threat-led penetration testing (TLPT) at least every 3 years. TLPT shall cover critical or important functions and shall be performed on live production systems.',
    evidence_needed: ['TLPT programme', 'Red team assessment reports', 'TIBER-EU compliance evidence', 'Production testing authorization'],
    is_mandatory: true,
    applies_to: ['significant'],
    priority: 'critical',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-27',
    article_number: 'Art. 27',
    article_title: 'Requirements for Testers',
    chapter: 'IV',
    pillar: 'TESTING',
    requirement_text: 'TLPT testers shall be certified (CREST, OSCP equivalent), have professional indemnity insurance, and follow approved threat intelligence frameworks.',
    evidence_needed: ['Tester certifications', 'Insurance certificates', 'Framework compliance evidence'],
    is_mandatory: true,
    applies_to: ['significant'],
    priority: 'high',
    created_at: new Date().toISOString(),
  },

  // PILLAR 4: THIRD-PARTY RISK MANAGEMENT (Chapter V, Articles 28-44)
  {
    id: 'dora-art-28',
    article_number: 'Art. 28',
    article_title: 'General Principles',
    chapter: 'V',
    pillar: 'TPRM',
    requirement_text: 'Financial entities shall manage ICT third-party risk as an integral component of ICT risk. A strategy on ICT third-party risk shall be adopted and reviewed at least annually.',
    evidence_needed: ['ICT third-party risk strategy', 'Annual review evidence', 'Risk assessment methodology'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'critical',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-29',
    article_number: 'Art. 29',
    article_title: 'Register of Information',
    chapter: 'V',
    pillar: 'TPRM',
    requirement_text: 'Financial entities shall maintain and update a register of information in relation to all contractual arrangements on the use of ICT services provided by third-party service providers.',
    evidence_needed: ['Register of Information (complete)', 'Update procedures', 'RoI audit trail'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'critical',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-30',
    article_number: 'Art. 30',
    article_title: 'Key Contractual Provisions',
    chapter: 'V',
    pillar: 'TPRM',
    requirement_text: 'Contractual arrangements shall include specific provisions on: service level descriptions, data location, access rights, performance targets, termination rights, exit strategies, cooperation with authorities.',
    evidence_needed: ['Contract templates', 'Clause compliance matrix', 'Sample contracts with mandatory clauses'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'critical',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-31',
    article_number: 'Art. 31',
    article_title: 'Concentration Risk',
    chapter: 'V',
    pillar: 'TPRM',
    requirement_text: 'Financial entities shall identify and assess ICT concentration risk arising from reliance on critical third-party ICT service providers. Pre-contractual concentration risk assessment shall be performed.',
    evidence_needed: ['Concentration risk assessment', 'Substitutability analysis', 'Alternative provider evaluation'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dora-art-32',
    article_number: 'Art. 32',
    article_title: 'Subcontracting',
    chapter: 'V',
    pillar: 'TPRM',
    requirement_text: 'Where ICT third-party service providers subcontract ICT services to other providers, financial entities shall ensure contractual obligations flow through.',
    evidence_needed: ['Subcontracting policy', 'Subcontractor register', 'Flow-down clause evidence'],
    is_mandatory: true,
    applies_to: ['all'],
    priority: 'high',
    created_at: new Date().toISOString(),
  },

  // PILLAR 5: INFORMATION SHARING (Chapter VI, Article 45)
  {
    id: 'dora-art-45',
    article_number: 'Art. 45',
    article_title: 'Information Sharing Arrangements',
    chapter: 'VI',
    pillar: 'SHARING',
    requirement_text: 'Financial entities may exchange amongst themselves cyber threat information and intelligence, including indicators of compromise, tactics, techniques and procedures, cybersecurity alerts and configuration tools.',
    evidence_needed: ['FS-ISAC membership', 'Information sharing agreements', 'TLP compliance procedures', 'Shared threat intelligence records'],
    is_mandatory: false,
    applies_to: ['all'],
    priority: 'medium',
    created_at: new Date().toISOString(),
  },
];

// =============================================================================
// SOC 2 to DORA Mappings
// =============================================================================

export const SOC2_TO_DORA_MAPPINGS: SOC2ToDORAMapping[] = [
  // CC1 (Control Environment) -> DORA Mappings
  {
    id: 'map-cc1-art5',
    soc2_category: 'CC1',
    soc2_control_pattern: '^CC1\\.',
    dora_requirement_id: 'dora-art-5',
    mapping_strength: 'partial',
    coverage_percentage: 60,
    gap_description: 'SOC 2 CC1 covers general control environment but lacks DORA-specific board accountability requirements for ICT risk.',
    remediation_guidance: 'Add explicit board-level ICT risk oversight documentation, RACI matrix for ICT responsibilities, and quantified risk appetite statement.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'map-cc1-art6',
    soc2_category: 'CC1',
    soc2_control_pattern: '^CC1\\.',
    dora_requirement_id: 'dora-art-6',
    mapping_strength: 'partial',
    coverage_percentage: 50,
    gap_description: 'SOC 2 CC1 addresses risk management but not the three lines of defense model required by DORA.',
    remediation_guidance: 'Document ICT risk framework with explicit three lines of defense, ICT-specific policies, and annual review cycle.',
    created_at: new Date().toISOString(),
  },

  // CC3 (Risk Assessment) -> DORA Mappings
  {
    id: 'map-cc3-art8',
    soc2_category: 'CC3',
    soc2_control_pattern: '^CC3\\.',
    dora_requirement_id: 'dora-art-8',
    mapping_strength: 'partial',
    coverage_percentage: 70,
    gap_description: 'SOC 2 CC3 covers risk assessment but lacks ICT asset criticality classification methodology.',
    remediation_guidance: 'Add formal ICT asset inventory with criticality ratings, business function dependencies, and data flow mapping.',
    created_at: new Date().toISOString(),
  },

  // CC4 (Monitoring) -> DORA Mappings
  {
    id: 'map-cc4-art10',
    soc2_category: 'CC4',
    soc2_control_pattern: '^CC4\\.',
    dora_requirement_id: 'dora-art-10',
    mapping_strength: 'full',
    coverage_percentage: 90,
    gap_description: 'SOC 2 CC4 monitoring controls align well with DORA detection requirements.',
    remediation_guidance: 'Ensure SIEM covers all critical ICT assets and detection metrics are documented.',
    created_at: new Date().toISOString(),
  },

  // CC5 (Control Activities) -> DORA Mappings
  {
    id: 'map-cc5-art9',
    soc2_category: 'CC5',
    soc2_control_pattern: '^CC5\\.',
    dora_requirement_id: 'dora-art-9',
    mapping_strength: 'full',
    coverage_percentage: 85,
    gap_description: 'SOC 2 CC5 access controls align with DORA protection requirements.',
    remediation_guidance: 'Verify continuous monitoring is in place and access reviews are documented.',
    created_at: new Date().toISOString(),
  },

  // CC6 (Logical Access) -> DORA Mappings
  {
    id: 'map-cc6-art7',
    soc2_category: 'CC6',
    soc2_control_pattern: '^CC6\\.',
    dora_requirement_id: 'dora-art-7',
    mapping_strength: 'full',
    coverage_percentage: 85,
    gap_description: 'SOC 2 CC6 logical access controls map well to DORA ICT system requirements.',
    remediation_guidance: 'Ensure capacity monitoring and technology resilience testing are documented.',
    created_at: new Date().toISOString(),
  },

  // CC7 (System Operations) -> DORA Mappings
  {
    id: 'map-cc7-art17',
    soc2_category: 'CC7',
    soc2_control_pattern: '^CC7\\.',
    dora_requirement_id: 'dora-art-17',
    mapping_strength: 'partial',
    coverage_percentage: 60,
    gap_description: 'SOC 2 CC7 covers incident response but lacks DORA-specific classification thresholds and reporting timelines.',
    remediation_guidance: 'Implement DORA incident classification matrix with major incident criteria and 4h/72h/1m reporting workflow.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'map-cc7-art11',
    soc2_category: 'CC7',
    soc2_control_pattern: '^CC7\\.',
    dora_requirement_id: 'dora-art-11',
    mapping_strength: 'partial',
    coverage_percentage: 50,
    gap_description: 'SOC 2 CC7 covers BCP but lacks specific RTO/RPO per function as required by DORA.',
    remediation_guidance: 'Define explicit RTO/RPO for each critical business function and test annually.',
    created_at: new Date().toISOString(),
  },

  // CC8 (Change Management) -> DORA Mappings
  {
    id: 'map-cc8-art25',
    soc2_category: 'CC8',
    soc2_control_pattern: '^CC8\\.',
    dora_requirement_id: 'dora-art-25',
    mapping_strength: 'partial',
    coverage_percentage: 60,
    gap_description: 'SOC 2 CC8 covers change management but lacks comprehensive testing programme requirements.',
    remediation_guidance: 'Establish formal testing programme with annual schedule including vulnerability scans, penetration tests, and scenario-based tests.',
    created_at: new Date().toISOString(),
  },

  // CC9 (Risk Mitigation) -> DORA Mappings
  {
    id: 'map-cc9-art29',
    soc2_category: 'CC9',
    soc2_control_pattern: '^CC9\\.',
    dora_requirement_id: 'dora-art-29',
    mapping_strength: 'partial',
    coverage_percentage: 40,
    gap_description: 'SOC 2 CC9 covers vendor risk but lacks DORA-specific Register of Information and concentration risk requirements.',
    remediation_guidance: 'Implement full Register of Information per ESA templates and conduct concentration risk assessments.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'map-cc9-art30',
    soc2_category: 'CC9',
    soc2_control_pattern: '^CC9\\.',
    dora_requirement_id: 'dora-art-30',
    mapping_strength: 'partial',
    coverage_percentage: 50,
    gap_description: 'SOC 2 CC9 covers vendor contracts but lacks DORA mandatory clauses (exit, audit rights, data location).',
    remediation_guidance: 'Review all ICT contracts for DORA Article 30 mandatory provisions and remediate gaps.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'map-cc9-art28',
    soc2_category: 'CC9',
    soc2_control_pattern: '^CC9\\.',
    dora_requirement_id: 'dora-art-28',
    mapping_strength: 'partial',
    coverage_percentage: 55,
    gap_description: 'SOC 2 CC9 covers vendor management but lacks DORA-specific third-party risk strategy requirements.',
    remediation_guidance: 'Develop formal ICT third-party risk strategy with annual review cycle.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'map-cc9-art32',
    soc2_category: 'CC9',
    soc2_control_pattern: '^CC9\\.',
    dora_requirement_id: 'dora-art-32',
    mapping_strength: 'partial',
    coverage_percentage: 45,
    gap_description: 'SOC 2 CC9 covers subservice organizations but lacks explicit flow-down clause requirements.',
    remediation_guidance: 'Ensure all contracts include subcontracting notification and flow-down clauses.',
    created_at: new Date().toISOString(),
  },

  // Availability (A) -> DORA Mappings
  {
    id: 'map-a-art12',
    soc2_category: 'A',
    soc2_control_pattern: '^A\\.',
    dora_requirement_id: 'dora-art-12',
    mapping_strength: 'full',
    coverage_percentage: 90,
    gap_description: 'SOC 2 Availability criteria align well with DORA backup requirements.',
    remediation_guidance: 'Verify geographic separation of backups and annual restoration testing.',
    created_at: new Date().toISOString(),
  },

  // CC7 -> Art. 13 (Learning and Evolving)
  {
    id: 'map-cc7-art13',
    soc2_category: 'CC7',
    soc2_control_pattern: '^CC7\\.',
    dora_requirement_id: 'dora-art-13',
    mapping_strength: 'partial',
    coverage_percentage: 55,
    gap_description: 'SOC 2 CC7 covers incident response but lacks post-incident review requirements.',
    remediation_guidance: 'Implement formal post-incident review process with lessons learned tracking.',
    created_at: new Date().toISOString(),
  },

  // CC2 -> Art. 14 (Communication)
  {
    id: 'map-cc2-art14',
    soc2_category: 'CC2',
    soc2_control_pattern: '^CC2\\.',
    dora_requirement_id: 'dora-art-14',
    mapping_strength: 'partial',
    coverage_percentage: 60,
    gap_description: 'SOC 2 CC2 covers internal communication but lacks crisis communication plan requirements.',
    remediation_guidance: 'Develop crisis communication plan with escalation procedures and contact lists.',
    created_at: new Date().toISOString(),
  },

  // CC4 -> Art. 24 (Testing General)
  {
    id: 'map-cc4-art24',
    soc2_category: 'CC4',
    soc2_control_pattern: '^CC4\\.',
    dora_requirement_id: 'dora-art-24',
    mapping_strength: 'partial',
    coverage_percentage: 50,
    gap_description: 'SOC 2 CC4 covers monitoring but lacks comprehensive testing programme requirements.',
    remediation_guidance: 'Establish formal testing programme with independence requirements and annual schedule.',
    created_at: new Date().toISOString(),
  },

  // NO SOC 2 COVERAGE - Critical Gaps
  {
    id: 'map-none-art18',
    soc2_category: 'NONE',
    soc2_control_pattern: null,
    dora_requirement_id: 'dora-art-18',
    mapping_strength: 'none',
    coverage_percentage: 0,
    gap_description: 'No SOC 2 equivalent. DORA requires specific incident classification thresholds for major incidents.',
    remediation_guidance: 'Create incident classification matrix with thresholds for clients affected, duration, data loss, economic impact.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'map-none-art19',
    soc2_category: 'NONE',
    soc2_control_pattern: null,
    dora_requirement_id: 'dora-art-19',
    mapping_strength: 'none',
    coverage_percentage: 0,
    gap_description: 'No SOC 2 equivalent. DORA requires specific reporting timelines: 4h initial, 72h intermediate, 1m final.',
    remediation_guidance: 'Implement automated incident reporting workflow with ESA templates and SLA monitoring.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'map-none-art20',
    soc2_category: 'NONE',
    soc2_control_pattern: null,
    dora_requirement_id: 'dora-art-20',
    mapping_strength: 'none',
    coverage_percentage: 0,
    gap_description: 'No SOC 2 equivalent. DORA requires standardized incident report content as per RTS.',
    remediation_guidance: 'Develop incident report templates compliant with ESA technical standards.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'map-none-art26',
    soc2_category: 'NONE',
    soc2_control_pattern: null,
    dora_requirement_id: 'dora-art-26',
    mapping_strength: 'none',
    coverage_percentage: 0,
    gap_description: 'No SOC 2 equivalent. DORA requires TLPT (threat-led penetration testing) every 3 years on production systems.',
    remediation_guidance: 'Engage CREST-certified red team for TIBER-EU compliant TLPT covering critical functions.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'map-none-art27',
    soc2_category: 'NONE',
    soc2_control_pattern: null,
    dora_requirement_id: 'dora-art-27',
    mapping_strength: 'none',
    coverage_percentage: 0,
    gap_description: 'No SOC 2 equivalent. DORA requires certified testers with insurance for TLPT.',
    remediation_guidance: 'Verify TLPT testers have CREST certification and professional indemnity insurance.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'map-none-art31',
    soc2_category: 'NONE',
    soc2_control_pattern: null,
    dora_requirement_id: 'dora-art-31',
    mapping_strength: 'none',
    coverage_percentage: 0,
    gap_description: 'No SOC 2 equivalent. DORA requires concentration risk assessment for third-party providers.',
    remediation_guidance: 'Assess substitutability of critical ICT providers and document alternative provider options.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'map-none-art45',
    soc2_category: 'NONE',
    soc2_control_pattern: null,
    dora_requirement_id: 'dora-art-45',
    mapping_strength: 'none',
    coverage_percentage: 0,
    gap_description: 'No SOC 2 equivalent. DORA encourages information sharing via ISACs.',
    remediation_guidance: 'Consider FS-ISAC membership and establish TLP-compliant information sharing procedures.',
    created_at: new Date().toISOString(),
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get requirements by pillar
 */
export function getRequirementsByPillar(pillar: DORAPillar): DORARequirement[] {
  return DORA_REQUIREMENTS.filter(r => r.pillar === pillar);
}

/**
 * Get mapping for a requirement
 */
export function getMappingForRequirement(requirementId: string): SOC2ToDORAMapping | undefined {
  return SOC2_TO_DORA_MAPPINGS.find(m => m.dora_requirement_id === requirementId);
}

/**
 * Get all mappings for a SOC 2 category
 */
export function getMappingsForSOC2Category(category: string): SOC2ToDORAMapping[] {
  return SOC2_TO_DORA_MAPPINGS.filter(m => m.soc2_category === category);
}

/**
 * Get requirements with no SOC 2 coverage
 */
export function getRequirementsWithoutSOC2Coverage(): DORARequirement[] {
  const noSOC2Mappings = SOC2_TO_DORA_MAPPINGS.filter(m => m.mapping_strength === 'none');
  const noSOC2ReqIds = new Set(noSOC2Mappings.map(m => m.dora_requirement_id));
  return DORA_REQUIREMENTS.filter(r => noSOC2ReqIds.has(r.id));
}

/**
 * Get critical requirements
 */
export function getCriticalRequirements(): DORARequirement[] {
  return DORA_REQUIREMENTS.filter(r => r.priority === 'critical');
}
