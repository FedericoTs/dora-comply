'use client';

import { useState, useCallback, useTransition, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Trash2,
  Eye,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  File,
  Shield,
  Award,
  Bug,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  LayoutList,
  Calendar,
  ArrowUpDown,
  SlidersHorizontal,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { EmptyState, SearchEmptyState, FilterEmptyState, NoDocumentsState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  type DocumentWithVendor,
  type PaginatedResult,
  type DocumentType,
  type ParsingStatus,
  DOCUMENT_TYPE_INFO,
  formatFileSize,
  isDocumentExpiring,
  isDocumentExpired,
} from '@/lib/documents/types';
import {
  uploadDocument,
  deleteDocument,
  getDocumentDownloadUrl,
  fetchDocumentsAction,
} from '@/lib/documents/actions';
import { fetchVendorsAction } from '@/lib/vendors/actions';
import { DocumentParsingStatus, ProcessingIndicator } from '@/components/documents/document-parsing-status';

// ============================================================================
// Types
// ============================================================================

interface SimpleVendor {
  id: string;
  name: string;
}

interface DocumentsClientProps {
  initialData: PaginatedResult<DocumentWithVendor>;
  initialVendors?: SimpleVendor[];
}

type SortField = 'filename' | 'created_at' | 'file_size' | 'type' | 'vendor';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'card';
type GroupBy = 'none' | 'vendor' | 'type' | 'status';
type StatusFilter = 'all' | 'active' | 'expiring' | 'expired' | 'processing' | 'failed';

// ============================================================================
// Constants
// ============================================================================

const documentTypeIcons: Record<DocumentType, React.ElementType> = {
  soc2: Shield,
  iso27001: Award,
  pentest: Bug,
  contract: FileText,
  other: File,
};

const STATUS_OPTIONS: { value: StatusFilter; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'all', label: 'All Status', icon: File, color: 'text-muted-foreground' },
  { value: 'active', label: 'Active', icon: CheckCircle2, color: 'text-success' },
  { value: 'expiring', label: 'Expiring Soon', icon: Clock, color: 'text-warning' },
  { value: 'expired', label: 'Expired', icon: AlertTriangle, color: 'text-destructive' },
  { value: 'processing', label: 'Processing', icon: Loader2, color: 'text-info' },
  { value: 'failed', label: 'Failed', icon: X, color: 'text-destructive' },
];

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'created_at', label: 'Upload Date' },
  { value: 'filename', label: 'Filename' },
  { value: 'file_size', label: 'File Size' },
  { value: 'type', label: 'Document Type' },
  { value: 'vendor', label: 'Vendor Name' },
];

// ============================================================================
// Helper Functions
// ============================================================================

function getDocumentStatus(doc: DocumentWithVendor): StatusFilter {
  if (doc.parsing_status === 'processing' || doc.parsing_status === 'pending') return 'processing';
  if (doc.parsing_status === 'failed') return 'failed';
  if (isDocumentExpired(doc)) return 'expired';
  if (isDocumentExpiring(doc)) return 'expiring';
  return 'active';
}

