/**
 * SOC 2 Extraction Prompts
 *
 * Detailed prompts for extracting compliance data from SOC 2 Type I/II reports
 * using Claude AI. Optimized for DORA compliance mapping.
 */

// ============================================================================
// System Prompt - SOC 2 Expert Analysis
// ============================================================================

export const SOC2_EXTRACTION_SYSTEM_PROMPT = `You are an expert SOC 2 auditor and compliance analyst specializing in extracting structured data from SOC 2 Type I and Type II reports. You have deep knowledge of:

- AICPA Trust Services Criteria (TSC) 2017
- SOC 2 report structure and terminology
- Common Criteria (CC1-CC9) for Security
- Additional criteria for Availability, Processing Integrity, Confidentiality, and Privacy
- Subservice organization relationships
- Complementary User Entity Controls (CUECs)
- EU DORA (Digital Operational Resilience Act) requirements

## CRITICAL INSTRUCTIONS

### Rule 1: DOCUMENT-ONLY SOURCING
Extract information EXCLUSIVELY from the provided SOC 2 report.
- NEVER infer control descriptions or test results
- NEVER use your general knowledge to fill gaps
- If control details are not explicit, mark confidence as lower
- If information is ambiguous, include both interpretations with notes

### Rule 2: COMPREHENSIVE CONTROL EXTRACTION
For Type II reports, you MUST extract:
- Every control listed in Section IV (Description of Controls)
- Test results from Section V (Tests of Controls)
- All exceptions and management responses
- All subservice organizations from the system description
- All CUECs from the User Entity Responsibilities section

### Rule 3: ACCURATE MAPPING
For each control extracted:
- Match the exact control ID format used in the report (e.g., "CC6.1", "CC1.1")
- Preserve the original control description verbatim
- Map to the correct Trust Services Category (CC1-CC9, A, PI, C, P)
- Include page/section references where possible

### Rule 4: CONFIDENCE SCORING
Your confidence score (0.0-1.0) must reflect:
- 1.0: Explicit statement, exactly as documented
- 0.8-0.9: Clear statement with minor interpretation
- 0.6-0.7: Information present but requires context
- 0.4-0.5: Partially visible or unclear
- 0.0-0.3: Inferred from limited information

### Rule 5: EXCEPTION HANDLING
For any exceptions or qualified opinions:
- Extract the EXACT exception description
- Include the control ID affected
- Note the impact level (low/medium/high)
- Include management response if available
- Note remediation dates if mentioned

## SOC 2 REPORT STRUCTURE REFERENCE

### Section I: Report of Independent Service Auditor
- Opinion type (unqualified, qualified, adverse)
- Audit period dates
- Audit firm name and date

### Section II: Management Assertion
- Service organization details
- Scope of examination
- Trust Services Criteria covered

### Section III: Description of System
- System overview
- Infrastructure components
- Subservice organizations
- User entity responsibilities (CUECs)

### Section IV: Trust Services Criteria and Related Controls
- Controls organized by TSC category
- Control descriptions and ownership

### Section V: Tests of Controls (Type II only)
- Testing procedures performed
- Test results (operating effectively / exceptions)
- Exceptions and management responses

## TRUST SERVICES CRITERIA REFERENCE

### Common Criteria (Security - Required)
- CC1: Control Environment (CC1.1-CC1.5)
- CC2: Communication and Information (CC2.1-CC2.3)
- CC3: Risk Assessment (CC3.1-CC3.4)
- CC4: Monitoring Activities (CC4.1-CC4.2)
- CC5: Control Activities (CC5.1-CC5.3)
- CC6: Logical and Physical Access Controls (CC6.1-CC6.8)
- CC7: System Operations (CC7.1-CC7.5)
- CC8: Change Management (CC8.1)
- CC9: Risk Mitigation (CC9.1-CC9.2)

### Additional Criteria
- A: Availability (A1.1-A1.3)
- PI: Processing Integrity (PI1.1-PI1.5)
- C: Confidentiality (C1.1-C1.2)
- P: Privacy (P1.0-P8.1)

IMPORTANT: Extract ALL controls you find, not just the Common Criteria. Many SOC 2 reports include additional controls specific to the organization.`;

// ============================================================================
// User Prompt - Main Extraction
// ============================================================================

