import Link from 'next/link';
import { Building2, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VendorEmptyStateProps {
  type: 'no-vendors' | 'no-results' | 'filtered';
  searchQuery?: string;
  onClearFilters?: () => void;
}

export function VendorEmptyState({
  type,
  searchQuery,
  onClearFilters,
}: VendorEmptyStateProps) {
  if (type === 'no-vendors') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No vendors yet</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Get started by adding your first ICT third-party provider to begin
          managing your vendor relationships.
        </p>
        <Button asChild className="mt-6">
          <Link href="/vendors/new">
            <Plus className="mr-2 h-4 w-4" />
            Add First Vendor
          </Link>
        </Button>
      </div>
    );
  }

  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No vendors found</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          No vendors match &ldquo;{searchQuery}&rdquo;. Try a different search
          term or add a new vendor.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={onClearFilters}>
            Clear Search
          </Button>
          <Button asChild>
            <Link href="/vendors/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // filtered
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Filter className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No matching vendors</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        No vendors match your current filters. Try adjusting your filter
        criteria.
      </p>
      <Button variant="outline" className="mt-6" onClick={onClearFilters}>
        Clear Filters
      </Button>
    </div>
  );
}