function getStatusBadge(status: StatusFilter, doc?: DocumentWithVendor) {
  switch (status) {
    case 'expired':
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Expired
        </Badge>
      );
    case 'expiring':
      return (
        <Badge variant="outline" className="gap-1 border-warning text-warning">
          <Clock className="h-3 w-3" />
          Expiring
        </Badge>
      );
    case 'processing':
      // Use enhanced AI analysis indicator for processing documents
      return doc ? (
        <DocumentParsingStatus
          status={doc.parsing_status}
          showTooltip={true}
        />
      ) : (
        <ProcessingIndicator />
      );
    case 'failed':
      return doc ? (
        <DocumentParsingStatus
          status="failed"
          error={doc.parsing_error}
          showTooltip={true}
        />
      ) : (
        <Badge variant="destructive" className="gap-1">
          <X className="h-3 w-3" />
          Failed
        </Badge>
      );
    case 'active':
      // Show analyzed badge for completed docs, active for others
      if (doc?.parsing_status === 'completed') {
        return (
          <DocumentParsingStatus
            status="completed"
            parsedAt={doc.parsed_at}
            confidence={doc.parsing_confidence}
            showTooltip={true}
          />
        );
      }
      return (
        <Badge variant="outline" className="gap-1 border-success text-success">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    default:
      return null;
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function DocumentsClient({ initialData, initialVendors = [] }: DocumentsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Dialog state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithVendor | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<DocumentType>('other');
  const [uploadVendorId, setUploadVendorId] = useState<string>('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Vendors state
  const [vendors, setVendors] = useState<SimpleVendor[]>(initialVendors);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== '') {
      fetchDocuments(1);
    }
  }, [debouncedSearch]);

  // Fetch vendors on mount and when upload dialog opens
  useEffect(() => {
    if ((isUploadOpen || vendorFilter !== 'all') && vendors.length === 0) {
      setIsLoadingVendors(true);
      fetchVendorsAction({ pagination: { page: 1, limit: 500 } })
        .then((result) => {
          setVendors(result.data.map(v => ({ id: v.id, name: v.name })));
        })
        .catch((error) => {
          console.error('Failed to fetch vendors:', error);
        })
        .finally(() => {
          setIsLoadingVendors(false);
        });
    }
  }, [isUploadOpen, vendorFilter, vendors.length]);

  // Track processing document IDs for notifications
  const processingIdsRef = useRef<Set<string>>(new Set());

  // Poll for status updates when documents are processing
  useEffect(() => {
    // Check if any documents are processing
    const processingDocs = documents.filter(
      d => d.parsing_status === 'pending' || d.parsing_status === 'processing'
    );

    // Track which documents were processing
    const currentProcessingIds = new Set(processingDocs.map(d => d.id));

    // If no documents are processing, clear the ref and stop
    if (processingDocs.length === 0) {
      processingIdsRef.current = new Set();
      return;
    }

    // Poll every 5 seconds while documents are processing
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

      // Check for completed documents that were processing
      const previouslyProcessing = processingIdsRef.current;
      const newlyCompleted = result.data.filter(
        d => previouslyProcessing.has(d.id) && d.parsing_status === 'completed'
      );
      const newlyFailed = result.data.filter(
        d => previouslyProcessing.has(d.id) && d.parsing_status === 'failed'
      );

      // Show toast notifications for completed documents
      newlyCompleted.forEach(doc => {
        toast.success('AI Analysis Complete', {
          description: (
            <span>
              <Sparkles className="inline h-3 w-3 mr-1" />
              {doc.filename} has been analyzed
              {doc.parsing_confidence && (
                <span className="text-muted-foreground ml-1">
                  ({Math.round(doc.parsing_confidence * 100)}% confidence)
                </span>
              )}
            </span>
          ),
          action: {
            label: 'View',
            onClick: () => router.push(`/documents/${doc.id}`),
          },
        });
      });

      // Show toast for failed documents
      newlyFailed.forEach(doc => {
        toast.error('AI Analysis Failed', {
          description: doc.parsing_error || `Failed to analyze ${doc.filename}`,
        });
      });

      // Update state
      setDocuments(result.data);
      setTotal(result.total);

      // Update tracking ref
      const stillProcessing = result.data.filter(
        d => d.parsing_status === 'pending' || d.parsing_status === 'processing'
      );
      processingIdsRef.current = new Set(stillProcessing.map(d => d.id));

      // If nothing is processing anymore, the effect will clean up on next render
    }, 5000);

    // Store current processing IDs
    processingIdsRef.current = currentProcessingIds;

    return () => clearInterval(pollInterval);
  }, [documents, debouncedSearch, typeFilters, vendorFilter, page, sortField, sortDirection, initialData.limit, router]);

  const totalPages = Math.ceil(total / initialData.limit);

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

  // Handle type filter toggle
  const toggleTypeFilter = (type: DocumentType) => {
    setTypeFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Handle apply filters
  const applyFilters = () => {
    setIsFilterOpen(false);
    fetchDocuments(1);
  };

  // Handle clear all filters
  const clearAllFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setTypeFilters([]);
    setVendorFilter('all');
    setStatusFilter('all');
    fetchDocuments(1);
  };

  // Handle selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocuments.map(d => d.id)));
    }
    setSelectAll(!selectAll);
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    if (!uploadVendorId) {
      toast.error('Please select a vendor');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('type', uploadType);
      formData.append('vendor_id', uploadVendorId);
      formData.append('metadata', JSON.stringify({ description: uploadDescription }));

      const result = await uploadDocument(formData);

      if (result.success) {
        toast.success('Document uploaded successfully');
        setIsUploadOpen(false);
        setUploadFile(null);
        setUploadType('other');
        setUploadVendorId('');
        setUploadDescription('');
        fetchDocuments(1);
      } else {
        toast.error(result.error?.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle download
  const handleDownload = async (document: DocumentWithVendor) => {
    try {
      const result = await getDocumentDownloadUrl(document.id);
      if (result.success && result.data) {
        window.open(result.data.url, '_blank');
      } else {
        toast.error(result.error?.message || 'Failed to get download URL');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  // Handle bulk download
  const handleBulkDownload = async () => {
    const selectedDocs = filteredDocuments.filter(d => selectedIds.has(d.id));
    toast.info(`Downloading ${selectedDocs.length} documents...`);

    for (const doc of selectedDocs) {
      await handleDownload(doc);
      await new Promise(resolve => setTimeout(resolve, 500)); // Stagger downloads
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedDocument) return;

    try {
      const result = await deleteDocument(selectedDocument.id);
      if (result.success) {
        toast.success('Document deleted successfully');
        setIsDeleteOpen(false);
        setSelectedDocument(null);
        fetchDocuments();
      } else {
        toast.error(result.error?.message || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    const selectedDocs = filteredDocuments.filter(d => selectedIds.has(d.id));
    let successCount = 0;

    for (const doc of selectedDocs) {
      try {
        const result = await deleteDocument(doc.id);
        if (result.success) successCount++;
      } catch (error) {
        console.error('Delete error:', error);
      }
    }

    toast.success(`Deleted ${successCount} of ${selectedDocs.length} documents`);
    setIsBulkDeleteOpen(false);
    setSelectedIds(new Set());
    setSelectAll(false);
    fetchDocuments();
  };

  // Render sortable column header
  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-30" />
      )}
    </button>
  );

  // Render document row
  const DocumentRow = ({ doc }: { doc: DocumentWithVendor }) => {
    const TypeIcon = documentTypeIcons[doc.type];
    const typeInfo = DOCUMENT_TYPE_INFO[doc.type];
    const status = getDocumentStatus(doc);

    return (
      <TableRow className={cn(selectedIds.has(doc.id) && 'bg-muted/50')}>
        <TableCell>
          <Checkbox
            checked={selectedIds.has(doc.id)}
            onCheckedChange={() => toggleSelect(doc.id)}
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className={cn('rounded-lg p-2 flex-shrink-0', typeInfo.color)}>
              <TypeIcon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <Link
                href={`/documents/${doc.id}`}
                className="font-medium truncate block max-w-[250px] hover:text-primary hover:underline"
              >
                {doc.filename}
              </Link>
              <p className="text-xs text-muted-foreground">
                {doc.mime_type}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary">{typeInfo.label}</Badge>
        </TableCell>
        <TableCell>
          {doc.vendor ? (
            <Link
              href={`/vendors/${doc.vendor.id}?tab=documents`}
              className="flex items-center gap-2 hover:text-primary"
            >
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate max-w-[120px]">{doc.vendor.name}</span>
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-muted-foreground">{formatFileSize(doc.file_size)}</TableCell>
        <TableCell className="text-muted-foreground">
          {new Date(doc.created_at).toLocaleDateString()}
        </TableCell>
        <TableCell>{getStatusBadge(status, doc)}</TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/documents/${doc.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload(doc)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-error focus:text-error"
                onClick={() => {
                  setSelectedDocument(doc);
                  setIsDeleteOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  // Render document card
  const DocumentCard = ({ doc }: { doc: DocumentWithVendor }) => {
    const TypeIcon = documentTypeIcons[doc.type];
    const typeInfo = DOCUMENT_TYPE_INFO[doc.type];
    const status = getDocumentStatus(doc);

    return (
      <Card
        className={cn(
          'group cursor-pointer transition-all hover:shadow-md',
          selectedIds.has(doc.id) && 'ring-2 ring-primary'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.has(doc.id)}
                onCheckedChange={() => toggleSelect(doc.id)}
              />
              <div className={cn('rounded-lg p-2', typeInfo.color)}>
                <TypeIcon className="h-4 w-4 text-white" />
              </div>
            </div>
            {getStatusBadge(status, doc)}
          </div>

          <Link href={`/documents/${doc.id}`} className="block hover:text-primary">
            <h3 className="font-medium truncate mb-1">{doc.filename}</h3>
          </Link>

          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{typeInfo.label}</Badge>
              <span>{formatFileSize(doc.file_size)}</span>
            </div>
            {doc.vendor && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{doc.vendor.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/documents/${doc.id}`)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDocument(doc);
                setIsDeleteOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 text-error" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Card className="card-elevated">
        {/* Toolbar */}
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            {/* Top row: Search and Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 gap-2 items-center">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Advanced Filters */}
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <h4 className="font-medium">Filters</h4>

                      {/* Document Type */}
                      <div className="space-y-2">
                        <Label className="text-sm">Document Type</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(DOCUMENT_TYPE_INFO).map(([key, info]) => (
                            <Button
                              key={key}
                              variant={typeFilters.includes(key as DocumentType) ? 'default' : 'outline'}
                              size="sm"
                              className="justify-start text-xs"
                              onClick={() => toggleTypeFilter(key as DocumentType)}
                            >
                              {info.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Vendor */}
                      <div className="space-y-2">
                        <Label className="text-sm">Vendor</Label>
                        <Select value={vendorFilter} onValueChange={setVendorFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Vendors" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Vendors</SelectItem>
                            {vendors.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                {vendor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status */}
                      <div className="space-y-2">
                        <Label className="text-sm">Status</Label>
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <div className="flex items-center gap-2">
                                  <opt.icon className={cn('h-4 w-4', opt.color)} />
                                  {opt.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={clearAllFilters} className="flex-1">
                          Clear All
                        </Button>
                        <Button size="sm" onClick={applyFilters} className="flex-1">
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Right side actions */}
              <div className="flex items-center gap-2">
                {/* Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    {SORT_OPTIONS.map((opt) => (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={sortField === opt.value}
                        onCheckedChange={() => handleSort(opt.value)}
                      >
                        {opt.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={sortDirection === 'asc'}
                      onCheckedChange={() => setSortDirection('asc')}
                    >
                      Ascending
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={sortDirection === 'desc'}
                      onCheckedChange={() => setSortDirection('desc')}
                    >
                      Descending
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Group */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <LayoutList className="h-4 w-4" />
                      Group
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem
                      checked={groupBy === 'none'}
                      onCheckedChange={() => setGroupBy('none')}
                    >
                      No Grouping
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={groupBy === 'vendor'}
                      onCheckedChange={() => setGroupBy('vendor')}
                    >
                      By Vendor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={groupBy === 'type'}
                      onCheckedChange={() => setGroupBy('type')}
                    >
                      By Type
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={groupBy === 'status'}
                      onCheckedChange={() => setGroupBy('status')}
                    >
                      By Status
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Toggle */}
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setViewMode('table')}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setViewMode('card')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>

                <Button onClick={() => setIsUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>

            {/* Active filters bar */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Filters:</span>
                {debouncedSearch && (
                  <Badge variant="secondary" className="gap-1">
                    Search: &quot;{debouncedSearch}&quot;
                    <button onClick={() => { setSearch(''); setDebouncedSearch(''); }} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {typeFilters.map(type => (
                  <Badge key={type} variant="secondary" className="gap-1">
                    {DOCUMENT_TYPE_INFO[type].label}
                    <button onClick={() => toggleTypeFilter(type)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {vendorFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Vendor: {vendors.find(v => v.id === vendorFilter)?.name}
                    <button onClick={() => setVendorFilter('all')} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}
                    <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 text-xs">
                  Clear all
                </Button>
              </div>
            )}

            {/* Bulk actions bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                <span className="text-sm font-medium">{selectedIds.size} selected</span>
                <Separator orientation="vertical" className="h-4" />
                <Button variant="outline" size="sm" onClick={handleBulkDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-error hover:text-error"
                  onClick={() => setIsBulkDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedIds(new Set()); setSelectAll(false); }}>
                  Clear selection
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            debouncedSearch ? (
              <SearchEmptyState
                searchQuery={debouncedSearch}
                onClear={() => { setSearch(''); setDebouncedSearch(''); fetchDocuments(1); }}
              />
            ) : activeFilterCount > 0 ? (
              <FilterEmptyState onClear={clearAllFilters} />
            ) : (
              <NoDocumentsState onUpload={() => setIsUploadOpen(true)} />
            )
          ) : viewMode === 'table' ? (
            // Table View
            <div className="space-y-4">
              {Object.entries(sortedGroups).map(([groupName, docs]) => (
                <div key={groupName}>
                  {groupBy !== 'none' && (
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 rounded-md mb-2">
                        <ChevronDown className="h-4 w-4" />
                        <span className="font-medium">{groupName}</span>
                        <Badge variant="secondary">{docs.length}</Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-10">
                                  <Checkbox
                                    checked={selectAll}
                                    onCheckedChange={toggleSelectAll}
                                  />
                                </TableHead>
                                <TableHead><SortableHeader field="filename">Document</SortableHeader></TableHead>
                                <TableHead><SortableHeader field="type">Type</SortableHeader></TableHead>
                                <TableHead><SortableHeader field="vendor">Vendor</SortableHeader></TableHead>
                                <TableHead><SortableHeader field="file_size">Size</SortableHeader></TableHead>
                                <TableHead><SortableHeader field="created_at">Uploaded</SortableHeader></TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {docs.map((doc) => (
                                <DocumentRow key={doc.id} doc={doc} />
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {groupBy === 'none' && (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">
                              <Checkbox
                                checked={selectAll}
                                onCheckedChange={toggleSelectAll}
                              />
                            </TableHead>
                            <TableHead><SortableHeader field="filename">Document</SortableHeader></TableHead>
                            <TableHead><SortableHeader field="type">Type</SortableHeader></TableHead>
                            <TableHead><SortableHeader field="vendor">Vendor</SortableHeader></TableHead>
                            <TableHead><SortableHeader field="file_size">Size</SortableHeader></TableHead>
                            <TableHead><SortableHeader field="created_at">Uploaded</SortableHeader></TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {docs.map((doc) => (
                            <DocumentRow key={doc.id} doc={doc} />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Card View
            <div className="space-y-6">
              {Object.entries(sortedGroups).map(([groupName, docs]) => (
                <div key={groupName}>
                  {groupBy !== 'none' && (
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 rounded-md mb-3">
                        <ChevronDown className="h-4 w-4" />
                        <span className="font-medium">{groupName}</span>
                        <Badge variant="secondary">{docs.length}</Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {docs.map((doc) => (
                            <DocumentCard key={doc.id} doc={doc} />
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {groupBy === 'none' && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {docs.map((doc) => (
                        <DocumentCard key={doc.id} doc={doc} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !isLoading && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * initialData.limit + 1} to{' '}
                {Math.min(page * initialData.limit, total)} of {total} documents
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1 || isLoading}
                  onClick={() => fetchDocuments(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages || isLoading}
                  onClick={() => fetchDocuments(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload compliance documents, certificates, or audit reports.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Input */}
            <div className="space-y-2">
              <Label>File</Label>
              {uploadFile ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setUploadFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop or click to select
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv"
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Select File
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    PDF, Word, Excel, Images up to 50MB
                  </p>
                </div>
              )}
            </div>

            {/* Vendor (Required) */}
            <div className="space-y-2">
              <Label>
                Vendor <span className="text-destructive">*</span>
              </Label>
              {isLoadingVendors ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading vendors...
                </div>
              ) : vendors.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">
                  <p className="mb-2">No vendors found.</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/vendors/new">Add your first vendor</Link>
                  </Button>
                </div>
              ) : (
                <Select value={uploadVendorId} onValueChange={setUploadVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Documents must be linked to a vendor for compliance tracking and RoI population.
              </p>
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={uploadType} onValueChange={(v) => setUploadType(v as DocumentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPE_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Add a description..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || !uploadVendorId || isUploading || vendors.length === 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedDocument?.filename}&quot;? This action
              cannot be undone and will remove all associated analysis data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Documents</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} documents? This action
              cannot be undone and will remove all associated analysis data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete {selectedIds.size} Documents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
