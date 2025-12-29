# Sprint 4: Dashboard & Polish

**Sprint Dates:** Week 4
**Sprint Goal:** Dashboard shows real metrics, UI polished for internal testing

---

## Sprint Backlog

### Story 4.1: Dashboard Metrics
**Points:** 5 | **Assignee:** Full-stack

**Tasks:**
- [ ] Create StatCard component
- [ ] Calculate total vendors count
- [ ] Calculate critical risk count (placeholder formula)
- [ ] Calculate pending reviews count
- [ ] Calculate RoI readiness percentage
- [ ] Create `/api/dashboard/stats` endpoint
- [ ] Update dashboard home page

**Metrics to Display:**
```typescript
{
  totalVendors: number;
  criticalRiskCount: number;
  pendingReviews: number;
  roiReadiness: number; // percentage
}
```

**Acceptance Criteria:**
- [ ] All 4 metrics display
- [ ] Numbers are accurate
- [ ] Updates when data changes

---

### Story 4.2: Recent Activity Feed
**Points:** 3 | **Assignee:** Full-stack

**Tasks:**
- [ ] Create activity log table in database
- [ ] Log vendor create/update events
- [ ] Log document upload events
- [ ] Create ActivityFeed component
- [ ] Show last 10 activities on dashboard
- [ ] Format timestamps ("2 hours ago")

**Acceptance Criteria:**
- [ ] Activities logged automatically
- [ ] Feed shows on dashboard
- [ ] Relative timestamps work

---

### Story 4.3: Upcoming Deadlines Widget
**Points:** 2 | **Assignee:** Frontend

**Tasks:**
- [ ] Create DeadlinesWidget component
- [ ] Show RoI deadline countdown
- [ ] Show expiring contracts (if any)
- [ ] Show pending reviews count
- [ ] Style per design system

**Acceptance Criteria:**
- [ ] RoI deadline always shows
- [ ] Days remaining calculated correctly
- [ ] Clickable items navigate to relevant page

---

### Story 4.4: Error Handling & Toasts
**Points:** 3 | **Assignee:** Frontend

**Tasks:**
- [ ] Audit all API calls for error handling
- [ ] Add try/catch where missing
- [ ] Show toast on all errors
- [ ] Show toast on all successes
- [ ] Create consistent error messages
- [ ] Handle network errors gracefully

**Acceptance Criteria:**
- [ ] No unhandled errors
- [ ] User always knows what happened
- [ ] Network issues shown clearly

---

### Story 4.5: Loading States
**Points:** 3 | **Assignee:** Frontend

**Tasks:**
- [ ] Create page-level skeleton loaders
- [ ] Add loading states to all data fetches
- [ ] Add loading states to form submissions
- [ ] Create Spinner component
- [ ] Prevent double-submits

**Acceptance Criteria:**
- [ ] No blank screens during load
- [ ] Buttons disabled while submitting
- [ ] Skeleton matches final layout

---

### Story 4.6: Empty States
**Points:** 2 | **Assignee:** Frontend

**Tasks:**
- [ ] Create EmptyState component
- [ ] Add empty state to vendor list
- [ ] Add empty state to document list
- [ ] Add helpful CTAs in empty states
- [ ] Style per design system

**Acceptance Criteria:**
- [ ] Empty tables show helpful message
- [ ] CTAs guide user to add data
- [ ] Matches design system

---

### Story 4.7: Mobile Responsiveness
**Points:** 3 | **Assignee:** Frontend

**Tasks:**
- [ ] Test all pages on mobile viewport
- [ ] Fix sidebar collapse on mobile
- [ ] Fix tables on mobile (horizontal scroll or cards)
- [ ] Fix forms on mobile
- [ ] Fix modals on mobile

**Acceptance Criteria:**
- [ ] All pages usable on 375px width
- [ ] No horizontal overflow
- [ ] Touch targets adequate size

---

### Story 4.8: User Settings Page
**Points:** 3 | **Assignee:** Full-stack

**Tasks:**
- [ ] Create `/settings/profile` page
- [ ] Show user info (name, email)
- [ ] Allow name update
- [ ] Allow password change
- [ ] Show organization info (read-only)

**Acceptance Criteria:**
- [ ] Can update name
- [ ] Can change password
- [ ] Org info visible

---

### Story 4.9: Organization Settings Page
**Points:** 2 | **Assignee:** Full-stack

**Tasks:**
- [ ] Create `/settings` page
- [ ] Show organization details
- [ ] Allow name/LEI update (admin only)
- [ ] Show data region (read-only)

**Acceptance Criteria:**
- [ ] Org details editable by admin
- [ ] Changes saved correctly

---

## Sprint Totals

| Metric | Value |
|--------|-------|
| Total Stories | 9 |
| Total Points | 26 |
| Team Capacity | 2 developers |

---

## Definition of Done

- [ ] Code reviewed and approved
- [ ] TypeScript types complete
- [ ] Full error handling
- [ ] Fully responsive
- [ ] Deployed to Vercel production
- [ ] Ready for internal testing

---

## Dependencies

- Sprint 1-3 complete

---

## Phase 1 Exit Criteria (End of Sprint 4)

- [ ] Users can register and log in
- [ ] Users can CRUD vendors
- [ ] Users can upload documents
- [ ] Dashboard shows real metrics
- [ ] No critical bugs
- [ ] Mobile responsive
- [ ] Internal team can use for real work

---

## Notes

- This sprint is about polish and filling gaps
- Focus on user experience and error handling
- End goal: ready for internal dogfooding
