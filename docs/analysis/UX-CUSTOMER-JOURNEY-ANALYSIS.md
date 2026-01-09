# DORA Comply - Comprehensive UX & Customer Journey Analysis

**Date:** January 2026
**Purpose:** Deep analysis of user experience, customer journeys, friction points, and competitive positioning

---

## Executive Summary

This analysis examines DORA Comply's complete user experience through the lens of customer journeys, competitive positioning, and industry best practices. Key findings reveal significant opportunities to differentiate through superior UX in a market plagued by complexity and poor user experiences.

### Critical Findings

1. **Onboarding Gap**: No guided tour or interactive walkthrough for new users
2. **RoI Journey Fragmentation**: Setup wizard disconnected from template editing
3. **Dead Ends**: Email verification has no resend mechanism
4. **Missing Draft States**: Users cannot save progress in multi-step flows
5. **Competitive Opportunity**: Market leaders (Vanta, Drata, OneTrust) all suffer from UX complaints; we can differentiate on simplicity

### Competitive Position

| Factor | DORA Comply | Vanta | Drata | 3rdRisk |
|--------|-------------|-------|-------|---------|
| DORA-Native | ✅ | ❌ (retrofitted) | ❌ (retrofitted) | ✅ |
| Time to Value | Unknown | Weeks | Weeks | 10 days |
| UI Simplicity | 🟡 Good | 🟡 Good | 🔴 Complex | 🟢 Simple |
| RoI Automation | 🟡 Partial | ❌ | ❌ | ✅ |
| Pricing Transparency | 🟢 | 🔴 Hidden costs | 🔴 Hidden costs | 🟢 |

---

## Part 1: Complete User Journey Analysis

### 1.1 Acquisition to Activation Flow

```
Landing Page → Register → Email Verify → Onboarding → Dashboard → First Value
```

#### Current State

| Step | Status | Friction Level |
|------|--------|----------------|
| Landing Page | Not analyzed | - |
| Registration | Functional | 🟡 Medium |
| Email Verification | Functional | 🔴 High |
| Onboarding Wizard | Functional | 🟡 Medium |
| Dashboard | Functional | 🟡 Medium |
| First Value Action | Missing | 🔴 Critical |

#### Friction Points Identified

**Registration (`/register`)**
- ✅ Password strength indicator shows real-time feedback
- ✅ Terms & Privacy links functional
- ⚠️ No progress indicator showing this is step 1 of 3
- ⚠️ Password requirements not summarized before submission
- 🔧 **Fix**: Add step indicator "Step 1 of 3: Create Account"

**Email Verification (`/verify`)**
- ⚠️ **CRITICAL**: No "Resend Email" button if email doesn't arrive
- ⚠️ No spam folder guidance
- ⚠️ No alternative verification method
- ⚠️ No timeout indication (how long is link valid?)
- 🔧 **Fix**: Add resend button, spam folder notice, 24h validity indicator

**Onboarding (`/onboarding`)**
- ✅ Clear 3-step wizard with icons
- ✅ Visual step indicators (Organization → Team → Goals)
- ⚠️ Jurisdiction field is text input, not dropdown - unclear what values are valid
- ⚠️ No "Why do we need this?" tooltips
- ⚠️ No progress persistence (browser close = lost progress)
- ⚠️ No skip option for non-essential fields
- 🔧 **Fix**: Change jurisdiction to dropdown, add tooltips, persist draft state

**Dashboard First Visit**
- ✅ Getting Started checklist provides clear next steps
- ✅ Celebration UI when checklist complete
- ⚠️ **CRITICAL**: No guided walkthrough/product tour
- ⚠️ Search bar in nav but unclear what it searches
- ⚠️ Stats show "0" values which feel empty, not motivating
- 🔧 **Fix**: Add interactive product tour, contextual empty states

### 1.2 Core Feature Journeys

#### Vendor Management Journey

```
Dashboard → Vendors List → Add Vendor → Vendor Detail → Upload Document → View SOC2 Analysis
```

**Add Vendor Flow (`/vendors/new`)**

| Step | Status | Issues |
|------|--------|--------|
| Basic Info | ✅ | None |
| LEI Lookup | ✅ | Async validation could cause race condition |
| Classification | ✅ | None |
| Review & Submit | ⚠️ | No draft save option |

- ⚠️ Multi-step wizard has no save-draft functionality
- ⚠️ If user navigates away, all progress lost
- ⚠️ LEI enrichment happens asynchronously - user might not see results before saving
- 🔧 **Fix**: Add "Save as Draft" button, persist wizard state

**Vendor Detail View (`/vendors/[id]`)**

