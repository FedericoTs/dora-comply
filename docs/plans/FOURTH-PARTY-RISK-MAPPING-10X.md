# Fourth-Party Risk Mapping - 10X Implementation Plan

## Overview

Build a supply chain visualization system that maps vendor → subcontractor → nth-party chains per DORA Article 28(8) requirements. This feature enables financial institutions to understand their full ICT dependency tree and identify hidden concentration risks.

## DORA Requirements (Article 28-29)

> "Financial entities shall ensure that arrangements with ICT third-party service providers include provisions for direct or indirect subcontracting of ICT services supporting critical or important functions."

**Key Regulatory Expectations:**
- Visibility into all subcontracting chains
- Prior approval for material subcontracting
- Right to terminate if subcontracting introduces unacceptable risk
- Direct audit rights extending to subcontractors

## Current State Analysis

### ✅ Already Implemented
- `subcontractors` table with recursive `parent_subcontractor_id`
- `tier_level` field (1-5) for chain depth tracking
- `DependencyGraph`, `DependencyNode`, `DependencyEdge` types defined
- SOC2 parser extracts `ExtractedSubserviceOrg` data
- Concentration thresholds for chain depth warnings (3/5 levels)

### ❌ Missing
- Chain traversal utility functions
- Chain depth metric calculations
- Graph visualization component
- `/api/vendors/[id]/chain` endpoint
- Auto-linking of parsed SOC2 subservice orgs
- Supply chain risk aggregation

## Implementation Plan

### Phase 1: Data Layer (Priority 1)

#### 1.1 Chain Traversal Utilities
**File:** `src/lib/concentration/chain-utils.ts`

```typescript
// Build complete dependency chain from a vendor
export async function buildVendorChain(vendorId: string): Promise<DependencyGraph>

// Recursive query for all descendants
export async function getSubcontractorChain(vendorId: string): Promise<Subcontractor[]>

// Calculate metrics for a chain
export async function calculateChainMetrics(chain: Subcontractor[]): Promise<ChainMetrics>
```

#### 1.2 Update Concentration Calculations
**File:** `src/lib/concentration/calculations.ts`

Add implementations for:
- `calculateAverageChainLength()` - Mean depth across all vendors
- `calculateMaxChainDepth()` - Deepest subcontracting chain
- `calculateChainConcentration()` - HHI across full supply chain

### Phase 2: API Layer (Priority 2)

#### 2.1 Vendor Chain Endpoint
**File:** `src/app/api/vendors/[id]/chain/route.ts`

```typescript
GET /api/vendors/[id]/chain
Response: {
  vendor: Vendor,
  chain: DependencyGraph,
  metrics: {
    depth: number,
    totalNodes: number,
    criticalNodes: number,
    riskScore: number
  }
}
```

#### 2.2 Bulk Chain Analysis
**File:** `src/app/api/concentration/chains/route.ts`

```typescript
GET /api/concentration/chains
Response: {
  chains: DependencyGraph[],
  aggregateMetrics: {
    avgChainLength: number,
    maxChainDepth: number,
    deepestVendor: string,
    totalFourthParties: number
  }
}
```

### Phase 3: Visualization Library (Priority 3)

#### 3.1 Install D3.js Force Graph
```bash
npm install d3 @types/d3
```

Rationale: D3 provides force-directed layout, zoom/pan, and is the industry standard for graph visualization. Lighter than Cytoscape but more flexible than ELK.

#### 3.2 Create Reusable Graph Components
**File:** `src/components/visualization/supply-chain-graph.tsx`

Features:
- Force-directed layout with collision detection
- Node coloring by tier (critical/important/standard)
- Edge thickness by criticality
- Zoom, pan, and node click interaction
- Tooltip with vendor details
- Highlight path to selected node

### Phase 4: UI Components (Priority 4)

#### 4.1 Supply Chain Visualization
**File:** `src/app/(dashboard)/concentration/components/supply-chain-visualization.tsx`

- Graph view of all vendor relationships
- Filter by service type, region, tier
- Toggle between hierarchical and force layouts
- Export as SVG/PNG for reports

#### 4.2 Vendor Chain Detail Panel
**File:** `src/app/(dashboard)/vendors/[id]/components/vendor-chain.tsx`

- Single vendor's complete subcontractor tree
- Risk propagation visualization
- Chain metrics sidebar
- Add/edit subcontractor actions

#### 4.3 Fourth-Party Risk Cards
**File:** `src/app/(dashboard)/concentration/components/fourth-party-cards.tsx`

- Summary cards for 4th+ party statistics
- Deep chain warnings
- Unmonitored subcontractor alerts

### Phase 5: SOC2 Auto-Linking (Priority 5)

#### 5.1 Subservice Organization Linker
**File:** `src/lib/ai/parsers/subservice-linker.ts`

