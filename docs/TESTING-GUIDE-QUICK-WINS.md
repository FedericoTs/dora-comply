# Quick Wins Testing Guide

This guide covers testing procedures for the three Quick Win features implemented:

1. **Settings Page** (Organization + Team Management)
2. **RoI Auto-Population UI**
3. **Incident PDF Export**

---

## Prerequisites

Before testing, ensure:
- Dev server is running: `npm run dev`
- You have a test user account with login credentials
- The user is part of an organization (required for most features)

---

## 1. Settings Page Testing

### 1.1 Navigation Test

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/settings` | Should redirect to `/settings/organization` |
| 2 | Check sidebar navigation | Should show "Organization" and "Team" links |
| 3 | Click "Team" in sidebar | Should navigate to `/settings/team` |
| 4 | Click "Organization" in sidebar | Should navigate back to `/settings/organization` |

### 1.2 Organization Settings Test

**Location:** `/settings/organization`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load page | Form displays with Organization Name and LEI fields |
| 2 | Enter invalid LEI (e.g., "ABC123") | Validation error: "LEI must be exactly 20 characters" |
| 3 | Enter valid LEI format (20 chars) | "Validate LEI" button should appear |
| 4 | Click "Validate LEI" | Should call GLEIF API and show result |
| 5 | Enter valid existing LEI: `213800MBWEIJDM5CU638` | Should auto-fill organization name from GLEIF |
| 6 | Click "Save Changes" | Should save and show success toast |

**API Endpoints to Test:**
```bash
# GET organization data (requires auth)
curl -X GET http://localhost:3000/api/settings/organization \
  -H "Cookie: <your-auth-cookie>"

# PATCH update organization (requires auth)
curl -X PATCH http://localhost:3000/api/settings/organization \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-auth-cookie>" \
  -d '{"name": "Test Org", "lei": "213800MBWEIJDM5CU638"}'
```

### 1.3 Team Management Test

**Location:** `/settings/team`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load page | Shows list of team members with roles |
| 2 | Check role badges | Should show owner/admin/analyst/viewer badges |
| 3 | Click "Invite Member" button | Should open invite dialog |
| 4 | Enter email and select role | Form validates email and role |
| 5 | Submit invitation | Should create invitation and show success |
| 6 | Click role dropdown on a member | Should show role options (if you're admin/owner) |
| 7 | Change member role | Role should update with success toast |
| 8 | Click "Remove" on a member | Should show confirmation and remove member |

**Permission Matrix:**

| Your Role | Can Invite | Can Change Roles | Can Remove Members |
|-----------|------------|------------------|-------------------|
| Owner | All roles | All except owner | All except self/owner |
| Admin | analyst, viewer | analyst, viewer | analyst, viewer |
| Analyst | No | No | No |
| Viewer | No | No | No |

**API Endpoints to Test:**
```bash
# GET team members
curl -X GET http://localhost:3000/api/settings/team \
  -H "Cookie: <your-auth-cookie>"

# POST invite member
curl -X POST http://localhost:3000/api/settings/team/invite \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-auth-cookie>" \
  -d '{"email": "test@example.com", "role": "analyst"}'

# PATCH change role
curl -X PATCH http://localhost:3000/api/settings/team/{memberId} \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-auth-cookie>" \
  -d '{"role": "viewer"}'

# DELETE remove member
curl -X DELETE http://localhost:3000/api/settings/team/{memberId} \
  -H "Cookie: <your-auth-cookie>"
```

---

## 2. RoI Auto-Population UI Testing

### 2.1 Prerequisites

Before testing RoI auto-population:
1. Upload a SOC 2 report PDF to the platform
2. Ensure the document has been processed/parsed
3. Link the document to a vendor (optional but recommended)

### 2.2 Auto-Population Test

**Location:** `/roi`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/roi` | Dashboard loads with progress stats |
| 2 | Check "AI Available" card | Shows count of populatable documents |
| 3 | Look for AI Population panel | Shows documents with "Populate RoI" buttons |
| 4 | Click "Populate RoI" on a document | Shows loading state |
| 5 | Wait for completion | Success toast with details (services/subcontractors created) |
| 6 | Check document status | Should show "Populated" badge |
| 7 | Navigate to relevant RoI template | Should show newly populated data |

**If document has no vendor linked:**
- Should show error toast with "Go to Documents" action
- Clicking action navigates to document page for vendor linking

**API Endpoints to Test:**
```bash
# GET preview (what will be populated)
curl -X GET "http://localhost:3000/api/roi/populate-from-soc2?documentId={docId}" \
  -H "Cookie: <your-auth-cookie>"

# POST populate (execute population)
curl -X POST http://localhost:3000/api/roi/populate-from-soc2 \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-auth-cookie>" \
  -d '{"documentId": "{docId}"}'
```

