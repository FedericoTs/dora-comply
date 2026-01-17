'use client';

import { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  Trash2,
  Users,
  Calendar,
  Shield,
  Tag,
  Send,
  ChevronDown,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import type { Vendor, VendorTier, VendorStatus } from '@/lib/vendors/types';

// ============================================================================
// Types
// ============================================================================

export type BulkActionType =
  | 'export_csv'
  | 'export_xlsx'
  | 'export_json'
  | 'request_soc2'
  | 'schedule_assessment'
  | 'update_tier'
  | 'update_status'
  | 'assign_owner'
  | 'generate_roi'
  | 'delete';

export interface BulkActionResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: string[];
}

interface VendorBulkActionsProps {
  selectedVendors: Vendor[];
  onAction: (action: BulkActionType, params?: Record<string, unknown>) => Promise<BulkActionResult>;
  onClearSelection: () => void;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function VendorBulkActions({
  selectedVendors,
  onAction,
  onClearSelection,
  disabled = false,
  className,
}: VendorBulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<BulkActionType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTierDialog, setShowTierDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
  const [showSoc2Dialog, setShowSoc2Dialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [lastResult, setLastResult] = useState<BulkActionResult | null>(null);

  // Form states
  const [selectedTier, setSelectedTier] = useState<VendorTier>('standard');
  const [selectedStatus, setSelectedStatus] = useState<VendorStatus>('active');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [assessmentDate, setAssessmentDate] = useState('');
  const [soc2Message, setSoc2Message] = useState('');

  const count = selectedVendors.length;

  const handleAction = async (action: BulkActionType, params?: Record<string, unknown>) => {
    setIsLoading(true);
    setLoadingAction(action);

    try {
      const result = await onAction(action, params);
      setLastResult(result);

      // Show result for non-export actions
      if (!action.startsWith('export_')) {
        setShowResultDialog(true);
      }

      // Clear selection on success
      if (result.success && result.failed === 0) {
        onClearSelection();
      }
    } catch {
      setLastResult({
        success: false,
        processed: 0,
        failed: count,
        errors: ['An unexpected error occurred'],
      });
      setShowResultDialog(true);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  if (count === 0) return null;

  return (
    <div className={cn('flex items-center gap-2 animate-in slide-in-from-top-2', className)}>
      {/* Selection info */}
      <Badge variant="secondary" className="px-3 py-1.5 gap-2">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {count} selected
      </Badge>

      {/* Clear selection */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        disabled={disabled || isLoading}
      >
        Clear
      </Button>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Actions
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Export Section */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs">Export</DropdownMenuLabel>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Download className="mr-2 h-4 w-4" />
                Export as...
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => handleAction('export_csv')}
                  disabled={loadingAction === 'export_csv'}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleAction('export_xlsx')}
                  disabled={loadingAction === 'export_xlsx'}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel (XLSX)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleAction('export_json')}
                  disabled={loadingAction === 'export_json'}
                >
                  <FileJson className="mr-2 h-4 w-4" />
                  JSON
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Compliance Section */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs">Compliance</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setShowSoc2Dialog(true)}>
              <Shield className="mr-2 h-4 w-4" />
              Request SOC 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowAssessmentDialog(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Assessment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('generate_roi')}>
              <FileText className="mr-2 h-4 w-4" />
              Generate RoI Entry
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Management Section */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs">Management</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setShowTierDialog(true)}>
              <Tag className="mr-2 h-4 w-4" />
              Update Tier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowStatusDialog(true)}>
              <Tag className="mr-2 h-4 w-4" />
              Update Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowOwnerDialog(true)}>
              <Users className="mr-2 h-4 w-4" />
              Assign Owner
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Danger Zone */}
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-error focus:text-error"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-error" />
              Delete {count} Vendor{count > 1 ? 's' : ''}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {count} vendor{count > 1 ? 's' : ''}? This action
              can be undone by restoring from the activity log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteDialog(false);
                handleAction('delete');
              }}
              className="bg-error text-white hover:bg-error/90"
              disabled={isLoading}
            >
              {loadingAction === 'delete' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Tier Dialog */}
      <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Tier for {count} Vendor{count > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Change the tier classification for the selected vendors.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tier">New Tier</Label>
              <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as VendorTier)}>
                <SelectTrigger id="tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTierDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowTierDialog(false);
                handleAction('update_tier', { tier: selectedTier });
              }}
              disabled={isLoading}
            >
              {loadingAction === 'update_tier' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status for {count} Vendor{count > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Change the status for the selected vendors.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as VendorStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="offboarding">Offboarding</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowStatusDialog(false);
                handleAction('update_status', { status: selectedStatus });
              }}
              disabled={isLoading}
            >
              {loadingAction === 'update_status' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Owner Dialog */}
      <Dialog open={showOwnerDialog} onOpenChange={setShowOwnerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Owner to {count} Vendor{count > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Assign a team member as the owner for the selected vendors.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="owner">Owner Email</Label>
              <Input
                id="owner"
                type="email"
                placeholder="owner@company.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOwnerDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowOwnerDialog(false);
                handleAction('assign_owner', { owner_email: ownerEmail });
              }}
              disabled={isLoading || !ownerEmail}
            >
              {loadingAction === 'assign_owner' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Assign Owner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Assessment Dialog */}
      <Dialog open={showAssessmentDialog} onOpenChange={setShowAssessmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Assessment for {count} Vendor{count > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Schedule a risk assessment for the selected vendors.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assessment-date">Assessment Date</Label>
              <Input
                id="assessment-date"
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssessmentDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowAssessmentDialog(false);
                handleAction('schedule_assessment', { date: assessmentDate });
              }}
              disabled={isLoading || !assessmentDate}
            >
              {loadingAction === 'schedule_assessment' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request SOC 2 Dialog */}
      <Dialog open={showSoc2Dialog} onOpenChange={setShowSoc2Dialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request SOC 2 from {count} Vendor{count > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Send a request to vendors for their SOC 2 Type II report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="soc2-message">Message (optional)</Label>
              <Textarea
                id="soc2-message"
                placeholder="Add a custom message to the request..."
                value={soc2Message}
                onChange={(e) => setSoc2Message(e.target.value)}
                rows={3}
              />
            </div>
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                An email will be sent to the primary contact of each selected vendor
                requesting their latest SOC 2 Type II report.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSoc2Dialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowSoc2Dialog(false);
                handleAction('request_soc2', { message: soc2Message });
              }}
              disabled={isLoading}
            >
              {loadingAction === 'request_soc2' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Send className="mr-2 h-4 w-4" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {lastResult?.success && lastResult?.failed === 0 ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Action Completed
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Action Completed with Issues
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {lastResult && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processed:</span>
                  <span className="font-medium">{lastResult.processed}</span>
                </div>
                {lastResult.failed > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Failed:</span>
                    <span className="font-medium text-error">{lastResult.failed}</span>
                  </div>
                )}
                {lastResult.errors && lastResult.errors.length > 0 && (
                  <div className="mt-4 rounded-md bg-error/10 p-3">
                    <p className="text-sm font-medium text-error mb-2">Errors:</p>
                    <ul className="text-xs text-error space-y-1">
                      {lastResult.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