- ✅ Comprehensive tabs (Overview, Documents, Compliance, Monitoring)
- ✅ Breadcrumb navigation with context-aware back links
- ✅ Risk gauge visualization
- ⚠️ No clear CTA when vendor has no documents attached
- ⚠️ Monitoring tab may show empty state if no SecurityScorecard integration
- 🔧 **Fix**: Add contextual CTAs in empty states

#### Document Management Journey

```
Vendors → Upload Document → AI Analysis → SOC2 Parsing → Evidence Mapping
```

**Upload Document Flow**

- ✅ Drag-and-drop upload with visual feedback
- ✅ Type selection (SOC2, ISO27001, Pentest, Contract, Other)
- ⚠️ **BLOCKER**: Cannot upload document without first creating a vendor
- ⚠️ No visual feedback during file upload progress
- ⚠️ 50MB limit not enforced client-side (server error instead)
- 🔧 **Fix**: Allow document upload from documents page with vendor selection, add upload progress bar

**SOC2 Analysis Flow (`/documents/[id]/soc2-analysis`)**

- ✅ Split-panel view showing PDF + extracted evidence
- ✅ Click-to-highlight source location (10X differentiator)
- ⚠️ Analysis status unclear while AI is processing
- ⚠️ No retry mechanism if parsing fails
- ⚠️ Confidence scores shown but no explanation of what they mean
- 🔧 **Fix**: Add processing status indicator, retry button, confidence tooltips

#### Incident Reporting Journey

```
Dashboard Alert → Incidents → New Incident Wizard → Submit → Track Deadlines → Generate Reports
```

**Incident Creation (`/incidents/new`)**

- ✅ Multi-step wizard with classification
- ✅ DORA deadline calculation (4h/72h/30d)
- ⚠️ No draft state - must complete in one session
- ⚠️ Classification criteria not clearly explained
- ⚠️ Vendor selection not connected to existing vendor data
- 🔧 **Fix**: Add draft save, classification helper, vendor auto-suggest

**Incident Tracking**

- ✅ Deadline badges with color coding
- ✅ Timeline view of events
- ⚠️ Status transitions not clearly documented
- ⚠️ No email notifications for approaching deadlines
- ⚠️ Report generation flow unclear
- 🔧 **Fix**: Add status lifecycle diagram, deadline notifications

#### Register of Information (RoI) Journey

```
Dashboard → RoI Overview → Setup Wizard → Template Editing → Validation → Submission
```

**RoI Onboarding (`/roi/onboarding`)**

- ✅ 5-step wizard (Entity → Vendors → Services → Functions → Review)
- ✅ Time estimates per step
- ✅ Responsive mobile/desktop layouts
- ⚠️ **CRITICAL**: Wizard completion ≠ RoI completion - user may think they're done
- ⚠️ No draft save - browser close loses progress
- ⚠️ Large vendor lists could cause performance issues
- 🔧 **Fix**: Add explicit "this creates your structure, next step is data entry" messaging

**RoI Template Editing (`/roi/[templateId]`)**

- ✅ Editable data table with inline editing
- ✅ Validation panel showing errors
- ⚠️ Connection between onboarding and template editing unclear
- ⚠️ No guided workflow through 15 templates
- ⚠️ AI population feature exists but not prominently surfaced
- 🔧 **Fix**: Add "Next Template" navigation, AI assistant for data population

**RoI Validation (`/roi/validate`)**

- ✅ Cross-template validation
- ✅ AI-powered fix suggestions
- ⚠️ Fix wizard disconnected from template editing
- ⚠️ No bulk fix option
- 🔧 **Fix**: Integrate fix actions directly into validation view

### 1.3 Settings & Configuration Journeys

#### Team Management (`/settings/team`)

- ✅ Role-based access clearly explained
- ✅ Invite via email
- ⚠️ No bulk invite option
- ⚠️ No pending invitations list
- ⚠️ Role change confirmation lacks detail about permission changes
- 🔧 **Fix**: Add pending invites view, permission preview on role change

#### Security Settings (`/settings/security`)

- ✅ MFA enrollment with QR code
- ✅ Recovery codes display
- ⚠️ MFA requirement for admin/owner roles not clearly communicated
- ⚠️ No session management view
- 🔧 **Fix**: Add role-based MFA prompts, active sessions list

#### Organization Settings (`/settings/organization`)

- ✅ LEI validation with GLEIF API
- ✅ Entity classification with implications
- ⚠️ Async LEI validation can cause save race condition
- ⚠️ Significance level selection doesn't validate eligibility
- 🔧 **Fix**: Block save until validation complete, add eligibility checks

---

## Part 2: Broken Journeys & Dead Ends

### Critical Breaks (Blocking User Progress)

| Issue | Location | Impact | Priority |
|-------|----------|--------|----------|
| No email resend option | `/verify` | Users stuck if email doesn't arrive | P0 |
| No draft save in wizards | Multiple | Work lost on browser close | P0 |
| RoI completion confusion | `/roi/onboarding` → `/roi` | Users think they're done after wizard | P0 |
| Document requires vendor | `/documents` upload | New users blocked from uploading | P1 |

