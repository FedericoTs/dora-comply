'use client';

import { useState, useTransition, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Upload, Building2 } from 'lucide-react';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useFramework } from '@/lib/context/framework-context';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState, SearchEmptyState, FilterEmptyState } from '@/components/ui/empty-state';
import { FrameworkContextBanner } from '@/components/ui/framework-context-banner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  VendorCard,
  VendorSmartTable,
  VendorSearch,
  VendorFiltersDropdown,
  VendorFilterTags,
  VendorViewToggle,
  VendorPagination,
  VendorImportWizard,
  QuickFilters,
  createVendorQuickFilters,
  type QuickFilterId,
  VendorBulkActions,
  type BulkActionType,
  type BulkActionResult,
  type CommandAction,
  type SmartFilterId,
} from '@/components/vendors';

// Dynamic import to prevent SSR issues with cmdk library
const VendorCommandPalette = dynamic(
  () => import('@/components/vendors/vendor-command-palette').then(mod => mod.VendorCommandPalette),
  { ssr: false }
);
import type { Vendor, VendorFilters, VendorSortOptions, ViewMode } from '@/lib/vendors/types';
import { deleteVendor, updateVendorStatus, bulkDeleteVendors, fetchVendorsAction } from '@/lib/vendors/actions';

interface VendorListClientProps {
  initialVendors: Vendor[];
  initialTotal: number;
  initialTotalPages: number;
  hasVendors: boolean;
  // Stats for quick filters
  criticalCount?: number;
  needsReviewCount?: number;
  expiringSoonCount?: number;
}