### 2.3 Expected Data Flow

```
SOC 2 Report (PDF)
      ↓
   [Parse]
      ↓
soc2_parsed_data table
      ↓
   [Populate]
      ↓
RoI Templates:
- B_05.01 (Vendors) - vendor details
- B_02.02 (Services) - ICT services
- Subcontractor relationships
```

---

## 3. Incident PDF Export Testing

### 3.1 Prerequisites

1. Create at least one incident (or use existing)
2. For full testing, create a "Major" classified incident (triggers DORA reporting)

### 3.2 Export Button Test

**Location:** `/incidents/{id}` (incident detail page)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to incident detail page | Page loads with incident info |
| 2 | Locate "Export" button in header | Button visible with dropdown arrow |
| 3 | Click "Export" button | Dropdown opens with export options |
| 4 | **For Major Incidents:** | Shows Initial, Intermediate, Final, Summary |
| 5 | **For Minor Incidents:** | Shows only "Full Summary" |
| 6 | Click "Full Summary" | PDF download starts |
| 7 | Open downloaded file | Contains DORA-compliant incident report |

### 3.3 Export Types

| Report Type | When to Use | Deadline |
|------------|-------------|----------|
| Initial Report (4h) | First notification to regulator | 4 hours after detection |
| Intermediate Report (72h) | Status update | 72 hours after detection |
| Final Report (1 month) | Complete analysis | 1 month after detection |
| Full Summary | Internal use / archive | N/A |

### 3.4 PDF Content Sections

The exported PDF includes 7 DORA Article 19 compliant sections:

1. **Incident Identification** - Reference, classification, type, status
2. **Incident Timeline** - Detection, occurrence, recovery, resolution
3. **Impact Assessment** - Clients, transactions, economic, data breach
4. **Third-Party Involvement** - Vendor name and LEI (if applicable)
5. **Root Cause and Remediation** - Analysis and actions taken
6. **Classification Override** - If manual override was applied
7. **Report Submission History** - All regulatory reports filed

### 3.5 API Endpoint Test

```bash
# Export as PDF
curl -X GET "http://localhost:3000/api/incidents/{id}/export?type=initial&format=pdf" \
  -H "Cookie: <your-auth-cookie>" \
  -o incident_report.pdf

# Export as JSON (for preview/API consumption)
curl -X GET "http://localhost:3000/api/incidents/{id}/export?format=json" \
  -H "Cookie: <your-auth-cookie>"
```

**Query Parameters:**
- `type`: `initial`, `intermediate`, `final`, or omit for summary
- `format`: `pdf` (default) or `json`

---

## 4. Automated Tests

Run the automated test suite:

```bash
# Install Playwright if needed
pip3 install playwright
playwright install chromium

# Run visual tests
python3 /tmp/test-visual-quick-wins.py

# Screenshots saved to /tmp/screenshot_*.png
```

---

## 5. Common Issues & Solutions

### Issue: API returns 404

**Solution:** Restart the dev server with a clean build:
```bash
rm -rf .next
npm run dev
```

### Issue: Settings pages redirect to login

**Expected:** Protected pages require authentication. Log in first.

### Issue: RoI population shows no documents

**Check:**
1. Have SOC 2 documents been uploaded?
2. Were documents successfully parsed? (check `soc2_parsed_data` table)
3. Are documents linked to your organization?

### Issue: Export button not visible

**Check:**
1. Are you on an incident detail page (`/incidents/{id}`)?
2. Does the incident exist and belong to your organization?

---

## 6. Test Checklist

### Settings

- [ ] Organization settings page loads
- [ ] LEI validation works (valid/invalid)
- [ ] GLEIF auto-fill works for valid LEI
- [ ] Organization save works
- [ ] Team management page loads
- [ ] Team member list displays correctly
- [ ] Role badges show correctly
- [ ] Invite member flow works
- [ ] Role change works (with proper permissions)
- [ ] Member removal works (with proper permissions)

### RoI Auto-Population

- [ ] RoI dashboard loads
- [ ] AI Population panel visible (if documents exist)
- [ ] Populate button triggers population
- [ ] Success toast shows details
- [ ] Populated data appears in RoI templates
- [ ] Error handling for unlinked vendors

### Incident Export

- [ ] Export button visible on incident detail
- [ ] Dropdown shows correct options based on classification
- [ ] PDF download works
- [ ] PDF contains correct sections
- [ ] JSON format option works

---

## 7. Performance Benchmarks

| Feature | Target | Acceptable |
|---------|--------|------------|
| Settings page load | <2s | <5s |
| Team list load | <1s | <3s |
| RoI dashboard load | <3s | <7s |
| PDF export generation | <5s | <10s |
| GLEIF validation | <2s | <5s |

---

*Last Updated: January 2026*
