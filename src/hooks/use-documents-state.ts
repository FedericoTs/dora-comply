'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  type DocumentWithVendor,
  type PaginatedResult,
  type DocumentType,
  type StatusFilter,
  type SortField,
  type SortDirection,
  type ViewMode,
  type GroupBy,
  DOCUMENT_TYPE_INFO,
  getDocumentStatus,
} from '@/lib/documents/types';
import { fetchDocumentsAction } from '@/lib/documents/actions';

interface SimpleVendor {
  id: string;
  name: string;
}

interface UseDocumentsStateProps {
  initialData: PaginatedResult<DocumentWithVendor>;
}

export function useDocumentsState({ initialData }: UseDocumentsStateProps) {
  const router = useRouter();

  // Core state
  const [documents, setDocuments] = useState(initialData.data);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(initialData.page);
  const [isLoading, setIsLoading] = useState(false);

  // Filter state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilters, setTypeFilters] = useState<DocumentType[]>([]);
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Track processing document IDs for notifications
  const processingIdsRef = useRef<Set<string>>(new Set());

  const totalPages = Math.ceil(total / initialData.limit);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilters.length > 0) count++;
    if (vendorFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (debouncedSearch) count++;
    return count;
  }, [typeFilters, vendorFilter, statusFilter, debouncedSearch]);

  // Fetch documents
  const fetchDocuments = useCallback(async (newPage: number = page) => {
    setIsLoading(true);
    try {
      const result = await fetchDocumentsAction({
        filters: {
          search: debouncedSearch || undefined,
          type: typeFilters.length > 0 ? typeFilters : undefined,
          vendor_id: vendorFilter !== 'all' ? vendorFilter : undefined,
        },
        pagination: { page: newPage, limit: initialData.limit },
        sort: { field: sortField === 'vendor' ? 'created_at' : sortField, direction: sortDirection },
      });
      setDocuments(result.data);
      setTotal(result.total);
      setPage(result.page);
      setSelectedIds(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, typeFilters, vendorFilter, sortField, sortDirection, initialData.limit]);

  // Fetch when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== '') {
      fetchDocuments(1);
    }
  }, [debouncedSearch, fetchDocuments]);

  // Poll for status updates when documents are processing
  useEffect(() => {
    const processingDocs = documents.filter(
      d => d.parsing_status === 'pending' || d.parsing_status === 'processing'
    );

    const currentProcessingIds = new Set(processingDocs.map(d => d.id));

    if (processingDocs.length === 0) {
      processingIdsRef.current = new Set();
      return;
    }

    const pollInterval = setInterval(async () => {
      const result = await fetchDocumentsAction({
        filters: {
          search: debouncedSearch || undefined,
          type: typeFilters.length > 0 ? typeFilters : undefined,
          vendor_id: vendorFilter !== 'all' ? vendorFilter : undefined,
        },
        pagination: { page, limit: initialData.limit },
        sort: { field: sortField === 'vendor' ? 'created_at' : sortField, direction: sortDirection },
      });

      const previouslyProcessing = processingIdsRef.current;
      const newlyCompleted = result.data.filter(
        d => previouslyProcessing.has(d.id) && d.parsing_status === 'completed'
      );
      const newlyFailed = result.data.filter(
        d => previouslyProcessing.has(d.id) && d.parsing_status === 'failed'
      );

      newlyCompleted.forEach(doc => {
        const confidence = doc.parsing_confidence
          ? ` (${Math.round(doc.parsing_confidence * 100)}% confidence)`
          : '';
        toast.success('AI Analysis Complete', {
          description: `${doc.filename} has been analyzed${confidence}`,
          action: {
            label: 'View',
            onClick: () => router.push(`/documents/${doc.id}`),
          },
        });
      });

      newlyFailed.forEach(doc => {
        toast.error('AI Analysis Failed', {
          description: doc.parsing_error || `Failed to analyze ${doc.filename}`,
        });
      });

      setDocuments(result.data);
      setTotal(result.total);

      const stillProcessing = result.data.filter(
        d => d.parsing_status === 'pending' || d.parsing_status === 'processing'
      );
      processingIdsRef.current = new Set(stillProcessing.map(d => d.id));
    }, 5000);

    processingIdsRef.current = currentProcessingIds;

    return () => clearInterval(pollInterval);
  }, [documents, debouncedSearch, typeFilters, vendorFilter, page, sortField, sortDirection, initialData.limit, router]);

  // Filter documents by status (client-side for status)
  const filteredDocuments = useMemo(() => {
    if (statusFilter === 'all') return documents;
    return documents.filter(doc => getDocumentStatus(doc) === statusFilter);
  }, [documents, statusFilter]);

  // Group documents
  const groupedDocuments = useMemo(() => {
    if (groupBy === 'none') return { ungrouped: filteredDocuments };

    const groups: Record<string, DocumentWithVendor[]> = {};

    filteredDocuments.forEach(doc => {
      let key: string;
      switch (groupBy) {
        case 'vendor':
          key = doc.vendor?.name || 'No Vendor';
          break;
        case 'type':
          key = DOCUMENT_TYPE_INFO[doc.type]?.label || doc.type;
          break;
        case 'status':
          key = getDocumentStatus(doc);
          break;
        default:
          key = 'ungrouped';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    });

    return groups;
  }, [filteredDocuments, groupBy]);

  // Sort within groups
  const sortedGroups = useMemo(() => {
    const sorted: Record<string, DocumentWithVendor[]> = {};

    Object.entries(groupedDocuments).forEach(([key, docs]) => {
      sorted[key] = [...docs].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'filename':
            comparison = a.filename.localeCompare(b.filename);
            break;
          case 'created_at':
            comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            break;
          case 'file_size':
            comparison = a.file_size - b.file_size;
            break;
          case 'type':
            comparison = a.type.localeCompare(b.type);
            break;
          case 'vendor':
            comparison = (a.vendor?.name || '').localeCompare(b.vendor?.name || '');
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    });

    return sorted;
  }, [groupedDocuments, sortField, sortDirection]);

  // Handler functions
  const toggleTypeFilter = useCallback((type: DocumentType) => {
    setTypeFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setTypeFilters([]);
    setVendorFilter('all');
    setStatusFilter('all');
    fetchDocuments(1);
  }, [fetchDocuments]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocuments.map(d => d.id)));
    }
    setSelectAll(!selectAll);
  }, [selectAll, filteredDocuments]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectAll(false);
  }, []);

  return {
    // State
    documents,
    filteredDocuments,
    sortedGroups,
    total,
    page,
    totalPages,
    isLoading,
    limit: initialData.limit,

    // Filter state
    search,
    setSearch,
    debouncedSearch,
    setDebouncedSearch,
    typeFilters,
    vendorFilter,
    setVendorFilter,
    statusFilter,
    setStatusFilter,
    activeFilterCount,

    // Sort state
    sortField,
    sortDirection,
    handleSort,
    setSortDirection,

    // View state
    viewMode,
    setViewMode,
    groupBy,
    setGroupBy,

    // Selection state
    selectedIds,
    selectAll,
    toggleSelect,
    toggleSelectAll,
    clearSelection,

    // Actions
    fetchDocuments,
    toggleTypeFilter,
    clearAllFilters,
    setDocuments,
  };
}

export type DocumentsState = ReturnType<typeof useDocumentsState>;
