# Sprint 2: Vendor Management Core

**Sprint Dates:** Week 2
**Sprint Goal:** Users can create, view, edit, and list vendors with full CRUD operations

---

## Sprint Backlog

### Story 2.1: Vendor List Page
**Points:** 5 | **Assignee:** Frontend

**Tasks:**
- [ ] Create `/vendors` page
- [ ] Build DataTable component with sorting
- [ ] Add search functionality
- [ ] Add tier filter dropdown
- [ ] Add status filter dropdown
- [ ] Implement pagination
- [ ] Create VendorTierBadge component
- [ ] Create StatusBadge component
- [ ] Style per design system

**Acceptance Criteria:**
- [ ] All vendors display in table
- [ ] Search filters results
- [ ] Filters work correctly
- [ ] Pagination works
- [ ] Matches wireframe layout

---

### Story 2.2: Vendor Detail Page
**Points:** 5 | **Assignee:** Frontend

**Tasks:**
- [ ] Create `/vendors/[id]` page
- [ ] Build vendor header with badges
- [ ] Create tab navigation (Overview, Documents, RoI, Risk)
- [ ] Build Overview tab content
- [ ] Show vendor metadata
- [ ] Show DORA compliance placeholder
- [ ] Add Edit button
- [ ] Add breadcrumb navigation

**Acceptance Criteria:**
- [ ] Vendor details display correctly
- [ ] Tabs switch content
- [ ] Edit navigates to edit page
- [ ] 404 for invalid vendor ID

---

### Story 2.3: Create Vendor Form
**Points:** 5 | **Assignee:** Full-stack

**Tasks:**
- [ ] Create `/vendors/new` page
- [ ] Build vendor form with all fields
- [ ] Add LEI format validation
- [ ] Add tier selection
- [ ] Add jurisdiction dropdown
- [ ] Add critical function toggle
- [ ] Implement form submission
- [ ] Handle success/error states
- [ ] Redirect to vendor detail on success

**Form Fields:**
```typescript
{
  name: string;           // Required
  lei: string;            // Optional, validated format
  tier: 'critical' | 'important' | 'standard';
  status: 'active' | 'pending' | 'inactive';
  jurisdiction: string;   // Country code
  serviceTypes: string[];
  supportsCriticalFunction: boolean;
  criticalFunctions: string[];
  primaryContact: {
    name: string;
    email: string;
  };
}
```

**Acceptance Criteria:**
- [ ] Form validates all fields
- [ ] LEI format checked
- [ ] Vendor saved to database
- [ ] Success toast shown
- [ ] Redirects to vendor detail

---

### Story 2.4: Edit Vendor
**Points:** 3 | **Assignee:** Full-stack

**Tasks:**
- [ ] Create `/vendors/[id]/edit` page
- [ ] Pre-populate form with vendor data
- [ ] Handle form submission (update)
- [ ] Add cancel button
- [ ] Show loading state

**Acceptance Criteria:**
- [ ] Form loads with existing data
- [ ] Changes saved correctly
- [ ] Redirects back to detail

---

### Story 2.5: Delete Vendor
**Points:** 2 | **Assignee:** Full-stack

**Tasks:**
- [ ] Add delete button to vendor detail
- [ ] Create confirmation dialog
- [ ] Implement soft delete
- [ ] Redirect to vendor list
- [ ] Show success toast

**Acceptance Criteria:**
- [ ] Confirmation required
- [ ] Vendor removed from list
- [ ] Can't access deleted vendor

---

### Story 2.6: Bulk Vendor Import
**Points:** 5 | **Assignee:** Full-stack

**Tasks:**
- [ ] Create import button on vendor list
- [ ] Build import modal/dialog
- [ ] Create CSV template download
- [ ] Parse uploaded CSV
- [ ] Validate each row
- [ ] Show validation errors with row numbers
- [ ] Allow partial import (skip errors)
- [ ] Show import summary

**CSV Template Columns:**
```
name,lei,tier,jurisdiction,service_types,critical_function,contact_name,contact_email
```

**Acceptance Criteria:**
- [ ] Template downloadable
- [ ] Valid CSV imports correctly
- [ ] Errors shown per row
- [ ] Partial import works

---

### Story 2.7: Vendor Search API
**Points:** 2 | **Assignee:** Backend

**Tasks:**
- [ ] Create `/api/vendors` endpoint
- [ ] Add search query parameter
- [ ] Add tier filter
- [ ] Add status filter
- [ ] Add pagination
- [ ] Optimize query performance

**Acceptance Criteria:**
- [ ] API returns filtered results
- [ ] Search is case-insensitive
- [ ] Pagination works correctly

---

### Story 2.8: LEI Validation
**Points:** 2 | **Assignee:** Backend

**Tasks:**
- [ ] Create LEI format regex validation
- [ ] Optional: integrate GLEIF API for verification
- [ ] Add validation to vendor form
- [ ] Show error for invalid LEI

**Acceptance Criteria:**
- [ ] Invalid LEI format rejected
- [ ] Valid LEI accepted
- [ ] Clear error message

---

## Sprint Totals

| Metric | Value |
|--------|-------|
| Total Stories | 8 |
| Total Points | 29 |
| Team Capacity | 2 developers |

---

## Definition of Done

- [ ] Code reviewed and approved
- [ ] TypeScript types complete
- [ ] Error handling in place
- [ ] Responsive on mobile
- [ ] Deployed to Vercel preview
- [ ] Tested manually

---

## Dependencies

- Sprint 1 complete (auth, database)

---

## Notes

- Focus on making vendor CRUD bulletproof
- DataTable component will be reused for documents
- Bulk import is stretch goal if time permits
