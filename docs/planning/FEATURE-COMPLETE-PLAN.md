# Feature Complete Plan - NIS2/DORA Compliance Platform

**Goal:** Complete all features to production-ready state
**Timeline:** 6-8 weeks
**Created:** January 2026

---

## Executive Summary

Based on comprehensive audits, four major systems need completion:

| System | Current | Target | Effort |
|--------|---------|--------|--------|
| Activity Logging | 15% (code exists, not wired) | 100% | 1 week |
| Concentration Risk | 60% (UI done, no spend HHI) | 100% | 1.5 weeks |
| Resilience Testing | 50% (backend done, no UI) | 100% | 2 weeks |
| Notification System | 25% (UI done, no DB) | 100% | 1.5 weeks |

**Total Estimated Effort:** 6 weeks implementation + 1-2 weeks QA

---

## Phase 1: Notification System (Week 1-2)

**Why First:** Database tables don't exist - blocking other features.

### 1.1 Database Migration (Day 1)
Create `028_notification_system.sql`:

```sql
-- Add notification_preferences to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  notification_preferences JSONB DEFAULT '{
    "email": {"enabled": true, "frequency": "daily"},
    "inApp": {"enabled": true},
    "categories": {
      "incidents": true,
      "vendors": true,
      "compliance": true,
      "security": true,
      "system": true
    }
  }'::jsonb;

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = org-wide
  type TEXT NOT NULL CHECK (type IN ('incident', 'vendor', 'compliance', 'security', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  href TEXT,
  read BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  emailed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  emailed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_org ON notifications(organization_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE NOT read;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR user_id IS NULL);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO service_role
  WITH CHECK (true);
```

### 1.2 Email Templates (Day 2-3)
Create templates in `src/lib/email/templates/`:

- [ ] `incident-alert.ts` - Immediate incident notifications
- [ ] `vendor-alert.ts` - Vendor assessment/risk alerts
- [ ] `compliance-alert.ts` - RoI deadlines, control changes
- [ ] `security-alert.ts` - MFA prompts, login alerts
- [ ] `daily-digest.ts` - Daily summary email
- [ ] `weekly-digest.ts` - Weekly summary email

### 1.3 Notification Triggers (Day 4-6)
Add `createNotification()` calls to:

**Incidents** (`src/lib/incidents/actions.ts`):
- [ ] Incident created → notify org admins
- [ ] Status changed → notify assigned users
- [ ] Deadline approaching (4h, 72h) → notify org admins

**Vendors** (`src/lib/vendors/actions.ts`):
- [ ] Risk score exceeds threshold → notify
- [ ] Contract expiring (30d, 14d, 7d) → notify
- [ ] Certification expiring → notify
- [ ] Assessment due → notify

**Questionnaires** (`src/lib/nis2-questionnaire/actions.ts`):
- [ ] Questionnaire submitted → notify org
- [ ] AI extraction complete → notify sender

**Compliance** (`src/lib/compliance/` or relevant):
- [ ] RoI deadline approaching → notify
- [ ] Maturity score dropped → notify

### 1.4 Preference Filtering (Day 7)
Modify `createNotification()` to check preferences:
```typescript
async function createNotification(data: NotificationData) {
  const prefs = await getNotificationPreferences(data.userId);

  // Skip if category disabled
  if (!prefs.categories[data.type]) return;

  // Insert notification
  await supabase.from('notifications').insert(data);

  // Queue email if preference is 'immediate'
  if (prefs.email.frequency === 'immediate') {
    await sendImmediateEmail(data);
  }
}
```

### 1.5 Email Digest Cron (Day 8-10)
Create `/api/cron/email-digest/route.ts`:
- Query notifications with `emailed = false`
- Group by user preferences (daily/weekly)
- Send digest emails via Resend
- Mark as emailed

---

## Phase 2: Activity Logging (Week 2-3)

**Current State:** All infrastructure exists, just needs wiring.

### 2.1 Incidents Module (Day 1-2)
File: `src/lib/incidents/actions.ts`