```typescript
// After SOC2 parsing, auto-populate subcontractors table
export async function linkSubserviceOrgs(
  documentId: string,
  vendorId: string,
  subserviceOrgs: ExtractedSubserviceOrg[]
): Promise<LinkedSubcontractor[]>
```

#### 5.2 Update Parse-SOC2 Route
**File:** `src/app/api/documents/[id]/parse-soc2/route.ts`

Add post-parsing step to call `linkSubserviceOrgs()` and create subcontractor records.

### Phase 6: Risk Aggregation (Priority 6)

#### 6.1 Inherited Risk Calculation
**File:** `src/lib/concentration/chain-risk.ts`

```typescript
// Calculate risk score propagated from subcontractors
export function calculateInheritedRisk(chain: DependencyGraph): number

// Identify weakest links in chain
export function findChainVulnerabilities(chain: DependencyGraph): Vulnerability[]
```

## Database Considerations

The existing `subcontractors` table schema supports this implementation:

```sql
-- Key fields for chain traversal
tier_level INTEGER,              -- 1=direct, 2=sub-sub, 3+=4th+
parent_subcontractor_id UUID,    -- Recursive parent
vendor_id UUID,                  -- Direct parent vendor
supports_critical_function BOOLEAN,
risk_rating TEXT                 -- low/medium/high
```

**Recursive Query Pattern:**
```sql
WITH RECURSIVE chain AS (
  SELECT *, 1 as depth FROM subcontractors WHERE vendor_id = $1
  UNION ALL
  SELECT s.*, c.depth + 1 FROM subcontractors s
  JOIN chain c ON s.parent_subcontractor_id = c.id
  WHERE c.depth < 10
)
SELECT * FROM chain ORDER BY depth;
```

## UI/UX Specifications

### Graph Visualization
- **Layout:** Force-directed with hierarchical hints (your entity at center)
- **Node Size:** 32px for vendors, 24px for subcontractors
- **Node Colors:** Critical (red), Important (orange), Standard (green)
- **Edge Style:** Solid for direct, dashed for 4th+ party
- **Interactions:** Click to select, double-click to expand/collapse

### Chain Depth Indicators
- **Tier 1 (Direct):** Blue badge "Direct"
- **Tier 2 (Fourth-Party):** Yellow badge "4th Party"
- **Tier 3+ (Deep):** Red badge "Deep Chain ⚠️"

### Warning Banners
- Chain depth > 3: "Extended supply chain detected - review required"
- Unmonitored 4th parties: "X subcontractors without active monitoring"
- Critical function at depth > 2: "Critical function depends on deep chain"

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/concentration/chain-utils.ts` | Chain traversal utilities |
| `src/lib/concentration/chain-risk.ts` | Inherited risk calculations |
| `src/components/visualization/supply-chain-graph.tsx` | D3 graph component |
| `src/app/api/vendors/[id]/chain/route.ts` | Single vendor chain API |
| `src/app/api/concentration/chains/route.ts` | Bulk chain analysis API |
| `src/app/(dashboard)/concentration/components/supply-chain-visualization.tsx` | Dashboard graph view |
| `src/app/(dashboard)/concentration/components/fourth-party-cards.tsx` | 4th party stats cards |
| `src/app/(dashboard)/vendors/[id]/components/vendor-chain.tsx` | Vendor detail chain view |
| `src/lib/ai/parsers/subservice-linker.ts` | SOC2 auto-linking |

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/concentration/calculations.ts` | Add chain depth calculations |
| `src/app/api/concentration/route.ts` | Include chain metrics |
| `src/app/(dashboard)/concentration/concentration-dashboard.tsx` | Add graph section |
| `src/app/(dashboard)/concentration/components/metrics-grid.tsx` | Update 4th party metrics |
| `src/app/api/documents/[id]/parse-soc2/route.ts` | Add auto-linking step |
| `package.json` | Add d3 dependency |

## Success Criteria

- [ ] Can view complete supply chain graph for all vendors
- [ ] Can drill into individual vendor's subcontractor tree
- [ ] Chain depth metrics populated (avg/max)
- [ ] 4th+ party count displayed in concentration dashboard
- [ ] SOC2 subservice orgs auto-create subcontractor records
- [ ] Deep chain warnings (>3 levels) shown prominently
- [ ] Critical functions at deep chain levels flagged
- [ ] Graph is interactive (zoom, pan, click, filter)
- [ ] Export graph for regulatory reports

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Performance with large chains | Pagination, lazy loading, virtual DOM |
| Complex recursive queries | Database indexes on parent_subcontractor_id |
| D3 bundle size | Tree-shake unused modules |
| Mobile UX for graphs | Responsive zoom, touch gestures |

## Estimated Effort

| Phase | Hours |
|-------|-------|
| Data Layer | 3 |
| API Layer | 2 |
| Visualization Library | 3 |
| UI Components | 4 |
| SOC2 Auto-Linking | 2 |
| Risk Aggregation | 2 |
| Testing & Polish | 2 |
| **Total** | **18 hours** |
