'use server';

/**
 * Global Search Actions
 *
 * Server actions for searching across vendors, documents, and incidents
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export type SearchResultType = 'vendor' | 'document' | 'incident' | 'page';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  href: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResults {
  vendors: SearchResult[];
  documents: SearchResult[];
  incidents: SearchResult[];
  pages: SearchResult[];
  total: number;
}

// Static pages that can be searched
const PAGES: SearchResult[] = [
  { id: 'dashboard', type: 'page', title: 'Dashboard', subtitle: 'Overview and metrics', href: '/dashboard' },
  { id: 'vendors', type: 'page', title: 'Vendors', subtitle: 'Manage ICT providers', href: '/vendors' },
  { id: 'vendors-new', type: 'page', title: 'Add Vendor', subtitle: 'Register new provider', href: '/vendors/new' },
  { id: 'documents', type: 'page', title: 'Documents', subtitle: 'Contracts and certifications', href: '/documents' },
  { id: 'roi', type: 'page', title: 'Register of Information', subtitle: 'DORA RoI management', href: '/roi' },
  { id: 'roi-onboarding', type: 'page', title: 'RoI Setup Wizard', subtitle: 'Initialize your RoI', href: '/roi/onboarding' },
  { id: 'incidents', type: 'page', title: 'Incidents', subtitle: 'ICT incident reporting', href: '/incidents' },
  { id: 'incidents-new', type: 'page', title: 'Report Incident', subtitle: 'Create new incident report', href: '/incidents/new' },
  { id: 'testing', type: 'page', title: 'Resilience Testing', subtitle: 'TLPT and security tests', href: '/testing' },
  { id: 'concentration', type: 'page', title: 'Concentration Risk', subtitle: 'Vendor dependency analysis', href: '/concentration' },
  { id: 'compliance-trends', type: 'page', title: 'Compliance Trends', subtitle: 'Historical maturity data', href: '/compliance/trends' },
  { id: 'frameworks', type: 'page', title: 'Frameworks', subtitle: 'Compliance framework mapping', href: '/frameworks' },
  { id: 'settings', type: 'page', title: 'Settings', subtitle: 'Application settings', href: '/settings' },
  { id: 'settings-org', type: 'page', title: 'Organization Settings', subtitle: 'Company details', href: '/settings/organization' },
  { id: 'settings-team', type: 'page', title: 'Team Members', subtitle: 'Manage users', href: '/settings/team' },
  { id: 'settings-security', type: 'page', title: 'Security Settings', subtitle: 'MFA and sessions', href: '/settings/security' },
  { id: 'settings-notifications', type: 'page', title: 'Notification Settings', subtitle: 'Email preferences', href: '/settings/notifications' },
  { id: 'settings-appearance', type: 'page', title: 'Appearance', subtitle: 'Theme and display', href: '/settings/appearance' },
];

// ============================================================================
// Helper Functions
// ============================================================================

async function getCurrentUserOrganization(): Promise<string | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  return userData?.organization_id || null;
}

function searchPages(query: string): SearchResult[] {
  const lowerQuery = query.toLowerCase();
  return PAGES.filter(page =>
    page.title.toLowerCase().includes(lowerQuery) ||
    page.subtitle?.toLowerCase().includes(lowerQuery)
  ).slice(0, 5);
}

// ============================================================================
// Search Actions
// ============================================================================

export async function globalSearch(
  query: string,
  options?: {
    types?: SearchResultType[];
    limit?: number;
  }
): Promise<SearchResults> {
  const { types = ['vendor', 'document', 'incident', 'page'], limit = 5 } = options || {};

  // Handle empty query
  if (!query || query.trim().length < 2) {
    return {
      vendors: [],
      documents: [],
      incidents: [],
      pages: types.includes('page') ? PAGES.slice(0, limit) : [],
      total: types.includes('page') ? Math.min(PAGES.length, limit) : 0,
    };
  }

  const trimmedQuery = query.trim();
  const results: SearchResults = {
    vendors: [],
    documents: [],
    incidents: [],
    pages: [],
    total: 0,
  };

  // Search pages (no auth required)
  if (types.includes('page')) {
    results.pages = searchPages(trimmedQuery);
    results.total += results.pages.length;
  }

  // Get organization for database queries
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return results;
  }

  const supabase = await createClient();

  // Parallel database searches
  const searchPromises: Promise<void>[] = [];

  // Search vendors
  if (types.includes('vendor')) {
    searchPromises.push(
      (async () => {
        const { data } = await supabase
          .from('vendors')
          .select('id, name, lei, status, tier, headquarters_country')
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .or(`name.ilike.%${trimmedQuery}%,lei.ilike.%${trimmedQuery}%`)
          .order('name')
          .limit(limit);

        if (data) {
          results.vendors = data.map(v => ({
            id: v.id,
            type: 'vendor' as const,
            title: v.name,
            subtitle: [v.tier, v.headquarters_country, v.lei].filter(Boolean).join(' · '),
            href: `/vendors/${v.id}`,
            metadata: { status: v.status, tier: v.tier },
          }));
          results.total += results.vendors.length;
        }
      })()
    );
  }

  // Search documents
  if (types.includes('document')) {
    searchPromises.push(
      (async () => {
        const { data } = await supabase
          .from('documents')
          .select(`
            id,
            filename,
            type,
            parsing_status,
            created_at,
            vendor:vendors(name)
          `)
          .eq('organization_id', organizationId)
          .ilike('filename', `%${trimmedQuery}%`)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (data) {
          results.documents = data.map(d => {
            // Vendor is returned as an object from the join (single relation)
            const vendorName = (d.vendor as unknown as { name: string } | null)?.name;
            return {
              id: d.id,
              type: 'document' as const,
              title: d.filename,
              subtitle: [
                d.type?.replace(/_/g, ' '),
                vendorName,
              ].filter(Boolean).join(' · '),
              href: `/documents/${d.id}`,
              metadata: { docType: d.type, status: d.parsing_status },
            };
          });
          results.total += results.documents.length;
        }
      })()
    );
  }

  // Search incidents
  if (types.includes('incident')) {
    searchPromises.push(
      (async () => {
        const { data } = await supabase
          .from('incidents')
          .select(`
            id,
            incident_ref,
            title,
            classification,
            status,
            detection_datetime,
            vendor:vendors(name)
          `)
          .eq('organization_id', organizationId)
          .or(`title.ilike.%${trimmedQuery}%,incident_ref.ilike.%${trimmedQuery}%,description.ilike.%${trimmedQuery}%`)
          .order('detection_datetime', { ascending: false })
          .limit(limit);

        if (data) {
          results.incidents = data.map(i => {
            // Vendor is returned as an object from the join (single relation)
            const vendorName = (i.vendor as unknown as { name: string } | null)?.name;
            return {
              id: i.id,
              type: 'incident' as const,
              title: i.title,
              subtitle: [
                i.incident_ref,
                i.classification,
                vendorName,
              ].filter(Boolean).join(' · '),
              href: `/incidents/${i.id}`,
              metadata: { status: i.status, classification: i.classification },
            };
          });
          results.total += results.incidents.length;
        }
      })()
    );
  }

  await Promise.all(searchPromises);

  return results;
}

/**
 * Get recent items for empty search state
 */
export async function getRecentItems(): Promise<SearchResults> {
  const organizationId = await getCurrentUserOrganization();

  const results: SearchResults = {
    vendors: [],
    documents: [],
    incidents: [],
    pages: PAGES.slice(0, 3),
    total: 3,
  };

  if (!organizationId) {
    return results;
  }

  const supabase = await createClient();

  // Get recent vendors
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name, tier')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(3);

  if (vendors) {
    results.vendors = vendors.map(v => ({
      id: v.id,
      type: 'vendor' as const,
      title: v.name,
      subtitle: v.tier,
      href: `/vendors/${v.id}`,
    }));
    results.total += results.vendors.length;
  }

  // Get recent incidents
  const { data: incidents } = await supabase
    .from('incidents')
    .select('id, incident_ref, title, classification')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(3);

  if (incidents) {
    results.incidents = incidents.map(i => ({
      id: i.id,
      type: 'incident' as const,
      title: i.title,
      subtitle: `${i.incident_ref} · ${i.classification}`,
      href: `/incidents/${i.id}`,
    }));
    results.total += results.incidents.length;
  }

  return results;
}
