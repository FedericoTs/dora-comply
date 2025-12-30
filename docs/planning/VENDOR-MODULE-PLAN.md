# Vendor Management Module - Implementation Plan

**Document Status:** PLANNING
**Created:** 2024-12-30
**Author:** Claude Code

---

## 1. Competitive Analysis Summary

### Current Market Leaders

| Platform | Strengths | Weaknesses |
|----------|-----------|------------|
| **OneTrust** | 50+ frameworks, enterprise features, Third-Party Risk Exchange | Complex, expensive, steep learning curve |
| **Vanta** | AI-powered assessments, 350+ integrations, continuous monitoring | General compliance focus, not DORA-specific |
| **Drata** | AI VRM Agent, vendor discovery via Okta | Newer TPRM offering, limited DORA support |
| **SecurityScorecard** | Real-time security ratings, cyber risk intelligence | Separate licensing, fragmented workflows |
| **Prevalent** | Managed services, Global Vendor Intelligence Network | UI not intuitive, automation limitations |

### Common Pain Points in Market

1. **Questionnaire Fatigue** - Vendors hate filling out security questionnaires
2. **Manual Data Entry** - Hours spent entering vendor details
3. **Static Risk Scores** - Calculated once, rarely updated
4. **Enterprise UX** - Complex, intimidating interfaces
5. **Generic Compliance** - Not purpose-built for DORA
6. **Slow Onboarding** - Days/weeks to import existing vendors

---

## 2. Our 10X Differentiation Strategy

### Core Philosophy: "Zero Questionnaire Compliance"

> Instead of sending questionnaires, we parse the documents vendors already have.
> A SOC 2 Type II report contains more reliable data than any questionnaire.

### 10X Features

| Feature | Competitors | DORA Comply (10X) |
|---------|-------------|-------------------|
| **Vendor Onboarding** | Manual form entry | Paste name → LEI auto-lookup → Auto-populate |
| **Data Collection** | Send questionnaires | AI parses SOC2/ISO27001 in 60 seconds |
| **Risk Scoring** | Manual assessment | Auto-calculated from parsed documents |
| **DORA Mapping** | Generic controls | Native RoI field mapping, deadline tracking |
| **Supply Chain** | Flat vendor list | Interactive subcontractor tree visualization |
| **Data Locations** | Text fields | Geographic map with EU adequacy indicators |
| **User Experience** | Enterprise dashboards | Consumer-grade, Airbnb/Linear-inspired |
| **Empty States** | Blank tables | Guided onboarding with clear next steps |

---

## 3. Database Schema (Existing)

We have a robust schema already in place:

```
vendors (core)
├── vendor_contacts (B_02.02)
├── vendor_entities (B_02.03)
├── contracts (B_03.01)
│   ├── contract_contacts (B_03.02)
│   └── ict_services (B_04.01)
│       └── service_data_locations (B_04.02)
├── subcontractors (B_06.01)
├── documents
│   ├── parsed_soc2
│   └── parsed_iso27001
├── roi_entries
├── risk_scores (historical)
└── vendor_control_assessments
```

### Key Vendor Fields

```typescript
interface Vendor {
  id: string;
  organization_id: string;
  name: string;
  lei?: string;                    // GLEIF validation
  tier: 'critical' | 'important' | 'standard';
  status: 'active' | 'pending' | 'inactive' | 'offboarding';
  provider_type?: string;
  headquarters_country?: string;
  jurisdiction?: string;
  service_types: string[];
  supports_critical_function: boolean;
  critical_functions: string[];
  is_intra_group: boolean;
  risk_score?: number;             // 0-100
  last_assessment_date?: Date;
  primary_contact: {
    name: string;
    email: string;
    phone?: string;
  };
  metadata: object;
}
```

---

## 4. User Experience Design

### 4.1 Vendor List Page (`/vendors`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Page Header]                                                            │
│ ICT Third-Party Providers                                    [+ Add]    │
│ Manage your vendor inventory for DORA compliance                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ [Stats Row - 4 cards]                                                   │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│ │ Total      │ │ Critical   │ │ Pending    │ │ RoI Ready  │            │
│ │ 24 vendors │ │ 3 vendors  │ │ 5 reviews  │ │ 68%        │            │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘            │
│                                                                         │
│ [Filter Bar]                                                            │
│ 🔍 Search vendors...  [Tier ▼] [Status ▼] [Risk ▼] [☰ View]            │
│                                                                         │
│ [Vendor Cards/Table - Toggle View]                                      │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ 🏢 AWS (Amazon Web Services)              Critical    Active    85  ││
│ │    Cloud Infrastructure | US | LEI: 549300...        ████████░░     ││
│ │    3 services • 2 documents • Last assessed: 2 days ago            ││
│ ├─────────────────────────────────────────────────────────────────────┤│
│ │ 🏢 Microsoft Azure                        Important   Active    72  ││
│ │    Cloud Computing | US | LEI: 549300...             ███████░░░     ││
│ │    5 services • 1 document • Last assessed: 1 week ago             ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│ [Empty State - if no vendors]                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │    🏢                                                               ││
│ │    No vendors yet                                                   ││
│ │    Add your first ICT third-party provider to get started.         ││
│ │                                                                     ││
│ │    [+ Add your first vendor]    or    [Import from CSV]            ││
│ └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Add Vendor Flow (`/vendors/new`)

