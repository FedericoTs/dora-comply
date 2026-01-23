'use client';

/**
 * Contracts Client Component
 * Client-side table with filtering, sorting, and pagination
 */

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  MoreHorizontal,
  Eye,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContractWithLifecycle,
  CONTRACT_STATUS_INFO,
  CONTRACT_CRITICALITY_INFO,
  CONTRACT_CATEGORY_INFO,
  CONTRACT_TYPE_INFO,
} from '@/lib/contracts/types';

interface ContractsClientProps {
  contracts: ContractWithLifecycle[];
  total: number;
  currentPage: number;
  filters: {
    status?: string;
    criticality?: string;
    category?: string;
    search?: string;
  };
}

export function ContractsClient({
  contracts,
  total,
  currentPage,
  filters,
}: ContractsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  const updateFilters = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page'); // Reset to page 1 on filter change
      router.push(`/contracts?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(() => {
    updateFilters('search', searchValue || null);
  }, [searchValue, updateFilters]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/contracts?${params.toString()}`);
  };

  return (
    <div className="rounded-lg border bg-card">
      {/* Filters */}
      <div className="p-4 border-b space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status || 'all'}
            onValueChange={(v) => updateFilters('status', v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring">Expiring</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>

          {/* Criticality Filter */}
          <Select
            value={filters.criticality || 'all'}
            onValueChange={(v) => updateFilters('criticality', v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Criticality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select
            value={filters.category || 'all'}
            onValueChange={(v) => updateFilters('category', v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CONTRACT_CATEGORY_INFO).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  {info.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {(filters.status || filters.criticality || filters.category || filters.search) && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Search: {filters.search}
                <button onClick={() => updateFilters('search', null)} className="ml-1 hover:text-error">
                  ×
                </button>
              </Badge>
            )}
            {filters.status && filters.status !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Status: {CONTRACT_STATUS_INFO[filters.status as keyof typeof CONTRACT_STATUS_INFO]?.label}
                <button onClick={() => updateFilters('status', null)} className="ml-1 hover:text-error">
                  ×
                </button>
              </Badge>
            )}
            {filters.criticality && filters.criticality !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Criticality: {CONTRACT_CRITICALITY_INFO[filters.criticality as keyof typeof CONTRACT_CRITICALITY_INFO]?.label}
                <button onClick={() => updateFilters('criticality', null)} className="ml-1 hover:text-error">
                  ×
                </button>
              </Badge>
            )}
            {filters.category && filters.category !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Category: {CONTRACT_CATEGORY_INFO[filters.category as keyof typeof CONTRACT_CATEGORY_INFO]?.label}
                <button onClick={() => updateFilters('category', null)} className="ml-1 hover:text-error">
                  ×
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/contracts')}
              className="text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Alerts</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2" />
                    <p>No contracts found</p>
                    {(filters.status || filters.search) && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => router.push('/contracts')}
                        className="mt-1"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => (
                <TableRow key={contract.id} className="group">
                  <TableCell>
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {contract.contract_ref}
                    </Link>
                    {contract.criticality && (
                      <Badge
                        variant="outline"
                        className={`ml-2 text-xs ${
                          CONTRACT_CRITICALITY_INFO[contract.criticality]?.color || ''
                        }`}
                      >
                        {CONTRACT_CRITICALITY_INFO[contract.criticality]?.label}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <Link
                        href={`/vendors/${contract.vendor_id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {contract.vendor.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {CONTRACT_TYPE_INFO[contract.contract_type]?.label || contract.contract_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={CONTRACT_STATUS_INFO[contract.status]?.color || ''}
                    >
                      {CONTRACT_STATUS_INFO[contract.status]?.label || contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contract.expiry_date ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span
                          className={
                            contract.status === 'expired'
                              ? 'text-error'
                              : contract.status === 'expiring'
                              ? 'text-warning'
                              : ''
                          }
                        >
                          {new Date(contract.expiry_date).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contract.annual_value ? (
                      <span className="font-medium">
                        {new Intl.NumberFormat('de-DE', {
                          style: 'currency',
                          currency: contract.currency || 'EUR',
                          maximumFractionDigits: 0,
                        }).format(contract.annual_value)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {(contract.active_alerts_count || 0) > 0 && (
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {contract.active_alerts_count}
                        </Badge>
                      )}
                      {(contract.pending_renewals_count || 0) > 0 && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          {contract.pending_renewals_count}
                        </Badge>
                      )}
                      {!contract.active_alerts_count && !contract.pending_renewals_count && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/contracts/${contract.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/vendors/${contract.vendor_id}`}>
                            <Building2 className="h-4 w-4 mr-2" />
                            View Vendor
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-error">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, total)} of {total} contracts
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