Add after each successful operation:
```typescript
await logActivity({
  organizationId,
  userId,
  action: 'created', // or 'updated', 'deleted'
  entityType: 'incident',
  entityId: incident.id,
  entityName: incident.title,
  details: { severity: incident.severity, classification: incident.classification }
});
```

Operations to wire:
- [ ] `createIncidentAction()` → 'created'
- [ ] `updateIncidentAction()` → 'updated' (with changed fields)
- [ ] `deleteIncidentAction()` → 'deleted'
- [ ] `createReportAction()` → 'report_created'
- [ ] `submitReportAction()` → 'report_submitted'
- [ ] `addIncidentEventAction()` → 'event_added'

### 2.2 Questionnaires Module (Day 3-4)
File: `src/lib/nis2-questionnaire/actions.ts`

Operations to wire:
- [ ] `createTemplate()` → 'template_created'
- [ ] `updateTemplate()` → 'template_updated'
- [ ] `deleteTemplate()` → 'template_deleted'
- [ ] `sendQuestionnaire()` → 'questionnaire_sent'
- [ ] `resendQuestionnaireEmail()` → 'questionnaire_resent'
- [ ] `submitQuestionnaire()` → 'questionnaire_submitted'
- [ ] `approveQuestionnaire()` → 'questionnaire_approved'
- [ ] `rejectQuestionnaire()` → 'questionnaire_rejected'

### 2.3 Settings & Team (Day 5)
Files: `src/app/api/settings/`

- [ ] Organization settings update → 'organization_updated'
- [ ] Team invitation sent → 'team_invited'
- [ ] Team member role changed → 'role_changed'
- [ ] Team member removed → 'member_removed'

### 2.4 Documents (Day 6)
File: `src/lib/documents/actions.ts`

- [ ] Document analyzed (SOC2) → 'document_analyzed'
- [ ] Document analyzed (contract) → 'contract_analyzed'
- [ ] Document deleted → 'document_deleted'

### 2.5 RoI & Compliance (Day 7)
Files: `src/lib/roi/actions.ts`, `src/app/api/roi/`

- [ ] RoI entry created → 'roi_entry_created'
- [ ] RoI entry updated → 'roi_entry_updated'
- [ ] RoI submitted → 'roi_submitted'
- [ ] RoI exported → 'roi_exported'

---

## Phase 3: Concentration Risk (Week 3-4)

**Current State:** UI complete, service-based HHI works. Missing spend-based HHI.

### 3.1 Spend-Based HHI Calculation (Day 1-3)
File: `src/lib/concentration/calculations.ts`

Add new function:
```typescript
export function calculateSpendHHI(vendors: Vendor[]): SpendHHIResult {
  // Filter vendors with expense data
  const withExpense = vendors.filter(v => v.total_annual_expense && v.total_annual_expense > 0);

  if (withExpense.length === 0) {
    return { hhi: 0, level: 'unknown', breakdown: [], totalSpend: 0, dataQuality: 0 };
  }

  // Calculate total spend (assume EUR, TODO: currency conversion)
  const totalSpend = withExpense.reduce((sum, v) => sum + (v.total_annual_expense || 0), 0);

  // Calculate HHI
  let hhi = 0;
  const breakdown = withExpense.map(v => {
    const share = (v.total_annual_expense || 0) / totalSpend;
    const contribution = share * share;
    hhi += contribution;
    return {
      vendorId: v.id,
      vendorName: v.name,
      spend: v.total_annual_expense || 0,
      currency: v.expense_currency || 'EUR',
      share: share * 100,
      contribution
    };
  });

  // Data quality: % of vendors with expense data
  const dataQuality = (withExpense.length / vendors.length) * 100;

  return {
    hhi,
    level: hhi < 0.15 ? 'low' : hhi < 0.25 ? 'moderate' : 'high',
    breakdown: breakdown.sort((a, b) => b.spend - a.spend),
    totalSpend,
    dataQuality
  };
}
```

