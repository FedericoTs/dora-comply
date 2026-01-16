'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown, Loader2 } from 'lucide-react';
import { SearchEmptyState, FilterEmptyState, NoDocumentsState } from '@/components/ui/empty-state';
import { FrameworkContextBanner } from '@/components/ui/framework-context-banner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  type DocumentWithVendor,
  type PaginatedResult,
  type SortField,
} from '@/lib/documents/types';
import {
  deleteDocument,
  getDocumentDownloadUrl,
} from '@/lib/documents/actions';
import { fetchVendorsAction } from '@/lib/vendors/actions';
import { useDocumentsState } from '@/hooks/use-documents-state';
import { useFramework } from '@/lib/context/framework-context';
import {
  DocumentRow,
  DocumentCard,
  DocumentsToolbar,
  UploadDocumentDialog,
  DeleteDocumentDialog,
  BulkDeleteDocumentDialog,
  SmartImportDialog,
} from '@/components/documents';

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

// ============================================================================
// Sortable Header Component
// ============================================================================

interface SortableHeaderProps {
  field: SortField;
  sortField: SortField;
  sortDirection: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}

function SortableHeader({ field, sortField, sortDirection, onSort, children }: SortableHeaderProps) {
  return (
    <button
      onClick={() => onSort(field)}
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
}

// ============================================================================
// Main Component
// ============================================================================

export function DocumentsClient({ initialData, initialVendors = [] }: DocumentsClientProps) {
  // Get active framework from context
  const { activeFramework } = useFramework();

  // Use the custom hook for state management with framework filter
  const state = useDocumentsState({ initialData, framework: activeFramework });

  // Dialog state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithVendor | null>(null);

  // Vendors state
  const [vendors, setVendors] = useState<SimpleVendor[]>(initialVendors);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);

  // Fetch vendors on mount and when needed
  // Intentional data fetching pattern
  useEffect(() => {
    if ((isUploadOpen || state.vendorFilter !== 'all') && vendors.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [isUploadOpen, state.vendorFilter, vendors.length]);

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
    const selectedDocs = state.filteredDocuments.filter(d => state.selectedIds.has(d.id));
    toast.info(`Downloading ${selectedDocs.length} documents...`);

    for (const doc of selectedDocs) {
      await handleDownload(doc);
      await new Promise(resolve => setTimeout(resolve, 500));
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
        state.fetchDocuments();
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
    const selectedDocs = state.filteredDocuments.filter(d => state.selectedIds.has(d.id));
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
    state.clearSelection();
    state.fetchDocuments();
  };

  // Handle opening delete dialog
  const handleOpenDeleteDialog = (doc: DocumentWithVendor) => {
    setSelectedDocument(doc);
    setIsDeleteOpen(true);
  };

  // Render table header
  const renderTableHeader = () => (
    <TableHeader>
      <TableRow>
        <TableHead className="w-10">
          <Checkbox
            checked={state.selectAll}
            onCheckedChange={state.toggleSelectAll}
          />
        </TableHead>
        <TableHead>
          <SortableHeader field="filename" sortField={state.sortField} sortDirection={state.sortDirection} onSort={state.handleSort}>
            Document
          </SortableHeader>
        </TableHead>
        <TableHead>
          <SortableHeader field="type" sortField={state.sortField} sortDirection={state.sortDirection} onSort={state.handleSort}>
            Type
          </SortableHeader>
        </TableHead>
        <TableHead>
          <SortableHeader field="vendor" sortField={state.sortField} sortDirection={state.sortDirection} onSort={state.handleSort}>
            Vendor
          </SortableHeader>
        </TableHead>
        <TableHead>
          <SortableHeader field="file_size" sortField={state.sortField} sortDirection={state.sortDirection} onSort={state.handleSort}>
            Size
          </SortableHeader>
        </TableHead>
        <TableHead>
          <SortableHeader field="created_at" sortField={state.sortField} sortDirection={state.sortDirection} onSort={state.handleSort}>
            Uploaded
          </SortableHeader>
        </TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="w-[50px]"></TableHead>
      </TableRow>
    </TableHeader>
  );

  return (
    <>
      {/* Framework Context Banner */}
      <FrameworkContextBanner pageType="documents" className="mb-4" />

      <Card className="card-elevated">
        {/* Toolbar */}
        <CardHeader className="pb-4">
          <DocumentsToolbar
            search={state.search}
            onSearchChange={state.setSearch}
            typeFilters={state.typeFilters}
            onToggleTypeFilter={state.toggleTypeFilter}
            vendorFilter={state.vendorFilter}
            onVendorFilterChange={state.setVendorFilter}
            statusFilter={state.statusFilter}
            onStatusFilterChange={state.setStatusFilter}
            vendors={vendors}
            activeFilterCount={state.activeFilterCount}
            onApplyFilters={() => state.fetchDocuments(1)}
            onClearAllFilters={state.clearAllFilters}
            sortField={state.sortField}
            sortDirection={state.sortDirection}
            onSort={state.handleSort}
            onSortDirectionChange={state.setSortDirection}
            viewMode={state.viewMode}
            onViewModeChange={state.setViewMode}
            groupBy={state.groupBy}
            onGroupByChange={state.setGroupBy}
            onUploadClick={() => setIsUploadOpen(true)}
            onSmartImportClick={() => setIsSmartImportOpen(true)}
            selectedCount={state.selectedIds.size}
            onBulkDownload={handleBulkDownload}
            onBulkDelete={() => setIsBulkDeleteOpen(true)}
            onClearSelection={state.clearSelection}
            debouncedSearch={state.debouncedSearch}
            onClearSearch={() => {
              state.setSearch('');
              state.setDebouncedSearch('');
            }}
          />
        </CardHeader>

        <CardContent>
          {state.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : state.filteredDocuments.length === 0 ? (
            state.debouncedSearch ? (
              <SearchEmptyState
                searchQuery={state.debouncedSearch}
                onClear={() => {
                  state.setSearch('');
                  state.setDebouncedSearch('');
                  state.fetchDocuments(1);
                }}
              />
            ) : state.activeFilterCount > 0 ? (
              <FilterEmptyState onClear={state.clearAllFilters} />
            ) : (
              <NoDocumentsState onUpload={() => setIsUploadOpen(true)} />
            )
          ) : state.viewMode === 'table' ? (
            // Table View
            <div className="space-y-4">
              {Object.entries(state.sortedGroups).map(([groupName, docs]) => (
                <div key={groupName}>
                  {state.groupBy !== 'none' && (
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 rounded-md mb-2">
                        <ChevronDown className="h-4 w-4" />
                        <span className="font-medium">{groupName}</span>
                        <Badge variant="secondary">{docs.length}</Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="rounded-md border">
                          <Table>
                            {renderTableHeader()}
                            <TableBody>
                              {docs.map((doc) => (
                                <DocumentRow
                                  key={doc.id}
                                  document={doc}
                                  isSelected={state.selectedIds.has(doc.id)}
                                  onSelect={state.toggleSelect}
                                  onDownload={handleDownload}
                                  onDelete={handleOpenDeleteDialog}
                                />
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {state.groupBy === 'none' && (
                    <div className="rounded-md border">
                      <Table>
                        {renderTableHeader()}
                        <TableBody>
                          {docs.map((doc) => (
                            <DocumentRow
                              key={doc.id}
                              document={doc}
                              isSelected={state.selectedIds.has(doc.id)}
                              onSelect={state.toggleSelect}
                              onDownload={handleDownload}
                              onDelete={handleOpenDeleteDialog}
                            />
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
              {Object.entries(state.sortedGroups).map(([groupName, docs]) => (
                <div key={groupName}>
                  {state.groupBy !== 'none' && (
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 rounded-md mb-3">
                        <ChevronDown className="h-4 w-4" />
                        <span className="font-medium">{groupName}</span>
                        <Badge variant="secondary">{docs.length}</Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {docs.map((doc) => (
                            <DocumentCard
                              key={doc.id}
                              document={doc}
                              isSelected={state.selectedIds.has(doc.id)}
                              onSelect={state.toggleSelect}
                              onDownload={handleDownload}
                              onDelete={handleOpenDeleteDialog}
                            />
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {state.groupBy === 'none' && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {docs.map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          document={doc}
                          isSelected={state.selectedIds.has(doc.id)}
                          onSelect={state.toggleSelect}
                          onDownload={handleDownload}
                          onDelete={handleOpenDeleteDialog}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {state.totalPages > 1 && !state.isLoading && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(state.page - 1) * state.limit + 1} to{' '}
                {Math.min(state.page * state.limit, state.total)} of {state.total} documents
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={state.page === 1 || state.isLoading}
                  onClick={() => state.fetchDocuments(state.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={state.page === state.totalPages || state.isLoading}
                  onClick={() => state.fetchDocuments(state.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <UploadDocumentDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        vendors={vendors}
        isLoadingVendors={isLoadingVendors}
        onUploadSuccess={() => state.fetchDocuments(1)}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDocumentDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        document={selectedDocument}
        onConfirm={handleDelete}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <BulkDeleteDocumentDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        count={state.selectedIds.size}
        onConfirm={handleBulkDelete}
      />

      {/* Smart Import Dialog */}
      <SmartImportDialog
        open={isSmartImportOpen}
        onOpenChange={setIsSmartImportOpen}
      />
    </>
  );
}
