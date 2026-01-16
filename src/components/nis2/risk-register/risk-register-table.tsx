'use client';

import Link from 'next/link';
import { MoreVertical, ArrowUpDown, ExternalLink, AlertTriangle, TrendingDown } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { NIS2Risk } from '@/lib/nis2/types';
import { RiskScoreBadge } from '../shared/risk-level-badge';
import { CategoryBadge } from '../shared/category-badge';
import { StatusBadge } from '../shared/status-badge';
import { TreatmentBadge } from '../shared/treatment-badge';
import { EffectivenessBar } from '../shared/effectiveness-bar';

export type RiskSortField = 'reference_code' | 'title' | 'category' | 'inherent_risk_score' | 'residual_risk_score' | 'status';

export interface RiskSortOptions {
  field: RiskSortField;
  direction: 'asc' | 'desc';
}

interface SortableHeaderProps {
  field: RiskSortField;
  sortOptions?: RiskSortOptions;
  onSort: (field: RiskSortField) => void;
  children: React.ReactNode;
}

function SortableHeader({ field, sortOptions, onSort, children }: SortableHeaderProps) {
  const isActive = sortOptions?.field === field;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 hover:bg-transparent"
      onClick={() => onSort(field)}
    >
      {children}
      <ArrowUpDown className={cn('ml-2 h-4 w-4', isActive && 'text-primary')} />
    </Button>
  );
}

interface RiskRegisterTableProps {
  risks: NIS2Risk[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  sortOptions?: RiskSortOptions;
  onSort?: (sort: RiskSortOptions) => void;
  onEdit?: (risk: NIS2Risk) => void;
  onDelete?: (risk: NIS2Risk) => void;
  onViewDetails?: (risk: NIS2Risk) => void;
}

export function RiskRegisterTable({
  risks,
  selectedIds = [],
  onSelectionChange,
  sortOptions,
  onSort,
  onEdit,
  onDelete,
  onViewDetails,
}: RiskRegisterTableProps) {
  const allSelected = risks.length > 0 && selectedIds.length === risks.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < risks.length;

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? risks.map((r) => r.id) : []);
    }
  };

  const handleSelectOne = (riskId: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedIds, riskId]);
      } else {
        onSelectionChange(selectedIds.filter((id) => id !== riskId));
      }
    }
  };

  const handleSort = (field: RiskSortField) => {
    if (onSort) {
      const newDirection =
        sortOptions?.field === field && sortOptions.direction === 'asc' ? 'desc' : 'asc';
      onSort({ field, direction: newDirection });
    }
  };

  if (risks.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No risks found"
        description="Add your first risk to start building your NIS2 risk register and track mitigation efforts."
        action={{
          label: 'Add Risk',
          href: '/nis2/risk-register/new',
        }}
      />
    );
  }

  return (
    <TooltipProvider>
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
              <TableHead className="w-[100px]">
                {onSort ? (
                  <SortableHeader field="reference_code" sortOptions={sortOptions} onSort={handleSort}>
                    ID
                  </SortableHeader>
                ) : 'ID'}
              </TableHead>
              <TableHead className="min-w-[200px]">
                {onSort ? (
                  <SortableHeader field="title" sortOptions={sortOptions} onSort={handleSort}>
                    Risk
                  </SortableHeader>
                ) : 'Risk'}
              </TableHead>
              <TableHead className="w-[140px]">
                {onSort ? (
                  <SortableHeader field="category" sortOptions={sortOptions} onSort={handleSort}>
                    Category
                  </SortableHeader>
                ) : 'Category'}
              </TableHead>
              <TableHead className="w-[100px] text-center">
                {onSort ? (
                  <SortableHeader field="inherent_risk_score" sortOptions={sortOptions} onSort={handleSort}>
                    Inherent
                  </SortableHeader>
                ) : 'Inherent'}
              </TableHead>
              <TableHead className="w-[100px] text-center">
                {onSort ? (
                  <SortableHeader field="residual_risk_score" sortOptions={sortOptions} onSort={handleSort}>
                    Residual
                  </SortableHeader>
                ) : 'Residual'}
              </TableHead>
              <TableHead className="hidden lg:table-cell w-[120px]">Controls</TableHead>
              <TableHead className="hidden md:table-cell w-[100px]">Treatment</TableHead>
              <TableHead className="w-[100px]">
                {onSort ? (
                  <SortableHeader field="status" sortOptions={sortOptions} onSort={handleSort}>
                    Status
                  </SortableHeader>
                ) : 'Status'}
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {risks.map((risk) => {
              const isSelected = selectedIds.includes(risk.id);
              const hasResidual = risk.residual_risk_score !== null;
              const riskReduction = hasResidual
                ? Math.round(((risk.inherent_risk_score - (risk.residual_risk_score ?? 0)) / risk.inherent_risk_score) * 100)
                : 0;

              return (
                <TableRow
                  key={risk.id}
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
                          handleSelectOne(risk.id, checked as boolean)
                        }
                        aria-label={`Select ${risk.title}`}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <span className="font-mono text-sm text-muted-foreground">
                      {risk.reference_code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Link
                        href={`/nis2/risk-register/${risk.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                      >
                        {risk.title}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </Link>
                      {risk.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {risk.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CategoryBadge category={risk.category} size="sm" />
                  </TableCell>
                  <TableCell className="text-center">
                    <RiskScoreBadge score={risk.inherent_risk_score} size="sm" />
                  </TableCell>
                  <TableCell className="text-center">
                    {hasResidual ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="inline-flex items-center gap-1">
                            <RiskScoreBadge score={risk.residual_risk_score!} size="sm" />
                            {riskReduction > 0 && (
                              <TrendingDown className="h-3 w-3 text-emerald-600" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{riskReduction}% risk reduction from controls</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {risk.control_count !== undefined && risk.control_count > 0 ? (
                      <Tooltip>
                        <TooltipTrigger className="w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4">
                              {risk.control_count}
                            </span>
                            <EffectivenessBar
                              value={risk.combined_effectiveness ?? 0}
                              showPercentage={false}
                              size="sm"
                              className="flex-1"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{risk.control_count} controls, {risk.combined_effectiveness ?? 0}% combined effectiveness</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-muted-foreground">No controls</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {risk.treatment_strategy ? (
                      <TreatmentBadge strategy={risk.treatment_strategy} size="sm" />
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={risk.status} size="sm" />
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
                          <Link href={`/nis2/risk-register/${risk.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        {onViewDetails && (
                          <DropdownMenuItem onClick={() => onViewDetails(risk)}>
                            Quick View
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(risk)}>
                            Edit Risk
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/nis2/risk-register/${risk.id}/controls`}>
                            Manage Controls
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/nis2/risk-register/${risk.id}/assess`}>
                            Reassess Risk
                          </Link>
                        </DropdownMenuItem>
                        {onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(risk)}
                              className="text-error focus:text-error"
                            >
                              Delete Risk
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
    </TooltipProvider>
  );
}
