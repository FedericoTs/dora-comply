'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  FileText,
  BarChart3,
  Pencil,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TierBadge } from '@/components/ui/tier-badge';
import { GradeBadge, scoreToGrade } from '@/components/ui/grade-badge';
import { TrendArrow } from '@/components/ui/trend-arrow';
import { ProgressMini } from '@/components/ui/progress-mini';
import { cn } from '@/lib/utils';
import type { Vendor, VendorSortOptions } from '@/lib/vendors/types';
import { PROVIDER_TYPE_LABELS } from '@/lib/vendors/types';

// ============================================================================
// Types
// ============================================================================

interface VendorSmartTableProps {
  vendors: Vendor[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  sortOptions?: VendorSortOptions;
  onSort?: (sort: VendorSortOptions) => void;
  onEdit?: (vendor: Vendor) => void;
  onDelete?: (vendor: Vendor) => void;
  onStatusChange?: (vendor: Vendor, status: Vendor['status']) => void;
}

// ============================================================================
// Helper Components
// ============================================================================

function SortableHeader({
  field,
  sortOptions,
  onSort,
  children,
  className,
}: {
  field: VendorSortOptions['field'];
  sortOptions?: VendorSortOptions;
  onSort: (field: VendorSortOptions['field']) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const isActive = sortOptions?.field === field;
  const isAsc = sortOptions?.direction === 'asc';

  return (
    <button
      type="button"
      className={cn(
        'flex items-center gap-1 text-left font-medium text-muted-foreground hover:text-foreground transition-colors',
        isActive && 'text-foreground',
        className
      )}
      onClick={() => onSort(field)}
    >
      {children}
      <span className={cn('ml-1', !isActive && 'opacity-0')}>
        {isAsc ? '↑' : '↓'}
      </span>
    </button>
  );
}

function VendorNameCell({ vendor }: { vendor: Vendor }) {
  const providerLabel = vendor.provider_type
    ? PROVIDER_TYPE_LABELS[vendor.provider_type]
    : null;

  return (
    <div className="flex flex-col gap-0.5">
      <Link
        href={`/vendors/${vendor.id}`}
        className="font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
      >
        {vendor.name}
        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      </Link>
      {providerLabel && (
        <span className="text-xs text-muted-foreground">{providerLabel}</span>
      )}
    </div>
  );
}

function RiskCell({ vendor }: { vendor: Vendor }) {
  const hasRisk = vendor.risk_score !== null && vendor.risk_score !== undefined;
  const hasGrade = vendor.external_risk_grade;

  if (!hasRisk && !hasGrade) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  // Use external grade if available, otherwise calculate from risk_score
  const grade = hasGrade || (hasRisk ? scoreToGrade(vendor.risk_score!) : null);

  // Calculate trend (mock: based on score delta, in real app would come from DB)
  // For now, we'll use a derived trend based on score positioning
  const trend = vendor.risk_score ? (50 - vendor.risk_score) / 10 : 0;

  return (
    <div className="flex items-center gap-2">
      {grade && <GradeBadge grade={grade} size="sm" />}
      {hasRisk && <TrendArrow value={Math.round(trend)} size="sm" invertColors />}
    </div>
  );
}

function DoraComplianceCell({ vendor }: { vendor: Vendor }) {
  // Calculate DORA compliance score based on available data
  // In production, this would come from a computed field
  const hasLei = !!vendor.lei;
  const hasAssessment = !!vendor.last_assessment_date;
  const hasCriticalFunctions = vendor.critical_functions?.length > 0;

  // Simple compliance score calculation
  let complianceScore = 0;
  if (hasLei) complianceScore += 35;
  if (hasAssessment) complianceScore += 35;
  if (hasCriticalFunctions || !vendor.supports_critical_function)
    complianceScore += 30;

  // Determine status icon
  let StatusIcon = AlertCircle;
  let statusColor = 'text-warning';
  if (complianceScore >= 85) {
    StatusIcon = CheckCircle2;
    statusColor = 'text-success';
  } else if (complianceScore < 40) {
    StatusIcon = XCircle;
    statusColor = 'text-error';
  }

  return (
    <div className="flex items-center gap-2">
      <ProgressMini
        value={complianceScore}
        size="sm"
        showValue
        width="w-16"
      />
      <StatusIcon className={cn('h-4 w-4', statusColor)} />
    </div>
  );
}

function ActionsCell({
  vendor,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  vendor: Vendor;
  onEdit?: (vendor: Vendor) => void;
  onDelete?: (vendor: Vendor) => void;
  onStatusChange?: (vendor: Vendor, status: Vendor['status']) => void;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Quick action: Documents */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/vendors/${vendor.id}?tab=documents`);
        }}
        title="View Documents"
      >
        <FileText className="h-4 w-4" />
      </Button>

      {/* Quick action: Analysis */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/vendors/${vendor.id}?tab=compliance`);
        }}
        title="View Analysis"
      >
        <BarChart3 className="h-4 w-4" />
      </Button>

