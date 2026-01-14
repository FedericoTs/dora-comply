export interface DeletionStatus {
  hasActiveRequest: boolean;
  requestedAt: string | null;
  requestedBy: string | null;
  expiresAt: string | null;
  requesterEmail: string | null;
}

export interface OrganizationDeletionProps {
  organizationId: string;
  organizationName: string;
  className?: string;
  onDeletionComplete?: () => void;
}

export interface Acknowledgements {
  dataLoss: boolean;
  noRecovery: boolean;
  auditTrail: boolean;
}

export interface DeletionDialogState {
  showRequestDialog: boolean;
  showConfirmDialog: boolean;
}

export interface DeletionFormState {
  acknowledgements: Acknowledgements;
  confirmationCode: string;
  confirmationText: string;
}