export const SOC2_EXTRACTION_USER_PROMPT = `Analyze this SOC 2 report and extract all compliance-relevant information.

## CRITICAL: JSON STRUCTURE
You MUST respond with a valid JSON object. Do not include markdown code blocks or any text outside the JSON.

## Required JSON Structure

{
  "reportType": "type1" | "type2",
  "auditFirm": "Name of the audit firm",
  "auditFirmContact": "Contact info if available or null",
  "opinion": "unqualified" | "qualified" | "adverse",
  "periodStart": "YYYY-MM-DD",
  "periodEnd": "YYYY-MM-DD",
  "reportDate": "YYYY-MM-DD",

  "serviceOrgName": "Name of the service organization",
  "serviceOrgDescription": "Brief description of services provided",

  "trustServicesCriteria": ["security", "availability", "processing_integrity", "confidentiality", "privacy"],
  "systemDescription": "System description text (can be summarized if very long)",
  "systemBoundaries": "Boundaries of the system in scope or null",
  "infrastructureComponents": ["AWS EC2", "RDS PostgreSQL", ...],
  "softwareComponents": ["Custom Application", "Kubernetes", ...],
  "dataCategories": ["PII", "Financial", ...],

  "controls": [
    {
      "controlId": "CC6.1",
      "controlArea": "Logical and Physical Access Controls",
      "tscCategory": "CC6",
      "description": "The exact control description from the report",
      "testResult": "operating_effectively" | "exception" | "not_tested",
      "testingProcedure": "Description of testing performed (Type II only)",
      "exceptionDescription": "If exception, describe it here or null",
      "managementResponse": "Management response if exception or null",
      "location": "Page X, Section Y",
      "confidence": 0.0-1.0
    }
  ],

  "exceptions": [
    {
      "controlId": "CC6.3",
      "controlArea": "Logical and Physical Access Controls",
      "exceptionDescription": "Detailed exception description",
      "exceptionType": "design_deficiency" | "operating_deficiency" | "population_deviation",
      "managementResponse": "Management's response",
      "remediationDate": "YYYY-MM-DD or null",
      "remediationVerified": true | false | null,
      "impact": "low" | "medium" | "high",
      "location": "Page X"
    }
  ],

  "subserviceOrgs": [
    {
      "name": "Amazon Web Services",
      "serviceDescription": "Cloud infrastructure hosting",
      "inclusionMethod": "carve_out" | "inclusive",
      "controlsSupported": ["CC6.4", "CC6.5", "A1.1"],
      "relatedCuecs": ["CUEC-1"],
      "hasOwnSoc2": true | false | null,
      "location": "Page X, Section Y"
    }
  ],

  "cuecs": [
    {
      "id": "CUEC-1",
      "description": "User entities are responsible for...",
      "relatedControl": "CC6.1",
      "customerResponsibility": "What the customer must do",
      "category": "access_control" | "authentication" | "authorization" | "monitoring" | "data_protection" | "incident_response" | "other",
      "location": "Page X"
    }
  ],

  "totalControls": 64,
  "controlsOperatingEffectively": 62,
  "controlsWithExceptions": 2,
  "controlsNotTested": 0,

  "confidenceScores": {
    "overall": 0.0-1.0,
    "metadata": 0.0-1.0,
    "controls": 0.0-1.0,
    "exceptions": 0.0-1.0,
    "subserviceOrgs": 0.0-1.0,
    "cuecs": 0.0-1.0
  }
}

## Extraction Instructions

1. **Report Metadata**: Start with Section I (Independent Auditor's Report)
   - Identify the opinion type from the auditor's conclusion
   - Extract the audit period dates
   - Note the audit firm and report date

2. **Scope**: From Section II (Management Assertion) and Section III (Description)
   - Identify which Trust Services Criteria are in scope
   - Extract the system description and boundaries
   - List infrastructure and software components

3. **Controls**: Systematically go through Section IV and V
   - Extract EVERY control with its ID and description
   - For Type II, include test results for each control
   - Note any exceptions immediately

4. **Subservice Organizations**: From Section III
   - List all third parties that provide services
   - Note if they're "carved out" or "inclusive"
   - Identify which controls they support

5. **CUECs**: From "User Entity Responsibilities" section
   - Extract all customer-side control requirements
   - Map to related service organization controls

6. **Summary Statistics**: Count all controls and exceptions

Respond with ONLY the JSON object. No other text.`;

// ============================================================================
// Validation Prompt - For quality checking
// ============================================================================

export const SOC2_VALIDATION_PROMPT = `Review the extracted SOC 2 data for accuracy and completeness.

Check for:
1. All Common Criteria controls (CC1.1-CC9.2) should be present for Security
2. Test results should be present for ALL controls if Type II
3. Any exceptions should have corresponding entries in both controls and exceptions arrays
4. Subservice orgs should be listed with clear inclusion method
5. CUECs should relate to specific controls

Flag any issues found.`;

// ============================================================================
// DORA Mapping Reference
// ============================================================================

export const SOC2_TO_DORA_MAPPING_REFERENCE = `
## SOC 2 to DORA Control Mapping Reference

Use this reference to understand how SOC 2 controls map to DORA requirements:

### ICT Risk Management (DORA Art. 5-12)
- CC3 (Risk Assessment) → Art. 5, Art. 6
- CC4 (Monitoring) → Art. 8
- CC5 (Control Activities) → Art. 7
- CC7 (System Operations) → Art. 9, Art. 10
- CC9 (Risk Mitigation) → Art. 5

### Incident Management (DORA Art. 17-20)
- CC7.4, CC7.5 (Incident Response) → Art. 17, Art. 19

### Digital Resilience Testing (DORA Art. 24-26)
- A1.2, A1.3 (Disaster Recovery Testing) → Art. 24
- CC7.2 (Vulnerability Management) → Art. 25

### Third-Party Risk Management (DORA Art. 28-30)
- CC9.2 (Vendor Management) → Art. 28
- Subservice Orgs → Art. 28(8), Art. 29
- CC6 (Access Controls) → Art. 30.2

### Data Protection
- CC6 (Access Controls) → Art. 30.2c
- C1 (Confidentiality) → Art. 30.2c

### Business Continuity
- A1 (Availability) → Art. 30.2d, Art. 30.3c
- CC7.4, CC7.5 → Art. 30.3c
`;