      {/* More actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/vendors/${vendor.id}`}>View Details</Link>
          </DropdownMenuItem>
          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(vendor)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Vendor
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {onStatusChange && vendor.status !== 'active' && (
            <DropdownMenuItem onClick={() => onStatusChange(vendor, 'active')}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
              Mark as Active
            </DropdownMenuItem>
          )}
          {onStatusChange && vendor.status !== 'inactive' && (
            <DropdownMenuItem onClick={() => onStatusChange(vendor, 'inactive')}>
              <XCircle className="mr-2 h-4 w-4 text-muted-foreground" />
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
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Vendor
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function VendorSmartTable({
  vendors,
  selectedIds = [],
  onSelectionChange,
  sortOptions,
  onSort,
  onEdit,
  onDelete,
  onStatusChange,
}: VendorSmartTableProps) {
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
        sortOptions?.field === field && sortOptions.direction === 'asc'
          ? 'desc'
          : 'asc';
      onSort({ field, direction: newDirection });
    }
  };

  if (vendors.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {onSelectionChange && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            <TableHead className="min-w-[200px]">
              {onSort ? (
                <SortableHeader
                  field="name"
                  sortOptions={sortOptions}
                  onSort={handleSort}
                >
                  Vendor
                </SortableHeader>
              ) : (
                'Vendor'
              )}
            </TableHead>
            <TableHead className="w-[100px]">
              {onSort ? (
                <SortableHeader
                  field="tier"
                  sortOptions={sortOptions}
                  onSort={handleSort}
                >
                  Tier
                </SortableHeader>
              ) : (
                'Tier'
              )}
            </TableHead>
            <TableHead className="w-[120px]">
              {onSort ? (
                <SortableHeader
                  field="risk_score"
                  sortOptions={sortOptions}
                  onSort={handleSort}
                >
                  Risk
                </SortableHeader>
              ) : (
                'Risk'
              )}
            </TableHead>
            <TableHead className="hidden md:table-cell w-[160px]">
              DORA Status
            </TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((vendor) => {
            const isSelected = selectedIds.includes(vendor.id);
            const tierValue =
              vendor.tier === 'critical'
                ? 1
                : vendor.tier === 'important'
                ? 2
                : 3;

            return (
              <TableRow
                key={vendor.id}
                className={cn(
                  'group cursor-pointer',
                  isSelected && 'bg-primary/5'
                )}
              >
                {onSelectionChange && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
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
                  <VendorNameCell vendor={vendor} />
                </TableCell>
                <TableCell>
                  <TierBadge
                    tier={tierValue}
                    ctpp={vendor.is_ctpp}
                    showLabel
                  />
                </TableCell>
                <TableCell>
                  <RiskCell vendor={vendor} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <DoraComplianceCell vendor={vendor} />
                </TableCell>
                <TableCell>
                  <ActionsCell
                    vendor={vendor}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