### 3.2 Single Vendor Concentration Alert (Day 4)
Add threshold check:
```typescript
export function checkSingleVendorConcentration(spendHHI: SpendHHIResult): Alert | null {
  const maxVendor = spendHHI.breakdown[0];
  if (maxVendor && maxVendor.share > 30) {
    return {
      type: 'critical',
      title: 'Single Vendor Concentration Risk',
      message: `${maxVendor.vendorName} represents ${maxVendor.share.toFixed(1)}% of total vendor spend`,
      vendor: maxVendor.vendorName,
      threshold: 30,
      actual: maxVendor.share
    };
  }
  return null;
}
```

### 3.3 Update API Response (Day 5)
File: `src/app/api/concentration/route.ts`

Add spend metrics to response:
```typescript
const spendHHI = calculateSpendHHI(vendors);
const singleVendorAlert = checkSingleVendorConcentration(spendHHI);

return {
  // ...existing metrics
  spend_hhi: spendHHI.hhi,
  spend_concentration_level: spendHHI.level,
  total_vendor_spend: spendHHI.totalSpend,
  spend_breakdown: spendHHI.breakdown.slice(0, 10), // Top 10
  spend_data_quality: spendHHI.dataQuality,
  max_single_vendor_percentage: spendHHI.breakdown[0]?.share || 0,
  alerts: [...existingAlerts, singleVendorAlert].filter(Boolean)
};
```

### 3.4 Spend Visualization Components (Day 6-8)
Create new components in `src/app/(dashboard)/concentration/components/`:

- [ ] `spend-distribution-chart.tsx` - Pie chart of top 10 vendors by spend
- [ ] `spend-concentration-card.tsx` - Large card showing max vendor %
- [ ] `spend-data-quality-indicator.tsx` - Warning if <50% vendors have data
- [ ] `currency-breakdown.tsx` - Show currency distribution

### 3.5 Update Metrics Grid (Day 9-10)
Update `metrics-grid.tsx` to include:
- Spend HHI card (with level indicator)
- Total vendor spend card
- Max single vendor % card
- Data quality indicator

---

## Phase 4: Resilience Testing (Week 4-6)

**Current State:** Backend 100% complete. Missing 6+ UI pages.

### 4.1 Test Editing (Day 1-2)
Create `/src/app/(dashboard)/testing/tests/[id]/edit/page.tsx`:
- Copy structure from `new/page.tsx`
- Pre-populate form with existing test data
- Add update action call

### 4.2 Finding Management (Day 3-6)
Create finding workflow pages:

**Create Finding:**
`/testing/tests/[id]/findings/new/page.tsx`
- Finding details form (title, description, affected systems)
- Severity selection (critical/high/medium/low)
- CVSS score input
- CVE/CWE references
- Initial remediation plan

**Finding Detail:**
`/testing/tests/[id]/findings/[findingId]/page.tsx`
- Finding overview card
- Status timeline (open → in_remediation → remediated → verified)
- Remediation section:
  - Assign owner button/dialog
  - Set deadline button/dialog
  - Update status button
  - Add remediation notes
- Verification section (when remediated):
  - Mark as verified button
  - Verification notes
  - Evidence upload
- Risk acceptance dialog (alternative to remediation):
  - Reason text
  - Approver selection
  - Expiry date

### 4.3 Test Execution Tracking (Day 7-8)
Add to test detail page (`/testing/tests/[id]/page.tsx`):

- [ ] "Start Test" button → sets status to 'in_progress', actual_start_date
- [ ] "Complete Test" dialog:
  - Overall result (pass/pass_with_findings/fail)
  - Executive summary text
  - Actual end date
  - Actual cost
- [ ] Status badge with proper colors
- [ ] Overdue indicator if past planned_end_date

### 4.4 Testing Programmes (Day 9-12)
Create programme management:

**List Page:** `/testing/programmes/page.tsx`
- Table of programmes with stats (tests count, completion %)
- Status badges (draft/pending_approval/approved/active/completed)
- Year filter

**Create Page:** `/testing/programmes/new/page.tsx`
- Programme details form
- Year selection
- Budget allocation
- Scope/objectives
- Risk assessment basis

**Detail Page:** `/testing/programmes/[id]/page.tsx`
- Programme overview
- Linked tests list with add button
- Budget tracking (allocated vs spent)
- Approval workflow:
  - Submit for approval button
  - Approve/reject buttons (for admins)

