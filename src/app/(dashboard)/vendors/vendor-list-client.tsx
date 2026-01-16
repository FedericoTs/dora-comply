'use client';

import { useState, useTransition, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Trash2, Upload } from 'lucide-react';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useFramework } from '@/lib/context/framework-context';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  VendorEmptyState,
  VendorPagination,
  VendorImportWizard,
  QuickFilters,
  createVendorQuickFilters,
  type QuickFilterId,
} from '@/components/vendors';
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
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

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
        // TODO: Add contract expiration filter when available
        return {};
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

          setVendors(result.data);
          setTotal(result.total);
          setTotalPages(result.total_pages);
          setSelectedIds([]);
        } catch (error) {
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

  const handleBulkDelete = async () => {
    const result = await bulkDeleteVendors(selectedIds);
    if (result.success) {
      toast.success(`${result.data?.deleted} vendors deleted`);
      setShowBulkDeleteDialog(false);
      setSelectedIds([]);
      fetchVendors();
    } else {
      toast.error(result.error?.message || 'Failed to delete vendors');
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

  // If no vendors at all (first time)
  if (!hasVendors) {
    return <VendorEmptyState type="no-vendors" />;
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

      {/* Quick Filter Tabs */}
      <QuickFilters
        filters={quickFilterOptions}
        activeFilter={quickFilter}
        onFilterChange={handleQuickFilterChange}
      />

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
          {selectedIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-error hover:text-error"
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedIds.length})
            </Button>
          )}
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
        <VendorEmptyState
          type={searchQuery ? 'no-results' : 'filtered'}
          searchQuery={searchQuery}
          onClearFilters={handleClearFilters}
        />
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

      {/* Bulk Delete Dialog */}
      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} Vendors</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} vendors? This
              action can be undone by restoring from the activity log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-error text-white hover:bg-error/90"
            >
              Delete All
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
