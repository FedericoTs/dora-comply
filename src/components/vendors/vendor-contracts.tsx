'use client';

/**
 * Vendor Contracts Component
 *
 * Displays and manages contracts for a vendor with DORA compliance tracking
 */

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  Euro,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { ContractFormDialog } from './contract-form-dialog';
import {
  type Contract,
  CONTRACT_TYPE_INFO,
  CONTRACT_STATUS_INFO,
  calculateDoraComplianceScore,
} from '@/lib/contracts';
import { deleteContract } from '@/lib/contracts/actions';

interface VendorContractsProps {
  vendorId: string;
  contracts: Contract[];
  isCriticalFunction?: boolean;
}

const STATUS_ICONS = {
  draft: Clock,
  active: CheckCircle2,
  expiring: AlertTriangle,
  expired: XCircle,
  terminated: XCircle,
};

function formatCurrency(value: number | null, currency: string): string {
  if (value === null) return '-';
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getDoraComplianceColor(score: number): string {
  if (score >= 80) return 'bg-success/10 text-success';
  if (score >= 50) return 'bg-warning/10 text-warning';
  return 'bg-destructive/10 text-destructive';
}

export function VendorContracts({
  vendorId,
  contracts,
  isCriticalFunction = false,
}: VendorContractsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deletingContract, setDeletingContract] = useState<Contract | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    if (!deletingContract) return;

    startTransition(async () => {
      const result = await deleteContract(deletingContract.id);

      if (result.success) {
        toast.success('Contract deleted successfully');
      } else {
        toast.error(result.error?.message || 'Failed to delete contract');
      }

      setDeletingContract(null);
    });
  };

  const handleSuccess = () => {
    setIsAddDialogOpen(false);
    setEditingContract(null);
  };

  return (
    <>
      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Contracts</CardTitle>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contract
          </Button>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No contracts linked yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add contracts to track DORA Article 30 compliance
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract) => {
                const StatusIcon = STATUS_ICONS[contract.status];
                const statusInfo = CONTRACT_STATUS_INFO[contract.status];
                const typeInfo = CONTRACT_TYPE_INFO[contract.contract_type];
                const complianceScore = calculateDoraComplianceScore(
                  contract.dora_provisions,
                  isCriticalFunction
                );

                return (
                  <div
                    key={contract.id}
                    className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                          {contract.contract_ref}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {typeInfo.label}
                        </Badge>
                        <Badge className={`text-xs ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(contract.effective_date)}
                          {contract.expiry_date && (
                            <> - {formatDate(contract.expiry_date)}</>
                          )}
                        </span>

                        {contract.annual_value && (
                          <span className="flex items-center gap-1">
                            <Euro className="h-3 w-3" />
                            {formatCurrency(contract.annual_value, contract.currency)}/yr
                          </span>
                        )}

                        {contract.auto_renewal && (
                          <span className="flex items-center gap-1 text-primary">
                            <RefreshCw className="h-3 w-3" />
                            Auto-renewal
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            DORA Compliance:
                          </span>
                          <Badge
                            className={`text-xs ${getDoraComplianceColor(complianceScore)}`}
                          >
                            {complianceScore}%
                          </Badge>
                        </div>
                        {complianceScore < 100 && (
                          <span className="text-xs text-muted-foreground">
                            {8 - Math.floor((complianceScore / 100) * 8)} provisions missing
                          </span>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingContract(contract)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletingContract(contract)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Contract Dialog */}
      <ContractFormDialog
        vendorId={vendorId}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleSuccess}
      />

      {/* Edit Contract Dialog */}
      {editingContract && (
        <ContractFormDialog
          vendorId={vendorId}
          contract={editingContract}
          open={!!editingContract}
          onOpenChange={(open) => !open && setEditingContract(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingContract}
        onOpenChange={(open) => !open && setDeletingContract(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete contract &quot;{deletingContract?.contract_ref}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
