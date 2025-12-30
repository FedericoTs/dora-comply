'use client';

import { useState, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  VendorTable,
  VendorSearch,
  VendorFiltersDropdown,
  VendorFilterTags,
  VendorViewToggle,
  VendorEmptyState,
  VendorPagination,
} from '@/components/vendors';
import type { Vendor, VendorFilters, VendorSortOptions, ViewMode } from '@/lib/vendors/types';
import { deleteVendor, updateVendorStatus, bulkDeleteVendors, fetchVendorsAction } from '@/lib/vendors/actions';

interface VendorListClientProps {
  initialVendors: Vendor[];
  initialTotal: number;
  initialTotalPages: number;
  hasVendors: boolean;
}

export function VendorListClient({
  initialVendors,
  initialTotal,
  initialTotalPages,
  hasVendors,
}: VendorListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<VendorFilters>({});
  const [sortOptions, setSortOptions] = useState<VendorSortOptions>({
    field: 'created_at',
    direction: 'desc',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Delete confirmation state
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Fetch vendors with current filters
  const fetchVendors = useCallback(
    async (
      newPage?: number,
      newLimit?: number,
      newFilters?: VendorFilters,
      newSort?: VendorSortOptions,
      newSearch?: string
    ) => {
      startTransition(async () => {
        const result = await fetchVendorsAction({
          pagination: {
            page: newPage ?? page,
            limit: newLimit ?? limit,
          },
          filters: {
            ...(newFilters ?? filters),
            search: newSearch ?? (searchQuery || undefined),
          },
          sort: newSort ?? sortOptions,
        });

        setVendors(result.data);
        setTotal(result.total);
        setTotalPages(result.total_pages);
        setSelectedIds([]);
      });
    },
    [page, limit, filters, sortOptions, searchQuery]
  );

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    fetchVendors(1, undefined, undefined, undefined, value);
  };

  const handleFiltersChange = (newFilters: VendorFilters) => {
    setFilters(newFilters);
    setPage(1);
    fetchVendors(1, undefined, newFilters);
  };

  const handleSortChange = (newSort: VendorSortOptions) => {
    setSortOptions(newSort);
    fetchVendors(undefined, undefined, undefined, newSort);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchVendors(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    fetchVendors(1, newLimit);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
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
          <VendorViewToggle value={viewMode} onChange={setViewMode} />
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
            <VendorTable
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
    </div>
  );
}
