/**
 * Documents Component Constants
 *
 * UI-related constants for the documents page components.
 * For data types and filters, see @/lib/documents/types.ts
 */

import {
  Shield,
  Award,
  Bug,
  FileText,
  File,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import type { DocumentType, StatusFilter } from '@/lib/documents/types';

/**
 * Icon mapping for document types
 */
export const DOCUMENT_TYPE_ICONS: Record<DocumentType, React.ElementType> = {
  soc2: Shield,
  iso27001: Award,
  pentest: Bug,
  contract: FileText,
  other: File,
};

/**
 * Status filter options for the documents list
 */
export const STATUS_OPTIONS: {
  value: StatusFilter;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: 'all', label: 'All Status', icon: File, color: 'text-muted-foreground' },
  { value: 'active', label: 'Active', icon: CheckCircle2, color: 'text-success' },
  { value: 'expiring', label: 'Expiring Soon', icon: Clock, color: 'text-warning' },
  { value: 'expired', label: 'Expired', icon: AlertTriangle, color: 'text-destructive' },
  { value: 'processing', label: 'Processing', icon: Loader2, color: 'text-info' },
  { value: 'failed', label: 'Failed', icon: X, color: 'text-destructive' },
];

/**
 * Accepted file types for document upload
 */
export const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv';