### Journey Disconnects

1. **Onboarding → First Action Gap**
   - User completes onboarding but dashboard shows all zeros
   - Getting Started checklist helps but no active guidance
   - **Recommendation**: Trigger product tour after onboarding

2. **RoI Wizard → Template Editing Gap**
   - Wizard creates structure, templates need data entry
   - User may not understand they need to continue
   - **Recommendation**: Auto-redirect to first incomplete template after wizard

3. **Document Upload → Analysis Gap**
   - Upload completes but AI analysis is async
   - No notification when analysis is ready
   - **Recommendation**: Add in-app notification when analysis completes

4. **Incident → Report Gap**
   - Incident created but report generation unclear
   - Deadlines shown but action to meet them unclear
   - **Recommendation**: Add "Generate Report" CTA on deadline cards

### Empty States Needing Improvement

| Page | Current State | Improved State |
|------|---------------|----------------|
| Vendors List (no vendors) | "No vendors found" + button | ✅ Now uses EmptyState component |
| Documents (no docs) | "No documents" + upload | ✅ Now uses EmptyState component |
| Incidents (no incidents) | "No incidents" | ✅ Now uses EmptyState component |
| RoI Templates (empty) | Generic empty | Add contextual AI suggestions |
| Compliance Trends (no data) | Chart shows flat line | Add "Start tracking" CTA |

---

## Part 3: Competitive Analysis & Positioning

### Market Landscape

The compliance automation market is dominated by platforms that:
- Were built for SOC 2/ISO 27001 and retrofitted for DORA
- Have complex, overwhelming interfaces
- Charge hidden fees and have opaque pricing
- Take weeks to months for implementation

### Competitor Comparison

#### Vanta
**Strengths**: 526% ROI, broad integrations, polished interface
**Weaknesses**: $10K-80K/year, hidden costs, overwhelming notifications
**UX Issues**: Opens new windows excessively, unclear remediation workflows

#### Drata
**Strengths**: 200+ integrations, strong controls automation
**Weaknesses**: Slow UI with loading spinners, policy editor lacks formatting
**UX Issues**: Confusing task visibility, steep learning curve

#### OneTrust
**Strengths**: Comprehensive regulatory coverage, #2 GRC solution
**Weaknesses**: Complex interface, requires extensive customization
**UX Issues**: Overwhelming dashboard, steep learning curve

#### 3rdRisk (Direct DORA Competitor)
**Strengths**: DORA-native, 10-day implementation, one-click RoI export
**Weaknesses**: Not a complete GRC suite, TPRM focus only
**UX Issues**: Limited customization options

#### Vendorica (Direct DORA Competitor)
**Strengths**: Only platform with automated NCA reporting, free tier
**Weaknesses**: Newer entrant, limited market presence
**UX Issues**: Unknown (limited public reviews)

### DORA Comply Competitive Advantages

1. **DORA-Native Architecture**: Built for DORA from day one, not retrofitted
2. **AI Document Parsing**: 10X differentiator with click-to-source evidence
3. **Unified Platform**: TPRM + Incidents + RoI in one place
4. **Modern UI**: React/Next.js stack with premium design
5. **EU Focus**: Built for EU financial institutions specifically

### Competitive Gaps to Close

| Feature | Competitors Have | DORA Comply Status |
|---------|------------------|-------------------|
| One-click RoI export | 3rdRisk | 🟡 Partial (per-template) |
| Automated NCA submission | Vendorica | 🔴 Missing |
| 10-day implementation | 3rdRisk | 🟡 Unknown |
| Free tier | Vendorica | 🔴 Missing |
| Sub-contractor tracking (99 levels) | 3rdRisk | 🟡 Partial |

---

## Part 4: Best Practice Gaps

### Enterprise Onboarding Best Practices

**Industry Standard** (per ProductLed, Dock research):
- 75% of users abandon apps in first week without effective onboarding
- 63% consider onboarding a deciding factor for subscribing
- Guided product tours increase activation by 50%+

**DORA Comply Status**:
- ✅ Multi-step signup with progress indicators
- ✅ Getting Started checklist on dashboard
- 🔴 No interactive product tour
- 🔴 No role-based onboarding tracks
- 🔴 No "time to first value" optimization

**Recommendations**:
1. Add interactive product tour (Shepherd.js or similar)
2. Create role-specific onboarding flows (Admin vs Analyst vs Viewer)
3. Track and optimize "time to first vendor added" metric
4. Add progress emails during first 7 days

### Trust Signals Best Practices

**Industry Standard**:
- 66% of consumers buy more when they see trust signals
- Multiple trust signals = 32% average conversion increase
- Security badges increase conversion by 15%

