'use client';

import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock, X } from 'lucide-react';
import { DocumentParsingStatus, ProcessingIndicator } from './document-parsing-status';
import type { DocumentWithVendor, StatusFilter } from '@/lib/documents/types';

interface DocumentStatusBadgeProps {
  status: StatusFilter;
  document?: DocumentWithVendor;
}

/**
 * Renders the appropriate status badge for a document based on its status
 */
export function DocumentStatusBadge({ status, document }: DocumentStatusBadgeProps) {
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
      return document ? (
        <DocumentParsingStatus
          status={document.parsing_status}
          showTooltip={true}
        />
      ) : (
        <ProcessingIndicator />
      );
    case 'failed':
      return document ? (
        <DocumentParsingStatus
          status="failed"
          error={document.parsing_error}
          showTooltip={true}
        />
      ) : (
        <Badge variant="destructive" className="gap-1">
          <X className="h-3 w-3" />
          Failed
        </Badge>
      );
    case 'active':
      if (document?.parsing_status === 'completed') {
        return (
          <DocumentParsingStatus
            status="completed"
            parsedAt={document.parsed_at}
            confidence={document.parsing_confidence}
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
