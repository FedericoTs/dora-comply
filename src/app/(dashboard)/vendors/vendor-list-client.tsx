'use client';

/**
 * MINIMAL VENDOR LIST CLIENT FOR DEBUGGING
 *
 * Stripped down to isolate React error #310.
 * Removed: VendorCommandPalette, QuickFilters, VendorBulkActions, FrameworkContextBanner
 */

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  VendorSmartTable,
  VendorEmptyState,
} from '@/components/vendors';
import type { Vendor, VendorSortOptions } from '@/lib/vendors/types';

interface VendorListClientProps {
  initialVendors: Vendor[];
  initialTotal: number;
  initialTotalPages: number;
  hasVendors: boolean;
  criticalCount?: number;
  needsReviewCount?: number;
  expiringSoonCount?: number;
}

export function VendorListClient({
  initialVendors,
  initialTotal,
  hasVendors,
}: VendorListClientProps) {
  // MINIMAL state - just what's needed for the table
  const [vendors] = useState<Vendor[]>(initialVendors);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortOptions, setSortOptions] = useState<VendorSortOptions>({
    field: 'created_at',
    direction: 'desc',
  });

  // If no vendors at all (first time)
  if (!hasVendors) {
    return <VendorEmptyState type="no-vendors" />;
  }

  if (vendors.length === 0) {
    return <VendorEmptyState type="filtered" />;
  }

  return (
    <div className="space-y-4">
      {/* DEBUG indicator */}
      <div className="p-2 bg-amber-100 text-amber-800 rounded text-xs font-mono">
        [DEBUG] Minimal VendorListClient - {initialTotal} vendors loaded
      </div>

      {/* Minimal Toolbar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {vendors.length} of {initialTotal} vendors
        </div>
        <Button asChild>
          <Link href="/vendors/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Link>
        </Button>
      </div>

      {/* Table - using VendorSmartTable */}
      <VendorSmartTable
        vendors={vendors}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        sortOptions={sortOptions}
        onSort={setSortOptions}
        onEdit={(v) => window.location.href = `/vendors/${v.id}/edit`}
        onDelete={() => {}}
        onStatusChange={() => {}}
      />
    </div>
  );
}
