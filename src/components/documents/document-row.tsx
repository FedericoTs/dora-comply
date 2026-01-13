'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  MoreHorizontal,
  Download,
  Trash2,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableRow, TableCell } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  type DocumentWithVendor,
  DOCUMENT_TYPE_INFO,
  formatFileSize,
  getDocumentStatus,
} from '@/lib/documents/types';
import { DOCUMENT_TYPE_ICONS } from './constants';
import { DocumentStatusBadge } from './document-status-badge';

interface DocumentRowProps {
  document: DocumentWithVendor;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDownload: (document: DocumentWithVendor) => void;
  onDelete: (document: DocumentWithVendor) => void;
}

export function DocumentRow({
  document: doc,
  isSelected,
  onSelect,
  onDownload,
  onDelete,
}: DocumentRowProps) {
  const router = useRouter();
  const TypeIcon = DOCUMENT_TYPE_ICONS[doc.type];
  const typeInfo = DOCUMENT_TYPE_INFO[doc.type];
  const status = getDocumentStatus(doc);

  return (
    <TableRow className={cn(isSelected && 'bg-muted/50')}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(doc.id)}
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
      <TableCell>
        <DocumentStatusBadge status={status} document={doc} />
      </TableCell>
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
            <DropdownMenuItem onClick={() => onDownload(doc)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-error focus:text-error"
              onClick={() => onDelete(doc)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
