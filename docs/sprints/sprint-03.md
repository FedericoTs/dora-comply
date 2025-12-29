# Sprint 3: Document Management

**Sprint Dates:** Week 3
**Sprint Goal:** Users can upload documents to vendors and view document list

---

## Sprint Backlog

### Story 3.1: Document Upload Component
**Points:** 5 | **Assignee:** Frontend

**Tasks:**
- [ ] Create reusable FileUpload component
- [ ] Implement drag-and-drop
- [ ] Add click to browse
- [ ] Show file preview (name, size)
- [ ] Add file type validation (PDF only)
- [ ] Add file size validation (max 50MB)
- [ ] Show upload progress
- [ ] Style per design system

**Acceptance Criteria:**
- [ ] Drag and drop works
- [ ] Click to browse works
- [ ] Invalid files rejected
- [ ] Progress shown during upload

---

### Story 3.2: Document Upload Page
**Points:** 5 | **Assignee:** Full-stack

**Tasks:**
- [ ] Create `/vendors/[id]/documents/upload` page
- [ ] Add document type selector (SOC 2, ISO, Pen Test, Other)
- [ ] Integrate FileUpload component
- [ ] Upload file to Supabase Storage
- [ ] Create document record in database
- [ ] Set initial status to "pending"
- [ ] Redirect to vendor documents tab

**Acceptance Criteria:**
- [ ] File uploaded to storage
- [ ] Document record created
- [ ] Correct document type saved
- [ ] Success toast shown

---

### Story 3.3: Document List (Vendor Tab)
**Points:** 3 | **Assignee:** Frontend

**Tasks:**
- [ ] Build Documents tab on vendor detail
- [ ] List all documents for vendor
- [ ] Show document type icon
- [ ] Show parsing status badge
- [ ] Show upload date
- [ ] Add "Upload Document" button
- [ ] Add click to view document detail

**Acceptance Criteria:**
- [ ] All vendor documents shown
- [ ] Status visible (pending, processing, completed, failed)
- [ ] Can navigate to upload
- [ ] Can navigate to document detail

---

### Story 3.4: Document Detail Page (Basic)
**Points:** 3 | **Assignee:** Frontend

**Tasks:**
- [ ] Create `/documents/[id]` page
- [ ] Show document metadata
- [ ] Show parsing status
- [ ] Add "View PDF" button (opens in new tab)
- [ ] Add "Delete" button
- [ ] Add breadcrumb back to vendor

**Acceptance Criteria:**
- [ ] Document info displayed
- [ ] Can view original PDF
- [ ] Can delete document
- [ ] Navigation works

---

### Story 3.5: Document Type Detection
**Points:** 3 | **Assignee:** Backend

**Tasks:**
- [ ] Create document classification logic
- [ ] Detect SOC 2 from filename/content
- [ ] Detect ISO 27001 from filename/content
- [ ] Set document type automatically
- [ ] Allow manual override

**Acceptance Criteria:**
- [ ] Common filenames detected correctly
- [ ] Type can be changed manually

---

### Story 3.6: Storage Security
**Points:** 2 | **Assignee:** Backend

**Tasks:**
- [ ] Configure storage bucket policies
- [ ] Ensure files only accessible by org members
- [ ] Generate signed URLs for downloads
- [ ] Set URL expiration (1 hour)

**Acceptance Criteria:**
- [ ] Direct storage URLs don't work
- [ ] Signed URLs work for authorized users
- [ ] Other orgs can't access files

---

### Story 3.7: Document Delete
**Points:** 2 | **Assignee:** Full-stack

**Tasks:**
- [ ] Add delete confirmation dialog
- [ ] Delete from storage
- [ ] Delete database record
- [ ] Redirect to vendor documents

**Acceptance Criteria:**
- [ ] Confirmation required
- [ ] File removed from storage
- [ ] Record removed from database

---

### Story 3.8: Global Document List
**Points:** 3 | **Assignee:** Frontend

**Tasks:**
- [ ] Create `/documents` page
- [ ] List all documents across vendors
- [ ] Show vendor name column
- [ ] Add filters (type, status, vendor)
- [ ] Reuse DataTable component

**Acceptance Criteria:**
- [ ] All documents listed
- [ ] Can filter by type/status
- [ ] Can navigate to vendor

---

## Sprint Totals

| Metric | Value |
|--------|-------|
| Total Stories | 8 |
| Total Points | 26 |
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

- Sprint 2 complete (vendors)
- Supabase Storage configured

---

## Notes

- Focus on upload flow - parsing comes next sprint
- Storage security is critical
- File size handling important for large SOC 2 reports