**Step 1: Smart Lookup**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Add Vendor                                                     Step 1/3 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Start with the vendor name or LEI                                     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🔍 Enter vendor name or LEI...                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Searching GLEIF database...]                                         │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ✓ Amazon Web Services, Inc.                                     │   │
│  │   LEI: 549300R4AQVACLP1M455                                     │   │
│  │   🇺🇸 United States • Active                                    │   │
│  │                                                      [Select]    │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ ✓ Amazon.com Services LLC                                       │   │
│  │   LEI: 549300PHXI7QVLQWN036                                     │   │
│  │   🇺🇸 United States • Active                                    │   │
│  │                                                      [Select]    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Can't find vendor? [Add manually without LEI]                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Step 2: Classification**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Classify Vendor                                                Step 2/3 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Amazon Web Services, Inc.                                             │
│  LEI: 549300R4AQVACLP1M455                                             │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                         │
│  Provider Type *                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Cloud Service Provider                                      ▼   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Service Types                                                          │
│  [x] Cloud Computing  [ ] Data Analytics  [ ] Security Services        │
│  [x] IaaS             [ ] Network Services [ ] Payment Services        │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                         │
│  Criticality Tier *                     💡 DORA requires tiering       │
│                                                                         │
│  ○ Critical                                                            │
│    Supports critical or important functions, no substitutability       │
│                                                                         │
│  ○ Important                                                           │
│    Significant operational dependency, limited substitutability        │
│                                                                         │
│  ● Standard                                                            │
│    Regular vendor, easily substitutable                                │
│                                                                         │
│                                          [Back]  [Continue]            │
└─────────────────────────────────────────────────────────────────────────┘
```

**Step 3: Critical Functions (if tier is Critical/Important)**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Link to Critical Functions                                     Step 3/3 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Which critical functions does this vendor support?                    │
│                                                                         │
│  [x] Payment Processing                                                │
│  [ ] Customer Data Management                                          │
│  [x] Trading Platform                                                  │
│  [ ] Regulatory Reporting                                              │
│                                                                         │
│  [+ Add new critical function]                                         │
│                                                                         │
│                                          [Back]  [Add Vendor]          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Vendor Detail Page (`/vendors/[id]`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back to Vendors                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ [Header Card]                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ 🏢 AWS (Amazon Web Services, Inc.)                                  ││
│ │    Cloud Service Provider • 🇺🇸 United States                      ││
│ │                                                                     ││
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                ││
│ │ │ Critical │ │ Active   │ │ Risk: 85 │ │ RoI: 92% │                ││
│ │ │   tier   │ │  status  │ │ ████████░│ │ complete │                ││
│ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘                ││
│ │                                                                     ││
│ │ LEI: 549300R4AQVACLP1M455                      [Edit] [⋮ More]     ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│ [Tabs]                                                                 │
│ [Overview] [Documents] [Contracts] [Services] [Risk] [Subcontractors] │
│                                                                         │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│ [Overview Tab Content]                                                 │
│                                                                         │
│ ┌────────────────────────────────┐  ┌────────────────────────────────┐ │
│ │ Compliance Status              │  │ Contact Information            │ │
│ │                                │  │                                │ │
│ │ SOC 2 Type II     ✓ Valid     │  │ Primary: John Smith            │ │
│ │ Expires: Mar 2025             │  │ john@aws.com                   │ │
│ │                                │  │ +1 (555) 123-4567             │ │
│ │ ISO 27001         ✓ Valid     │  │                                │ │
│ │ Expires: Nov 2025             │  │ [Edit contact]                 │ │
│ │                                │  │                                │ │
│ │ [+ Upload document]           │  │                                │ │
│ └────────────────────────────────┘  └────────────────────────────────┘ │
│                                                                         │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Services Provided                                                  │ │
│ │                                                                    │ │
│ │ ┌──────────────────────────────────────────────────────────────┐  │ │
│ │ │ AWS EC2 - Infrastructure       Critical    99.99% SLA       │  │ │
│ │ │ Data locations: Frankfurt, Dublin, Virginia                  │  │ │
│ │ ├──────────────────────────────────────────────────────────────┤  │ │
│ │ │ AWS S3 - Storage               Important   99.9% SLA        │  │ │
│ │ │ Data locations: Frankfurt, Dublin                           │  │ │
│ │ └──────────────────────────────────────────────────────────────┘  │ │
│ │                                                                    │ │
│ │ [+ Add service]                                                    │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Recent Activity                                                    │ │
│ │                                                                    │ │
│ │ 📄 SOC 2 report uploaded                         2 hours ago      │ │
│ │ ✓  Risk score updated: 82 → 85                   2 hours ago      │ │
│ │ 👤 Contact updated                               1 week ago       │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Technical Implementation Plan

### 5.1 File Structure

```
src/
├── app/(dashboard)/
│   └── vendors/
│       ├── page.tsx                    # Vendor list
│       ├── new/
│       │   └── page.tsx                # Add vendor wizard
│       ├── [id]/
│       │   ├── page.tsx                # Vendor detail
│       │   ├── edit/
│       │   │   └── page.tsx            # Edit vendor
│       │   └── documents/
│       │       └── upload/
│       │           └── page.tsx        # Upload documents
│       └── import/
│           └── page.tsx                # Bulk CSV import
│
├── components/
│   └── vendors/
│       ├── vendor-card.tsx             # Card display in list
│       ├── vendor-table.tsx            # Table display in list
│       ├── vendor-filters.tsx          # Filter bar
│       ├── vendor-stats.tsx            # Stats cards
│       ├── vendor-form.tsx             # Create/edit form
│       ├── vendor-header.tsx           # Detail page header
│       ├── vendor-tabs.tsx             # Detail page tabs
│       ├── vendor-empty-state.tsx      # Empty state
│       ├── lei-lookup.tsx              # GLEIF lookup component
│       ├── tier-selector.tsx           # Tier selection UI
│       ├── service-type-picker.tsx     # Multi-select services
│       └── index.ts                    # Exports
│
├── lib/
│   ├── vendors/
│   │   ├── actions.ts                  # Server actions
│   │   ├── queries.ts                  # Data fetching
│   │   ├── schemas.ts                  # Zod validation
│   │   ├── types.ts                    # TypeScript types
│   │   └── utils.ts                    # Helper functions
│   └── external/
│       └── gleif.ts                    # GLEIF API client
│
└── types/
    └── vendors.ts                      # Shared types