**DORA Comply Status**:
- 🔴 No SOC 2 badge visible on marketing pages
- 🔴 No customer logos displayed
- 🔴 No GDPR compliance badge
- 🔴 No data center location disclosure
- 🟡 No case studies with metrics

**Recommendations**:
1. Add compliance badges to landing page and signup flow
2. Display customer logos (with permission)
3. Create case study with ROI metrics
4. Add "EU Data Center" badge for GDPR compliance

### GRC UX Best Practices

**Common Complaints** (per CyberSierra, ISACA research):
- "Tool fatigue" from multiple disconnected systems
- "Blinking green light dashboards" that obscure real issues
- Point-in-time assessments instead of continuous monitoring
- Auditors don't trust platform data

**DORA Comply Status**:
- ✅ Unified platform (vendors, incidents, RoI in one place)
- ✅ Real-time compliance dashboards
- 🟡 Continuous monitoring (SecurityScorecard integration exists)
- 🔴 No audit-ready evidence packaging
- 🔴 No auditor portal/view

**Recommendations**:
1. Create "Auditor View" with evidence trail
2. Add "Export Evidence Package" for audits
3. Implement continuous monitoring alerts
4. Add compliance score trending

---

## Part 5: Prioritized Recommendations

### P0 - Critical (Blocking User Success)

| # | Issue | Solution | Effort |
|---|-------|----------|--------|
| 1 | No email resend on verification | Add resend button + spam notice | 2h |
| 2 | No draft save in wizards | Persist wizard state to localStorage | 4h |
| 3 | RoI completion confusion | Add explicit "next step" messaging + redirect | 2h |
| 4 | Document requires vendor | Allow orphan uploads, link to vendor later | 4h |

### P1 - High Priority (Significant UX Improvement)

| # | Issue | Solution | Effort |
|---|-------|----------|--------|
| 5 | No product tour | Add Shepherd.js guided tour | 8h |
| 6 | Jurisdiction text input | Change to country dropdown | 1h |
| 7 | Search bar unclear | Implement global search with filters | 8h |
| 8 | Incident status lifecycle | Add visual state diagram | 4h |
| 9 | AI analysis status | Add processing indicator + notification | 4h |
| 10 | RoI template navigation | Add "Next Template" button + progress | 4h |

### P2 - Medium Priority (Polish & Differentiation)

| # | Issue | Solution | Effort |
|---|-------|----------|--------|
| 11 | No bulk vendor import | Add CSV import wizard | 16h |
| 12 | No pending invites view | Show invitation status in team settings | 4h |
| 13 | No session management | Add active sessions list + logout all | 8h |
| 14 | No auditor view | Create read-only auditor portal | 24h |
| 15 | One-click RoI export | Package all templates into single download | 8h |

### P3 - Future Enhancements

| # | Feature | Business Value |
|---|---------|----------------|
| 16 | Automated NCA submission | Match Vendorica's key differentiator |
| 17 | Free tier | Lower barrier to entry |
| 18 | Role-based onboarding tracks | Improve activation by user type |
| 19 | Mobile app | Executive dashboard on-the-go |
| 20 | AI compliance assistant | Differentiate with intelligent guidance |

---

## Part 6: Metrics to Track

### Onboarding Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Registration → Verification | >90% | Unknown |
| Verification → Onboarding Complete | >80% | Unknown |
| Onboarding → First Vendor Added | >70% | Unknown |
| Time to First Vendor | <30 min | Unknown |

### Activation Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Users completing Getting Started | >60% | Unknown |
| Users uploading first document | >50% | Unknown |
| Users generating first RoI template | >40% | Unknown |
| 7-day retention | >70% | Unknown |

### Engagement Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Weekly active users | >60% of total | Unknown |
| RoI templates completed | 80% before deadline | Unknown |
| Incident reports submitted on time | 100% | Unknown |
| NPS Score | >50 | Unknown |

---

## Conclusion

DORA Comply has a solid technical foundation with a modern UI, but several critical journey breaks and missing features prevent users from achieving full value. The competitive landscape shows that even market leaders suffer from UX issues, creating an opportunity for differentiation.

**Immediate Actions**:
1. Fix email verification resend (P0)
2. Add wizard draft persistence (P0)
3. Clarify RoI journey completion (P0)
4. Implement product tour (P1)

**Strategic Focus**:
1. Position as "the simple DORA solution" vs. complex GRC platforms
2. Emphasize AI document parsing as 10X differentiator
3. Build toward one-click RoI export to match 3rdRisk
4. Add trust signals and case studies for enterprise sales

By addressing the P0 issues within 1 week and P1 issues within 1 month, DORA Comply can significantly improve user activation and retention while building competitive differentiation in a market hungry for simpler solutions.
