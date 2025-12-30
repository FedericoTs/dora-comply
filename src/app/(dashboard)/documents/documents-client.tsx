'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  type DocumentWithVendor,
  type PaginatedResult,
  type DocumentType,
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

interface DocumentsClientProps {
  initialData: PaginatedResult<DocumentWithVendor>;
}

const documentTypeIcons: Record<DocumentType, React.ElementType> = {
  soc2: Shield,
  iso27001: Award,
  pentest: Bug,
  contract: FileText,
  other: File,
};

export function DocumentsClient({ initialData }: DocumentsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State
  const [documents, setDocuments] = useState(initialData.data);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(initialData.page);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithVendor | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<DocumentType>('other');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const totalPages = Math.ceil(total / initialData.limit);

  // Fetch documents
  const fetchDocuments = useCallback(async (newPage: number = page) => {
    setIsLoading(true);
    try {
      const result = await fetchDocumentsAction({
        filters: {
          search: search || undefined,
          type: typeFilter !== 'all' ? [typeFilter] : undefined,
        },
        pagination: { page: newPage, limit: initialData.limit },
        sort: { field: 'created_at', direction: 'desc' },
      });
      setDocuments(result.data);
      setTotal(result.total);
      setPage(result.page);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, typeFilter, initialData.limit]);

  // Handle search
  const handleSearch = useCallback(() => {
    startTransition(() => {
      fetchDocuments(1);
    });
  }, [fetchDocuments]);

  // Handle filter change
  const handleFilterChange = useCallback((value: DocumentType | 'all') => {
    setTypeFilter(value);
    startTransition(() => {
      fetchDocuments(1);
    });
  }, [fetchDocuments]);

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

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('type', uploadType);
      formData.append('metadata', JSON.stringify({ description: uploadDescription }));

      const result = await uploadDocument(formData);

      if (result.success) {
        toast.success('Document uploaded successfully');
        setIsUploadOpen(false);
        setUploadFile(null);
        setUploadType('other');
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

  const getDocumentStatusBadge = (doc: DocumentWithVendor) => {
    if (isDocumentExpired(doc)) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }
    if (isDocumentExpiring(doc)) {
      return (
        <Badge variant="outline" className="gap-1 border-warning text-warning">
          <Clock className="h-3 w-3" />
          Expiring Soon
        </Badge>
      );
    }
    return null;
  };

  return (
    <>
      <Card className="card-elevated">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">All Documents</CardTitle>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-8 w-full sm:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(v) => handleFilterChange(v as DocumentType | 'all')}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(DOCUMENT_TYPE_INFO).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Upload Button */}
            <Button onClick={() => setIsUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {search || typeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first compliance document to get started'}
              </p>
              {!search && typeFilter === 'all' && (
                <Button onClick={() => setIsUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => {
                      const TypeIcon = documentTypeIcons[doc.type];
                      const typeInfo = DOCUMENT_TYPE_INFO[doc.type];

                      return (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={cn('rounded-lg p-2', typeInfo.color)}>
                                <TypeIcon className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium truncate max-w-[200px]">
                                  {doc.filename}
                                </p>
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
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">
                                  {doc.vendor.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                          <TableCell>
                            {new Date(doc.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{getDocumentStatusBadge(doc)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/documents/${doc.id}`)}
                                >
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
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
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
            </>
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
            <Button onClick={handleUpload} disabled={!uploadFile || isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
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
              Are you sure you want to delete "{selectedDocument?.filename}"? This action
              cannot be undone.
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
    </>
  );
}
