'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MoreVertical, ArrowUpDown, CheckCircle2, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Vendor, VendorSortOptions } from '@/lib/vendors/types';
import {
  TIER_INFO,
  STATUS_INFO,
  PROVIDER_TYPE_LABELS,
  getRiskLevel,
} from '@/lib/vendors/types';
import { getCountryFlag } from '@/lib/external/gleif';

interface VendorTableProps {
  vendors: Vendor[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  sortOptions?: VendorSortOptions;
  onSort?: (sort: VendorSortOptions) => void;
  onEdit?: (vendor: Vendor) => void;
  onDelete?: (vendor: Vendor) => void;
  onStatusChange?: (vendor: Vendor, status: Vendor['status']) => void;
}

export function VendorTable({
  vendors,
  selectedIds = [],
  onSelectionChange,
  sortOptions,
  onSort,
  onEdit,
  onDelete,
  onStatusChange,
}: VendorTableProps) {
  const allSelected = vendors.length > 0 && selectedIds.length === vendors.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < vendors.length;

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? vendors.map((v) => v.id) : []);
    }
  };

  const handleSelectOne = (vendorId: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedIds, vendorId]);
      } else {
        onSelectionChange(selectedIds.filter((id) => id !== vendorId));
      }
    }
  };

  const handleSort = (field: VendorSortOptions['field']) => {
    if (onSort) {
      const newDirection =
        sortOptions?.field === field && sortOptions.direction === 'asc' ? 'desc' : 'asc';
      onSort({ field, direction: newDirection });
    }
  };

  const SortableHeader = ({
    field,
    children,
  }: {
    field: VendorSortOptions['field'];
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  const riskColors: Record<string, string> = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-orange-500',
    critical: 'text-error',
  };

  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No vendors found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {onSelectionChange && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            <TableHead className="min-w-[200px]">
              {onSort ? <SortableHeader field="name">Vendor</SortableHeader> : 'Vendor'}
            </TableHead>
            <TableHead className="w-[100px]">
              {onSort ? <SortableHeader field="tier">Tier</SortableHeader> : 'Tier'}
            </TableHead>
            <TableHead className="w-[100px]">
              {onSort ? <SortableHeader field="status">Status</SortableHeader> : 'Status'}
            </TableHead>
            <TableHead className="hidden md:table-cell">Provider Type</TableHead>
            <TableHead className="hidden lg:table-cell w-[80px]">Country</TableHead>
            <TableHead className="hidden xl:table-cell w-[100px]">
              {onSort ? <SortableHeader field="risk_score">Risk</SortableHeader> : 'Risk'}
            </TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((vendor) => {
            const tierInfo = TIER_INFO[vendor.tier];
            const statusInfo = STATUS_INFO[vendor.status];
            const riskLevel = getRiskLevel(vendor.risk_score);
            const isSelected = selectedIds.includes(vendor.id);

            return (
              <TableRow
                key={vendor.id}
                className={cn(
                  'group',
                  isSelected && 'bg-muted/50'
                )}
              >
                {onSelectionChange && (
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleSelectOne(vendor.id, checked as boolean)
                      }
                      aria-label={`Select ${vendor.name}`}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <Link
                      href={`/vendors/${vendor.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                    >
                      {vendor.name}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </Link>
                    {vendor.lei && (
                      <span className="text-xs font-mono text-muted-foreground">
                        {vendor.lei}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      vendor.tier === 'critical'
                        ? 'destructive'
                        : vendor.tier === 'important'
                        ? 'default'
                        : 'secondary'
                    }
                    className="text-xs"
                  >
                    {tierInfo.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('text-xs gap-1', statusInfo.color)}>
                    {vendor.status === 'active' && <CheckCircle2 className="h-3 w-3" />}
                    {vendor.status === 'pending' && <Clock className="h-3 w-3" />}
                    {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {vendor.provider_type
                    ? PROVIDER_TYPE_LABELS[vendor.provider_type]
                    : '-'}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {vendor.headquarters_country ? (
                    <span title={vendor.headquarters_country}>
                      {getCountryFlag(vendor.headquarters_country)}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {vendor.risk_score !== null && riskLevel ? (
                    <span className={cn('font-medium', riskColors[riskLevel])}>
                      {vendor.risk_score}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/vendors/${vendor.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(vendor)}>
                          Edit Vendor
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {onStatusChange && vendor.status !== 'active' && (
                        <DropdownMenuItem onClick={() => onStatusChange(vendor, 'active')}>
                          Mark as Active
                        </DropdownMenuItem>
                      )}
                      {onStatusChange && vendor.status !== 'inactive' && (
                        <DropdownMenuItem onClick={() => onStatusChange(vendor, 'inactive')}>
                          Mark as Inactive
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(vendor)}
                            className="text-error focus:text-error"
                          >
                            Delete Vendor
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
