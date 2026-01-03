"""
Optimized prompts for SOC 2 extraction using Gemini 2.5 Flash.

Key optimizations:
1. Single comprehensive prompt for most documents
2. Clear instructions to extract ALL controls (no summarization)
3. Page references for traceability
4. TSC category mapping
"""

# ============================================================================
# Single-Pass Full Extraction Prompt
# ============================================================================

FULL_EXTRACTION_PROMPT = """You are an expert SOC 2 auditor extracting structured data from this SOC 2 report.

CRITICAL REQUIREMENTS:
1. Extract ALL information in a single pass - do not summarize or skip any content
2. Include EVERY control found in Section IV (Controls) and Section V (Tests of Controls)
3. Map each control to its Trust Services Criteria (TSC) category
4. Note page references for traceability
5. Extract all exceptions, subservice organizations, and CUECs

TSC CATEGORY MAPPING:
- CC1: Control Environment (governance, ethics, oversight)
- CC2: Communication and Information (policies, communication)
- CC3: Risk Assessment (risk identification, analysis)
- CC4: Monitoring Activities (ongoing monitoring, evaluations)
- CC5: Control Activities (access controls, segregation)
- CC6: Logical and Physical Access Controls (authentication, physical security)
- CC7: System Operations (incident detection, response, recovery)
- CC8: Change Management (infrastructure changes, software changes)
- CC9: Risk Mitigation (vendor management, business continuity)
- A: Availability (uptime, disaster recovery)
- PI: Processing Integrity (data accuracy, completeness)
- C: Confidentiality (data classification, encryption)
- P: Privacy (PII handling, consent, disclosure)

CONTROL ID PATTERNS:
Look for these patterns to identify controls:
- Standard: CC1.1, CC2.3, A1.2, PI-1, C-2, P-1
- Custom: SEC-01, ACC-02, OPS-15, HR-03
- Numbered: Control 1.1, 2.3.4, etc.

TEST RESULT MAPPING:
- "Operating effectively" or "no exceptions" → operating_effectively
- "Exception noted" or "deviation" → exception
- "Not applicable" or "not tested" → not_tested

EXTRACTION INSTRUCTIONS:
1. Start with metadata (report type, dates, audit firm, opinion)
2. Extract ALL controls from the controls matrix/testing section
3. For each control, include:
   - Control ID exactly as shown
   - TSC category (determine from content if not explicit)
   - Full description (do not truncate)
   - Test result
   - Page number where it appears
4. Extract all exceptions with control ID and description
5. List all subservice organizations
6. List all Complementary User Entity Controls (CUECs)

The output must conform to the provided JSON schema exactly."""


# ============================================================================
# Two-Pass Prompts
# ============================================================================

METADATA_EXTRACTION_PROMPT = """Extract the following from this SOC 2 report:

1. METADATA:
   - Report Type (Type 1 or Type 2)
   - Audit Firm name
   - Auditor's Opinion (unqualified, qualified, adverse)
   - Audit Period (start and end dates in YYYY-MM-DD format)
   - Service Organization name
   - Trust Services Criteria covered (security, availability, etc.)
   - Brief system description

2. DOCUMENT STATISTICS:
   - Estimated total number of controls
   - Number of exceptions noted
   - Whether there are subservice organizations
   - Whether there are CUECs

3. SUBSERVICE ORGANIZATIONS:
   - Name
   - Services provided
   - Whether carved out of scope

4. CUECs (Complementary User Entity Controls):
   - All CUECs listed with descriptions

Do NOT extract individual controls in this pass - focus on the metadata and structure."""