### 4.5 TLPT Enhancements (Day 13-15)
Create/update TLPT pages:

**Edit Page:** `/testing/tlpt/[id]/edit/page.tsx`
- Same form as new, pre-populated

**Phase Tracking UI:** (in detail page)
- TIBER-EU phase stepper component
- TI Provider section:
  - Provider name & accreditation
  - Phase dates (start/end)
  - Report received checkbox
- RT Provider section:
  - Provider name & accreditation
  - Phase dates
  - Report received checkbox
- Closure section:
  - Purple team session date
  - Remediation plan date
  - Attestation date & reference
- Regulator notification section

---

## Phase 5: Settings & Polish (Week 6-7)

### 5.1 Complete Settings Pages

**Webhooks** (`/settings/integrations/webhooks`):
- [ ] Create webhook form (URL, events, secret)
- [ ] Test webhook button
- [ ] Delivery history log
- Decision: Implement or remove?

**API Keys** (`/settings/integrations`):
- [ ] Create API key form
- [ ] Key rotation
- [ ] Usage tracking
- Decision: Implement or remove?

**Team Management** (`/settings/team`):
- [ ] Complete invitation flow
- [ ] Role management
- [ ] Remove member confirmation

### 5.2 Error Handling Audit
Add error boundaries and handling to:
- [ ] Concentration risk page (catches calculation errors)
- [ ] Testing pages (catches missing data)
- [ ] Settings pages (catches permission errors)

### 5.3 Loading States Audit
Ensure all pages have:
- [ ] Proper Suspense boundaries
- [ ] Skeleton loaders
- [ ] No hanging states

---

## Phase 6: QA & Hardening (Week 7-8)

### 6.1 End-to-End Testing
Test complete workflows:
- [ ] Vendor lifecycle (create → assess → monitor → offboard)
- [ ] Questionnaire flow (send → vendor completes → review → approve)
- [ ] Incident flow (create → classify → report → resolve)
- [ ] Testing flow (programme → test → findings → remediate → verify)
- [ ] RoI flow (populate → validate → export)

### 6.2 Performance Testing
- [ ] Test with 100+ vendors
- [ ] Test with 500+ documents
- [ ] Test concentration calculations at scale
- [ ] Check for N+1 queries

### 6.3 Security Audit
- [ ] RLS policies review
- [ ] API route protection
- [ ] Input validation
- [ ] XSS prevention

### 6.4 Demo Data & Onboarding
- [ ] Create demo organization script
- [ ] Seed realistic test data
- [ ] First-run onboarding flow
- [ ] Tooltips for complex features

---

## Success Criteria

**Activity Logging:**
- [ ] All CRUD operations logged
- [ ] Activity page shows last 100 events
- [ ] CSV export works
- [ ] Filter by entity type works

**Concentration Risk:**
- [ ] Spend-based HHI calculated correctly
- [ ] Single vendor >30% triggers alert
- [ ] Spend pie chart displays
- [ ] Data quality indicator shows

**Resilience Testing:**
- [ ] Can create/edit/delete tests
- [ ] Can record findings with CVSS
- [ ] Remediation workflow works end-to-end
- [ ] TLPT phase tracking complete
- [ ] Programmes can be created and approved

**Notifications:**
- [ ] In-app notifications appear
- [ ] Preferences save and apply
- [ ] Email digests send
- [ ] Critical alerts send immediately

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Scope creep | Stick to defined features, defer nice-to-haves |
| Testing delays | Start QA in parallel with Phase 5 |
| Integration issues | Test notification triggers incrementally |
| Performance | Profile concentration calculations early |

---

## Decision Points

1. **Webhooks**: Implement fully or remove UI?
2. **API Keys**: Implement fully or remove UI?
3. **Currency Conversion**: Use static rates or integrate API?
4. **Email Provider**: Stick with Resend or switch?

---

## Next Steps

1. Start with Phase 1 (Notifications) - unblocks everything else
2. Run Phase 2 (Activity Logging) in parallel where possible
3. Phase 3 & 4 can run concurrently with different focus areas
4. Reserve final 2 weeks for QA and polish
