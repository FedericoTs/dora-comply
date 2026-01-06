/**
 * RoI Submission Types & Constants
 *
 * Client-safe types and constants for submission management
 */

import type { RoiTemplateId } from './types';

export type SubmissionStatus =
  | 'draft'
  | 'validating'
  | 'ready'
  | 'submitted'
  | 'acknowledged'
  | 'rejected';

export interface Submission {
  id: string;
  organizationId: string;
  status: SubmissionStatus;
  createdAt: Date;
  createdBy: string;
  createdByName?: string;
  validationErrors: number;
  validationWarnings: number;
  packageUrl?: string;
  submittedAt?: Date;
  esaConfirmationNumber?: string;
  notes?: string;
  reportingPeriod: string;
  submissionDeadline: Date;
}

export interface SubmissionComment {
  id: string;
  submissionId: string;
  userId: string;
  userName?: string;
  content: string;
  createdAt: Date;
  type: 'comment' | 'status_change' | 'validation_result' | 'system';
}

export interface SubmissionChecklist {
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
}

export interface ChecklistItem {
  id: string;
  category: 'data' | 'validation' | 'approval' | 'technical';
  title: string;
  description: string;
  isComplete: boolean;
  isRequired: boolean;
  completedAt?: Date;
  completedBy?: string;
  templateId?: RoiTemplateId;
  errorCount?: number;
}

// Default checklist template
export const SUBMISSION_CHECKLIST_TEMPLATE: Omit<ChecklistItem, 'isComplete' | 'completedAt' | 'completedBy'>[] = [
  // Data Completeness
  {
    id: 'data-entity',
    category: 'data',
    title: 'Entity Information Complete',
    description: 'B_01.01 and B_01.02 templates fully populated',
    isRequired: true,
    templateId: 'B_01.01',
  },
  {
    id: 'data-providers',
    category: 'data',
    title: 'ICT Providers Documented',
    description: 'All ICT third-party providers entered in B_02.01',
    isRequired: true,
    templateId: 'B_02.01',
  },
  {
    id: 'data-contracts',
    category: 'data',
    title: 'Contracts Registered',
    description: 'All contractual arrangements documented in B_03.01',
    isRequired: true,
    templateId: 'B_03.01',
  },
  {
    id: 'data-functions',
    category: 'data',
    title: 'Critical Functions Identified',
    description: 'Functions and ICT services linked in B_05.01',
    isRequired: true,
    templateId: 'B_05.01',
  },
  {
    id: 'data-risk',
    category: 'data',
    title: 'Risk Assessments Completed',
    description: 'Risk assessments documented in B_06.01',
    isRequired: false,
    templateId: 'B_06.01',
  },
  // Validation
  {
    id: 'validation-errors',
    category: 'validation',
    title: 'No Validation Errors',
    description: 'All critical validation errors resolved',
    isRequired: true,
  },
  {
    id: 'validation-warnings',
    category: 'validation',
    title: 'Warnings Reviewed',
    description: 'All validation warnings reviewed and acknowledged',
    isRequired: false,
  },
  {
    id: 'validation-cross-ref',
    category: 'validation',
    title: 'Cross-References Valid',
    description: 'All template cross-references are consistent',
    isRequired: true,
  },
  // Approval
  {
    id: 'approval-review',
    category: 'approval',
    title: 'Data Review Completed',
    description: 'Designated reviewer has verified data accuracy',
    isRequired: true,
  },
  {
    id: 'approval-management',
    category: 'approval',
    title: 'Management Approval',
    description: 'Authorized person has approved submission',
    isRequired: true,
  },
  // Technical
  {
    id: 'technical-format',
    category: 'technical',
    title: 'Export Format Verified',
    description: 'CSV/XML export matches ESA template specifications',
    isRequired: true,
  },
  {
    id: 'technical-package',
    category: 'technical',
    title: 'Submission Package Generated',
    description: 'Complete submission package ready for upload',
    isRequired: true,
  },
];

/**
 * Get submission status configuration (client-safe)
 */
export function getSubmissionStatusConfig(status: SubmissionStatus) {
  const config = {
    draft: {
      label: 'Draft',
      color: 'bg-gray-100 text-gray-700',
      icon: 'FileText',
      description: 'Submission in preparation',
    },
    validating: {
      label: 'Validating',
      color: 'bg-blue-100 text-blue-700',
      icon: 'RefreshCw',
      description: 'Running validation checks',
    },
    ready: {
      label: 'Ready',
      color: 'bg-green-100 text-green-700',
      icon: 'CheckCircle',
      description: 'Ready for submission',
    },
    submitted: {
      label: 'Submitted',
      color: 'bg-purple-100 text-purple-700',
      icon: 'Send',
      description: 'Submitted to regulator',
    },
    acknowledged: {
      label: 'Acknowledged',
      color: 'bg-emerald-100 text-emerald-700',
      icon: 'BadgeCheck',
      description: 'Confirmed by ESA',
    },
    rejected: {
      label: 'Rejected',
      color: 'bg-red-100 text-red-700',
      icon: 'XCircle',
      description: 'Requires corrections',
    },
  };

  return config[status];
}

/**
 * Format relative time for display (client-safe)
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}