CONTROLS_EXTRACTION_PROMPT = """Extract ALL controls from this SOC 2 report.

CRITICAL: Extract EVERY control - do not summarize, skip, or truncate any controls.

For each control, extract:
- controlId: The control identifier (e.g., CC1.1, A1.2, SEC-01)
- tscCategory: Trust Services Criteria category (CC1-CC9, A, PI, C, P)
- description: The FULL control description
- testResult: operating_effectively, exception, or not_tested
- pageRef: Page number where the control appears

Also extract ALL exceptions:
- controlId: The control with the exception
- description: Full exception description
- managementResponse: Management's response if provided

Focus on Section IV (Controls Matrix) and Section V (Tests of Operating Effectiveness).
Look for tables listing controls with their descriptions and test results.

IMPORTANT:
- Include ALL controls, even if there are 100+ controls
- Do not skip or summarize any control descriptions
- Map each control to the correct TSC category based on its content"""


# ============================================================================
# Parallel Extraction Prompts
# ============================================================================

CONTROLS_CC1_CC5_PROMPT = """Extract ONLY controls from categories CC1 through CC5 from this SOC 2 report.

CATEGORIES TO EXTRACT:
- CC1: Control Environment
- CC2: Communication and Information
- CC3: Risk Assessment
- CC4: Monitoring Activities
- CC5: Control Activities

For each control, include:
- controlId: Control identifier
- tscCategory: CC1, CC2, CC3, CC4, or CC5
- description: FULL control description
- testResult: operating_effectively, exception, or not_tested
- pageRef: Page number

IMPORTANT: Only extract controls from CC1-CC5. Skip CC6-CC9 and other categories.
Extract ALL controls in these categories - do not summarize."""


CONTROLS_CC6_PLUS_PROMPT = """Extract controls from categories CC6-CC9 and additional criteria from this SOC 2 report.

CATEGORIES TO EXTRACT:
- CC6: Logical and Physical Access Controls
- CC7: System Operations
- CC8: Change Management
- CC9: Risk Mitigation
- A: Availability
- PI: Processing Integrity
- C: Confidentiality
- P: Privacy

Also extract ALL exceptions found in the report.

For each control:
- controlId: Control identifier
- tscCategory: CC6, CC7, CC8, CC9, A, PI, C, or P
- description: FULL control description
- testResult: operating_effectively, exception, or not_tested
- pageRef: Page number

For each exception:
- controlId: Control with exception
- description: Exception description
- managementResponse: If provided

IMPORTANT: Skip controls from CC1-CC5 (already extracted elsewhere).
Extract ALL controls in CC6-CC9 and additional criteria."""


CUECS_SUBSERVICE_PROMPT = """Extract subservice organizations and CUECs from this SOC 2 report.

SUBSERVICE ORGANIZATIONS:
Look for sections discussing:
- Third-party service providers
- Subservice organizations
- Data centers
- Cloud providers
- Carved-out/inclusive entities

For each, extract:
- name: Organization name
- serviceDescription: Services provided
- carveOut: Whether excluded from scope

COMPLEMENTARY USER ENTITY CONTROLS (CUECs):
Look for sections titled:
- "Complementary User Entity Controls"
- "User Control Considerations"
- "Customer Responsibilities"

For each CUEC:
- id: Identifier if provided
- description: Control description
- customerResponsibility: What the customer must do
- relatedControl: Related SOC 2 control if mentioned"""


# ============================================================================
# Prompt Selection Helper
# ============================================================================

def get_prompt_for_strategy(strategy: str, phase: str = "full") -> str:
    """Get the appropriate prompt based on extraction strategy and phase."""
    if strategy == "single_pass":
        return FULL_EXTRACTION_PROMPT
    elif strategy == "two_pass":
        if phase == "metadata":
            return METADATA_EXTRACTION_PROMPT
        return CONTROLS_EXTRACTION_PROMPT
    elif strategy == "parallel":
        prompts = {
            "metadata": METADATA_EXTRACTION_PROMPT,
            "cc1_cc5": CONTROLS_CC1_CC5_PROMPT,
            "cc6_plus": CONTROLS_CC6_PLUS_PROMPT,
            "cuecs": CUECS_SUBSERVICE_PROMPT,
        }
        return prompts.get(phase, CONTROLS_EXTRACTION_PROMPT)
    return FULL_EXTRACTION_PROMPT