```

### 5.2 Implementation Phases

#### Phase 1: Core Infrastructure (This PR)
- [ ] TypeScript types and Zod schemas
- [ ] Server actions (CRUD)
- [ ] Data fetching queries
- [ ] GLEIF API integration
- [ ] Vendor list page with empty state
- [ ] Add vendor wizard (3-step)
- [ ] Vendor detail page (overview tab)
- [ ] Basic filtering and search

#### Phase 2: Enhanced Features (Follow-up)
- [ ] Bulk CSV import
- [ ] Document upload integration
- [ ] All detail page tabs
- [ ] Risk score calculation
- [ ] Activity logging
- [ ] Edit vendor flow

#### Phase 3: Advanced (Later)
- [ ] AI-powered vendor discovery
- [ ] Subcontractor visualization
- [ ] Data location map
- [ ] Contract management integration

### 5.3 API Design

```typescript
// Server Actions (src/lib/vendors/actions.ts)

// Create vendor
export async function createVendor(data: CreateVendorInput): Promise<Vendor>

// Update vendor
export async function updateVendor(id: string, data: UpdateVendorInput): Promise<Vendor>

// Delete vendor (soft delete)
export async function deleteVendor(id: string): Promise<void>

// Bulk import
export async function importVendors(file: File): Promise<ImportResult>

// GLEIF lookup
export async function lookupLEI(query: string): Promise<GLEIFResult[]>
```

```typescript
// Queries (src/lib/vendors/queries.ts)

// List vendors with filters
export async function getVendors(filters?: VendorFilters): Promise<Vendor[]>

// Get single vendor with relations
export async function getVendor(id: string): Promise<VendorWithRelations>

// Get vendor stats
export async function getVendorStats(): Promise<VendorStats>
```

### 5.4 Component Specifications

#### VendorCard
```typescript
interface VendorCardProps {
  vendor: Vendor;
  onClick?: () => void;
  showRiskScore?: boolean;
  compact?: boolean;
}
```

#### VendorFilters
```typescript
interface VendorFiltersProps {
  onFilterChange: (filters: VendorFilters) => void;
  initialFilters?: VendorFilters;
}

interface VendorFilters {
  search?: string;
  tier?: ('critical' | 'important' | 'standard')[];
  status?: ('active' | 'pending' | 'inactive' | 'offboarding')[];
  riskRange?: [number, number];
  hasDocuments?: boolean;
}
```

#### LEILookup
```typescript
interface LEILookupProps {
  onSelect: (result: GLEIFResult) => void;
  onManualEntry: () => void;
}
```

---

## 6. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Time to add vendor** | <30 seconds | With LEI auto-lookup |
| **Page load time** | <500ms | Vendor list with 100 vendors |
| **RoI completeness** | >80% | Auto-populated from parsed docs |
| **User satisfaction** | NPS >50 | In-app surveys |

---

## 7. Open Questions

1. **GLEIF Rate Limits** - Need to implement caching strategy
2. **Offline Vendors** - Handle vendors without LEI gracefully
3. **Bulk Import Template** - Standardize CSV format
4. **Risk Score Algorithm** - Define calculation formula

---

## 8. Next Steps

1. **Approve this plan** - User reviews and confirms approach
2. **Implement Phase 1** - Core vendor CRUD and list page
3. **Test with real data** - Import sample vendors
4. **Iterate based on feedback** - Refine UX

---

**Ready for implementation upon approval.**
