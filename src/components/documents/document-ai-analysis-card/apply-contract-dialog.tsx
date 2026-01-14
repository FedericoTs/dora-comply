'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2 } from 'lucide-react';
import type { Contract } from './types';

interface ApplyContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contracts: Contract[];
  selectedContractId: string;
  onContractSelect: (id: string) => void;
  onApply: () => void;
  isPending: boolean;
}

export function ApplyContractDialog({
  open,
  onOpenChange,
  contracts,
  selectedContractId,
  onContractSelect,
  onApply,
  isPending,
}: ApplyContractDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Analysis to Contract</DialogTitle>
          <DialogDescription>
            Select a contract to update with the extracted DORA provisions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Contract</label>
            <Select value={selectedContractId} onValueChange={onContractSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a contract..." />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.contract_ref} ({contract.contract_type.replace(/_/g, ' ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Alert>
            <AlertDescription>
              This will update the contract&apos;s DORA provisions with the AI-extracted
              values. The compliance score and all provision statuses will be updated.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onApply}
            disabled={!selectedContractId || isPending}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Apply to Contract
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
