'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Download,
  Trash2,
  Eye,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  type DocumentWithVendor,
  DOCUMENT_TYPE_INFO,
  formatFileSize,
  getDocumentStatus,
} from '@/lib/documents/types';
import { DOCUMENT_TYPE_ICONS } from './constants';
import { DocumentStatusBadge } from './document-status-badge';

interface DocumentCardProps {
  document: DocumentWithVendor;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDownload: (document: DocumentWithVendor) => void;
  onDelete: (document: DocumentWithVendor) => void;
}

export function DocumentCard({
  document: doc,
  isSelected,
  onSelect,
  onDownload,
  onDelete,
}: DocumentCardProps) {
  const router = useRouter();
  const TypeIcon = DOCUMENT_TYPE_ICONS[doc.type];
  const typeInfo = DOCUMENT_TYPE_INFO[doc.type];
  const status = getDocumentStatus(doc);

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(doc.id)}
            />
            <div className={cn('rounded-lg p-2', typeInfo.color)}>
              <TypeIcon className="h-4 w-4 text-white" />
            </div>
          </div>
          <DocumentStatusBadge status={status} document={doc} />
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
          <Button variant="ghost" size="sm" onClick={() => onDownload(doc)}>
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(doc)}
          >
            <Trash2 className="h-4 w-4 text-error" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
