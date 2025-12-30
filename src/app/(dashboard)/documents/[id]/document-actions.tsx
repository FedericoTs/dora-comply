'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Trash2, Edit, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  type DocumentWithVendor,
  type DocumentType,
  DOCUMENT_TYPE_INFO,
} from '@/lib/documents/types';
import {
  deleteDocument,
  getDocumentDownloadUrl,
  updateDocument,
} from '@/lib/documents/actions';

interface DocumentActionsProps {
  document: DocumentWithVendor;
}

export function DocumentActions({ document }: DocumentActionsProps) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit state
  const [editType, setEditType] = useState<DocumentType>(document.type);
  const [editDescription, setEditDescription] = useState(
    document.metadata?.description || ''
  );
  const [editValidUntil, setEditValidUntil] = useState(
    document.metadata?.valid_until || document.metadata?.expiry_date || ''
  );

  const handleDownload = async () => {
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteDocument(document.id);
      if (result.success) {
        toast.success('Document deleted successfully');
        router.push('/documents');
      } else {
        toast.error(result.error?.message || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const result = await updateDocument(document.id, {
        type: editType,
        metadata: {
          ...document.metadata,
          description: editDescription || undefined,
          valid_until: editValidUntil || undefined,
        },
      });

      if (result.success) {
        toast.success('Document updated successfully');
        setIsEditOpen(false);
        router.refresh();
      } else {
        toast.error(result.error?.message || 'Failed to update document');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update document');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-error focus:text-error"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update document type and metadata.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select
                value={editType}
                onValueChange={(v) => setEditType(v as DocumentType)}
              >
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

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Add a description..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Valid Until / Expiry Date</Label>
              <Input
                type="date"
                value={editValidUntil ? editValidUntil.split('T')[0] : ''}
                onChange={(e) => setEditValidUntil(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Set the expiration date for this document
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
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
              Are you sure you want to delete "{document.filename}"? This action
              cannot be undone and will permanently remove the file from storage.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
