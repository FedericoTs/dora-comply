'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  ExternalLink,
  Shield,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { VendorLEIStatus } from './vendor-lei-status';
import { TierBadge } from '@/components/ui/tier-badge';
import { GradeBadge, scoreToGrade } from '@/components/ui/grade-badge';
import { ProgressMini } from '@/components/ui/progress-mini';
import type { Vendor } from '@/lib/vendors/types';
import { PROVIDER_TYPE_LABELS } from '@/lib/vendors/types';
import { deleteVendor } from '@/lib/vendors/actions';

interface VendorHeroProps {
  vendor: Vendor;
  onRefreshGleif?: () => void;
  isRefreshing?: boolean;
}

export function VendorHero({ vendor, onRefreshGleif, isRefreshing }: VendorHeroProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCritical = vendor.supports_critical_function;

  // Map tier to numeric value for TierBadge
  const tierValue = vendor.tier === 'critical' ? 1 : vendor.tier === 'important' ? 2 : 3;

  // Calculate DORA compliance score (simplified - in production would come from DB)
  const hasLei = !!vendor.lei;
  const hasAssessment = !!vendor.last_assessment_date;
  const hasCriticalFunctions = vendor.critical_functions?.length > 0;
  let doraComplianceScore = 0;
  if (hasLei) doraComplianceScore += 35;
  if (hasAssessment) doraComplianceScore += 35;
  if (hasCriticalFunctions || !vendor.supports_critical_function) doraComplianceScore += 30;

  // Use external grade if available, otherwise calculate from risk_score
  const riskGrade = vendor.external_risk_grade ||
    (vendor.risk_score !== null && vendor.risk_score !== undefined
      ? scoreToGrade(vendor.risk_score)
      : null);

  const providerLabel = vendor.provider_type
    ? PROVIDER_TYPE_LABELS[vendor.provider_type]
    : null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteVendor(vendor.id);
      if (result.success) {
        toast.success('Vendor deleted', {
          description: `${vendor.name} has been removed from your vendor list.`,
        });
        router.push('/vendors');
        router.refresh();
      } else {
        toast.error('Failed to delete vendor', {
          description: result.error?.message || 'An error occurred',
        });
      }
    } catch (error) {
      toast.error('Failed to delete vendor', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/vendors/${vendor.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onRefreshGleif} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh GLEIF Data
              </DropdownMenuItem>
              {vendor.lei && (
                <DropdownMenuItem asChild>
                  <a
                    href={`https://search.gleif.org/#/record/${vendor.lei}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on GLEIF
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Vendor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {vendor.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the vendor and all associated data including documents,
              contracts, and compliance records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Vendor
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Hero Section */}
      <div className="card-premium p-6">
        <div className="space-y-4">
          {/* Top Row: Name and subtitle */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight">
                {vendor.name}
              </h1>
              {isCritical && (
                <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                  <Shield className="h-3 w-3" />
                  Critical Function
                </Badge>
              )}
            </div>
            {providerLabel && (
              <p className="text-muted-foreground">{providerLabel}</p>
            )}
          </div>

          {/* Inline Status Indicators - The key improvement */}
          <div className="flex items-center gap-4 flex-wrap py-2 border-y border-border/50">
            <TierBadge tier={tierValue} ctpp={vendor.is_ctpp} showLabel />

            <div className="w-px h-6 bg-border" />

            {riskGrade ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Risk:</span>
                <GradeBadge grade={riskGrade} size="sm" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Risk:</span>
                <span className="text-sm text-muted-foreground">Not assessed</span>
              </div>
            )}

            <div className="w-px h-6 bg-border" />

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">DORA:</span>
              <ProgressMini value={doraComplianceScore} size="sm" showValue width="w-20" />
            </div>
          </div>

          {/* LEI and Jurisdiction */}
          <div className="flex flex-wrap items-center gap-4">
            {vendor.lei && (
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  LEI: {vendor.lei}
                </code>
                <VendorLEIStatus
                  lei={vendor.lei}
                  leiStatus={vendor.lei_status}
                  leiVerifiedAt={vendor.lei_verified_at}
                  leiNextRenewal={vendor.lei_next_renewal}
                  entityStatus={vendor.entity_status}
                />
              </div>
            )}

            {vendor.jurisdiction && (
              <div className="text-sm">
                <span className="text-muted-foreground">Jurisdiction:</span>{' '}
                <span className="font-medium">{vendor.jurisdiction}</span>
              </div>
            )}

            {vendor.esa_register_id && (
              <div className="text-sm">
                <span className="text-muted-foreground">ESA ID:</span>{' '}
                <span className="font-medium">{vendor.esa_register_id}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
