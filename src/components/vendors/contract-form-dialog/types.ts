/**
 * Contract Form Dialog Types
 */

import type { Contract } from '@/lib/contracts';

export interface ContractFormDialogProps {
  vendorId: string;
  contract?: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export interface ScanResult {
  documentType: string;
  documentTypeConfidence: number;
  title: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  isIctContract: boolean;
  likelyCriticalFunction: boolean;
  keyServicesMentioned: string[];
  scanNotes: string | null;
}

export interface DocumentScanState {
  file: File | null;
  isScanning: boolean;
  scanResult: ScanResult | null;
  scanError: string | null;
}

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;
export type Currency = typeof CURRENCIES[number];