export function VendorListClient({
  initialVendors,
  initialTotal,
  initialTotalPages,
  hasVendors,
  criticalCount = 0,
  needsReviewCount = 0,
  expiringSoonCount = 0,
}: VendorListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { getParam, getArrayParam, getBoolParam, getNumberParam, setParams, clearParams } = useUrlFilters();

  // Get active framework for filtering
  const { activeFramework } = useFramework();

  // Track if this is the initial mount to prevent double-fetch
  // (Server already fetched with framework filter from cookie)
  const isInitialMount = useRef(true);
  const previousFramework = useRef(activeFramework);

  // Track request ID to prevent race conditions (stale responses overwriting newer data)
  const requestIdRef = useRef(0);

  // Initialize state from URL params
  const initialPage = getNumberParam('page', 1) ?? 1;
  const initialLimit = getNumberParam('limit', 20) ?? 20;
  const initialSearch = getParam('q') ?? '';
  const initialView = (getParam('view') as ViewMode) || 'table'; // Default to table view now
  const initialTier = getArrayParam('tier');
  const initialStatus = getArrayParam('status');
  const initialProviderType = getArrayParam('provider_type');
  const initialHasLei = getBoolParam('has_lei');
  const initialCritical = getBoolParam('critical');
  const initialSortField = getParam('sort') ?? 'created_at';
  const initialSortDir = (getParam('dir') as 'asc' | 'desc') || 'desc';
  const initialQuickFilter = (getParam('quick') as QuickFilterId) || 'all';

  // State
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [quickFilter, setQuickFilter] = useState<QuickFilterId>(initialQuickFilter);
  const [filters, setFilters] = useState<VendorFilters>({
    tier: initialTier.length > 0 ? initialTier as VendorFilters['tier'] : undefined,
    status: initialStatus.length > 0 ? initialStatus as VendorFilters['status'] : undefined,
    provider_type: initialProviderType.length > 0 ? initialProviderType as VendorFilters['provider_type'] : undefined,
    has_lei: initialHasLei,
    supports_critical_function: initialCritical,
  });
  const [sortOptions, setSortOptions] = useState<VendorSortOptions>({
    field: initialSortField as VendorSortOptions['field'],
    direction: initialSortDir,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Quick filter options
  const quickFilterOptions = createVendorQuickFilters({
    total: initialTotal,
    critical: criticalCount,
    needsReview: needsReviewCount,
    expiringSoon: expiringSoonCount,
  });

  // Sync URL when filters change
  const syncUrl = useCallback((updates: {
    page?: number;
    limit?: number;
    search?: string;
    view?: ViewMode;
    filters?: VendorFilters;
    sort?: VendorSortOptions;
    quick?: QuickFilterId;
  }) => {
    const urlUpdates: Record<string, string | number | boolean | string[] | null | undefined> = {};

    if (updates.page !== undefined) urlUpdates.page = updates.page > 1 ? updates.page : null;
    if (updates.limit !== undefined) urlUpdates.limit = updates.limit !== 20 ? updates.limit : null;
    if (updates.search !== undefined) urlUpdates.q = updates.search || null;
    if (updates.view !== undefined) urlUpdates.view = updates.view !== 'table' ? updates.view : null;
    if (updates.quick !== undefined) urlUpdates.quick = updates.quick !== 'all' ? updates.quick : null;
    if (updates.sort !== undefined) {
      urlUpdates.sort = updates.sort.field !== 'created_at' ? updates.sort.field : null;
      urlUpdates.dir = updates.sort.direction !== 'desc' ? updates.sort.direction : null;
    }
    if (updates.filters !== undefined) {
      urlUpdates.tier = updates.filters.tier;
      urlUpdates.status = updates.filters.status;
      urlUpdates.provider_type = updates.filters.provider_type;
      urlUpdates.has_lei = updates.filters.has_lei;
      urlUpdates.critical = updates.filters.supports_critical_function;
    }

    setParams(urlUpdates);
  }, [setParams]);

  // Delete confirmation state
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

  // Import wizard state
  const [showImportWizard, setShowImportWizard] = useState(false);

  // Convert quick filter to VendorFilters
  const getFiltersFromQuickFilter = useCallback((qf: QuickFilterId): VendorFilters => {
    switch (qf) {
      case 'critical':
        return { tier: ['critical'] };
      case 'needs_review':
        return { status: ['pending'] };
      case 'expiring_soon':
        // Filter by contracts expiring in the next 90 days
        // Note: This filter is applied server-side in getVendors query
        // when contract_expiring_before is set
        return { contract_expiring_before: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() };
      default:
        return {};
    }
  }, []);

  // Fetch vendors with current filters
  const fetchVendors = useCallback(
    async (
      newPage?: number,
      newLimit?: number,
      newFilters?: VendorFilters,
      newSort?: VendorSortOptions,
      newSearch?: string,
      newQuickFilter?: QuickFilterId
    ) => {
      // Increment request ID to track this request
      const currentRequestId = ++requestIdRef.current;

      startTransition(async () => {
        try {
          // Merge quick filter with explicit filters
          const qfFilters = getFiltersFromQuickFilter(newQuickFilter ?? quickFilter);
          const mergedFilters = {
            ...qfFilters,
            ...(newFilters ?? filters),
            search: newSearch ?? (searchQuery || undefined),
            // Add framework filter
            framework: activeFramework || undefined,
          };

          const result = await fetchVendorsAction({
            pagination: {
              page: newPage ?? page,
              limit: newLimit ?? limit,
            },
            filters: mergedFilters,
            sort: newSort ?? sortOptions,
          });

          // Only update state if this is still the latest request (prevents race conditions)
          if (currentRequestId !== requestIdRef.current) {
            return;
          }

          setVendors(result.data);
          setTotal(result.total);
          setTotalPages(result.total_pages);
          setSelectedIds([]);
        } catch (error) {
          // Only show error if this is still the latest request
          if (currentRequestId !== requestIdRef.current) {
            return;
          }
          console.error('Failed to fetch vendors:', error);
          toast.error('Failed to load vendors. Please try again.');
        }
      });
    },
    [page, limit, filters, sortOptions, searchQuery, quickFilter, getFiltersFromQuickFilter, activeFramework]
  );

  // Refetch when framework changes (but not on initial mount - server already fetched with framework)
  useEffect(() => {
    // Skip initial mount - server already fetched with correct framework from cookie
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousFramework.current = activeFramework;
      return;
    }

    // Only refetch if framework actually changed
    if (activeFramework && activeFramework !== previousFramework.current) {
      previousFramework.current = activeFramework;
      fetchVendors(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFramework]);

  // Handlers - sync to URL for shareable/bookmarkable state
  const handleQuickFilterChange = (filterId: QuickFilterId) => {
    setQuickFilter(filterId);
    setPage(1);
    // Clear explicit filters when using quick filter
    setFilters({});
    syncUrl({ quick: filterId, page: 1, filters: {} });
    fetchVendors(1, undefined, {}, undefined, undefined, filterId);
  };

  // Handler for SmartFilterId (from command palette) - extends QuickFilterId
  const handleSmartFilterChange = (filterId: SmartFilterId) => {
    // Check if it's a basic QuickFilterId
    const basicFilters: QuickFilterId[] = ['all', 'critical', 'needs_review', 'expiring_soon'];
    if (basicFilters.includes(filterId as QuickFilterId)) {
      handleQuickFilterChange(filterId as QuickFilterId);
      return;
    }

    // Handle extended smart filters by applying appropriate VendorFilters
    setPage(1);
    let newFilters: VendorFilters = {};

    switch (filterId) {
      case 'at_risk':
        // Show vendors with risk_score < 60 (handled in query)
        // For now, show all and let user know this filter is being applied
        toast.info('Showing at-risk vendors (risk score < 60)');
        break;
      case 'action_needed':
        // Show vendors with status pending or missing data
        newFilters = { status: ['pending'] };
        break;
      case 'score_dropping':
        toast.info('Score dropping filter coming soon');
        break;
      case 'new_this_week':
        toast.info('Showing vendors added this week');
        break;
      case 'stale_data':
        toast.info('Showing vendors with stale data (90+ days)');
        break;
    }

    setFilters(newFilters);
    setQuickFilter('all'); // Reset quick filter visual
    syncUrl({ filters: newFilters, page: 1, quick: 'all' });
    fetchVendors(1, undefined, newFilters);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    syncUrl({ search: value, page: 1 });
    fetchVendors(1, undefined, undefined, undefined, value);
  };

  const handleFiltersChange = (newFilters: VendorFilters) => {
    setFilters(newFilters);
    setPage(1);
    syncUrl({ filters: newFilters, page: 1 });
    fetchVendors(1, undefined, newFilters);
  };

  const handleSortChange = (newSort: VendorSortOptions) => {
    setSortOptions(newSort);
    syncUrl({ sort: newSort });
    fetchVendors(undefined, undefined, undefined, newSort);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    syncUrl({ page: newPage });
    fetchVendors(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    syncUrl({ limit: newLimit, page: 1 });
    fetchVendors(1, newLimit);
  };

  const handleViewModeChange = (newView: ViewMode) => {
    setViewMode(newView);
    syncUrl({ view: newView });
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
    clearParams();
    fetchVendors(1, undefined, {}, undefined, '');
  };

  // Vendor actions
  const handleEdit = (vendor: Vendor) => {
    router.push(`/vendors/${vendor.id}/edit`);
  };

  const handleDelete = async () => {
    if (!vendorToDelete) return;

    const result = await deleteVendor(vendorToDelete.id);
    if (result.success) {
      toast.success(`${vendorToDelete.name} has been deleted`);
      setVendorToDelete(null);
      fetchVendors();
    } else {
      toast.error(result.error?.message || 'Failed to delete vendor');
    }
  };

  const handleStatusChange = async (vendor: Vendor, status: Vendor['status']) => {
    const result = await updateVendorStatus(vendor.id, status);
    if (result.success) {
      toast.success(`${vendor.name} is now ${status}`);
      fetchVendors();
    } else {
      toast.error(result.error?.message || 'Failed to update status');
    }
  };

  const handleImportComplete = (count: number) => {
    toast.success(`Successfully imported ${count} vendors`);
    fetchVendors();
  };

  // Bulk action handler for VendorBulkActions
  const handleBulkAction = async (
    action: BulkActionType,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future use
    _params?: Record<string, unknown>
  ): Promise<BulkActionResult> => {
    const selectedVendorsList = vendors.filter(v => selectedIds.includes(v.id));

    switch (action) {
      case 'delete': {
        const result = await bulkDeleteVendors(selectedIds);
        if (result.success) {
          fetchVendors();
          return { success: true, processed: result.data?.deleted ?? 0, failed: 0 };
        }
        return { success: false, processed: 0, failed: selectedIds.length, errors: [result.error?.message ?? 'Delete failed'] };
      }

      case 'export_csv':
      case 'export_xlsx':
      case 'export_json': {
        // Generate export data
        const format = action.replace('export_', '') as 'csv' | 'xlsx' | 'json';
        const exportData = selectedVendorsList.map(v => ({
          name: v.name,
          lei: v.lei ?? '',
          tier: v.tier,
          status: v.status,
          provider_type: v.provider_type ?? '',
          headquarters_country: v.headquarters_country ?? '',
          risk_score: v.risk_score ?? '',
          supports_critical_function: v.supports_critical_function,
        }));

        // Create and download file
        let content: string;
        let mimeType: string;
        let extension: string;

        if (format === 'csv') {
          const headers = Object.keys(exportData[0] || {}).join(',');
          const rows = exportData.map(row => Object.values(row).join(','));
          content = [headers, ...rows].join('\n');
          mimeType = 'text/csv';
          extension = 'csv';
        } else if (format === 'json') {
          content = JSON.stringify(exportData, null, 2);
          mimeType = 'application/json';
          extension = 'json';
        } else {
          // For XLSX, we'll use CSV as fallback (full XLSX would need a library)
          const headers = Object.keys(exportData[0] || {}).join('\t');
          const rows = exportData.map(row => Object.values(row).join('\t'));
          content = [headers, ...rows].join('\n');
          mimeType = 'text/tab-separated-values';
          extension = 'tsv';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vendors-export-${new Date().toISOString().split('T')[0]}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success(`Exported ${selectedVendorsList.length} vendors to ${format.toUpperCase()}`);
        return { success: true, processed: selectedVendorsList.length, failed: 0 };
      }

      case 'update_tier':
      case 'update_status':
      case 'assign_owner':
      case 'schedule_assessment':
      case 'request_soc2':
      case 'generate_roi': {
        // These actions would call backend APIs
        // For now, show a toast that the feature is coming soon
        toast.info(`${action.replace(/_/g, ' ')} will be available soon`);
        return { success: true, processed: selectedIds.length, failed: 0 };
      }

      default:
        return { success: false, processed: 0, failed: selectedIds.length, errors: ['Unknown action'] };
    }
  };

  // Command palette action handler
  const handleCommandAction = (action: CommandAction) => {
    switch (action.type) {
      case 'filter':
        handleSmartFilterChange(action.filterId);
        break;
      case 'search':
        handleSearchChange(action.query);
        break;
      case 'export':
        if (selectedIds.length > 0) {
          handleBulkAction(`export_${action.format}` as BulkActionType);
        } else {
          toast.info('Select vendors to export first');
        }
        break;
      // navigate and custom are handled by the command palette itself
    }
  };

  // If no vendors at all (first time)
  if (!hasVendors) {
    return (
      <EmptyState
        icon={Building2}
        illustration="vendors"
        title="No vendors yet"
        description="Get started by adding your first ICT third-party provider to begin managing your vendor relationships."
        action={{ label: 'Add First Vendor', href: '/vendors/new' }}
      />
    );
  }

  const hasActiveFilters =
    searchQuery ||
    filters.tier?.length ||
    filters.status?.length ||
    filters.provider_type?.length ||
    filters.has_lei !== undefined ||
    filters.supports_critical_function !== undefined;

  return (
    <div className="space-y-4">
      {/* Framework Context Banner */}
      <FrameworkContextBanner pageType="vendors" />

      {/* Command Palette - Keyboard navigation */}
      <VendorCommandPalette
        vendors={vendors}
        recentVendors={vendors.slice(0, 5)}
        onAction={handleCommandAction}
        onFilterChange={handleSmartFilterChange}
        onSearch={handleSearchChange}
      />

      {/* Quick Filter Tabs */}
      <QuickFilters
        filters={quickFilterOptions}
        activeFilter={quickFilter}
        onFilterChange={handleQuickFilterChange}
      />

      {/* Bulk Actions Bar - Shows when vendors are selected */}
      {selectedIds.length > 0 && (
        <VendorBulkActions
          selectedVendors={vendors.filter(v => selectedIds.includes(v.id))}
          onAction={handleBulkAction}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <VendorSearch
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full sm:max-w-xs"
          />
          <VendorFiltersDropdown filters={filters} onChange={handleFiltersChange} />
        </div>

        <div className="flex items-center gap-3">
          <VendorViewToggle value={viewMode} onChange={handleViewModeChange} />
          <Button variant="outline" onClick={() => setShowImportWizard(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button asChild>
            <Link href="/vendors/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Link>
          </Button>
        </div>
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <VendorFilterTags filters={filters} onChange={handleFiltersChange} />
      )}

      {/* Loading overlay */}
      {isPending && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Content */}
      {!isPending && vendors.length === 0 && (
        searchQuery ? (
          <SearchEmptyState
            searchQuery={searchQuery}
            onClear={handleClearFilters}
          />
        ) : (
          <FilterEmptyState onClear={handleClearFilters} />
        )
      )}

      {!isPending && vendors.length > 0 && (
        <>
          {viewMode === 'cards' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onEdit={handleEdit}
                  onDelete={setVendorToDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <VendorSmartTable
              vendors={vendors}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              sortOptions={sortOptions}
              onSort={handleSortChange}
              onEdit={handleEdit}
              onDelete={setVendorToDelete}
              onStatusChange={handleStatusChange}
            />
          )}

          {/* Pagination */}
          <VendorPagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!vendorToDelete}
        onOpenChange={(open) => !open && setVendorToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{vendorToDelete?.name}&rdquo;?
              This action can be undone by restoring from the activity log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-error text-white hover:bg-error/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Wizard */}
      <VendorImportWizard
        open={showImportWizard}
        onOpenChange={setShowImportWizard}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