// ============================================================================
// Output Schema for Structured Output
// ============================================================================

export const SOC2_EXTRACTION_OUTPUT_SCHEMA = {
  type: 'object',
  required: [
    'reportType',
    'auditFirm',
    'opinion',
    'periodStart',
    'periodEnd',
    'reportDate',
    'serviceOrgName',
    'trustServicesCriteria',
    'systemDescription',
    'controls',
    'exceptions',
    'subserviceOrgs',
    'cuecs',
    'totalControls',
    'controlsOperatingEffectively',
    'controlsWithExceptions',
    'controlsNotTested',
    'confidenceScores',
  ],
  properties: {
    reportType: {
      type: 'string',
      enum: ['type1', 'type2'],
    },
    auditFirm: { type: 'string' },
    auditFirmContact: { type: ['string', 'null'] },
    opinion: {
      type: 'string',
      enum: ['unqualified', 'qualified', 'adverse'],
    },
    periodStart: { type: 'string' },
    periodEnd: { type: 'string' },
    reportDate: { type: 'string' },
    serviceOrgName: { type: 'string' },
    serviceOrgDescription: { type: ['string', 'null'] },
    trustServicesCriteria: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'security',
          'availability',
          'processing_integrity',
          'confidentiality',
          'privacy',
        ],
      },
    },
    systemDescription: { type: 'string' },
    systemBoundaries: { type: ['string', 'null'] },
    infrastructureComponents: {
      type: 'array',
      items: { type: 'string' },
    },
    softwareComponents: {
      type: 'array',
      items: { type: 'string' },
    },
    dataCategories: {
      type: 'array',
      items: { type: 'string' },
    },
    controls: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          controlId: { type: 'string' },
          controlArea: { type: 'string' },
          tscCategory: { type: 'string' },
          description: { type: 'string' },
          testResult: {
            type: 'string',
            enum: ['operating_effectively', 'exception', 'not_tested'],
          },
          testingProcedure: { type: ['string', 'null'] },
          exceptionDescription: { type: ['string', 'null'] },
          managementResponse: { type: ['string', 'null'] },
          location: { type: ['string', 'null'] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
        required: [
          'controlId',
          'controlArea',
          'tscCategory',
          'description',
          'testResult',
          'confidence',
        ],
      },
    },
    exceptions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          controlId: { type: 'string' },
          controlArea: { type: ['string', 'null'] },
          exceptionDescription: { type: 'string' },
          exceptionType: {
            type: ['string', 'null'],
            enum: [
              'design_deficiency',
              'operating_deficiency',
              'population_deviation',
              null,
            ],
          },
          managementResponse: { type: ['string', 'null'] },
          remediationDate: { type: ['string', 'null'] },
          remediationVerified: { type: ['boolean', 'null'] },
          impact: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
          },
          location: { type: ['string', 'null'] },
        },
        required: ['controlId', 'exceptionDescription', 'impact'],
      },
    },
    subserviceOrgs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          serviceDescription: { type: 'string' },
          inclusionMethod: {
            type: 'string',
            enum: ['inclusive', 'carve_out'],
          },
          controlsSupported: {
            type: 'array',
            items: { type: 'string' },
          },
          relatedCuecs: {
            type: 'array',
            items: { type: 'string' },
          },
          hasOwnSoc2: { type: ['boolean', 'null'] },
          location: { type: ['string', 'null'] },
        },
        required: ['name', 'serviceDescription', 'inclusionMethod'],
      },
    },
    cuecs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: ['string', 'null'] },
          description: { type: 'string' },
          relatedControl: { type: ['string', 'null'] },
          customerResponsibility: { type: 'string' },
          category: {
            type: ['string', 'null'],
            enum: [
              'access_control',
              'authentication',
              'authorization',
              'monitoring',
              'data_protection',
              'incident_response',
              'other',
              null,
            ],
          },
          location: { type: ['string', 'null'] },
        },
        required: ['description', 'customerResponsibility'],
      },
    },
    totalControls: { type: 'number', minimum: 0 },
    controlsOperatingEffectively: { type: 'number', minimum: 0 },
    controlsWithExceptions: { type: 'number', minimum: 0 },
    controlsNotTested: { type: 'number', minimum: 0 },
    confidenceScores: {
      type: 'object',
      properties: {
        overall: { type: 'number', minimum: 0, maximum: 1 },
        metadata: { type: 'number', minimum: 0, maximum: 1 },
        controls: { type: 'number', minimum: 0, maximum: 1 },
        exceptions: { type: 'number', minimum: 0, maximum: 1 },
        subserviceOrgs: { type: 'number', minimum: 0, maximum: 1 },
        cuecs: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: [
        'overall',
        'metadata',
        'controls',
        'exceptions',
        'subserviceOrgs',
        'cuecs',
      ],
    },
  },
};
