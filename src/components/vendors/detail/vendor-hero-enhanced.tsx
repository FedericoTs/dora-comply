'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  ExternalLink,
  Shield,
  Loader2,
  Star,
  FileText,
  Send,
  Calendar,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { VendorLEIStatus } from './vendor-lei-status';
import { TierBadge } from '@/components/ui/tier-badge';
import { GradeBadge, scoreToGrade } from '@/components/ui/grade-badge';
import { ProgressMini } from '@/components/ui/progress-mini';
import { DataFreshnessBadge } from '@/components/ui/data-freshness-badge';
import { TrendIndicator } from '@/components/ui/trend-indicator';
import type { Vendor, VendorWithRelations } from '@/lib/vendors/types';
import { PROVIDER_TYPE_LABELS } from '@/lib/vendors/types';
import { deleteVendor } from '@/lib/vendors/actions';
import { cn } from '@/lib/utils';

interface VendorHeroEnhancedProps {
  vendor: Vendor | VendorWithRelations;
  onRefreshGleif?: () => void;
  isRefreshing?: boolean;
  isWatchlisted?: boolean;
  onToggleWatchlist?: () => void;
  riskTrend?: number; // positive = improving, negative = worsening
  complianceTrend?: number;
}

export function VendorHeroEnhanced({
  vendor,
  onRefreshGleif,
  isRefreshing,
  isWatchlisted = false,
  onToggleWatchlist,
  riskTrend,
  complianceTrend,
}: VendorHeroEnhancedProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [watchlisted, setWatchlisted] = useState(isWatchlisted);

  const isCritical = vendor.supports_critical_function;

  // Map tier to numeric value for TierBadge
  const tierValue = vendor.tier === 'critical' ? 1 : vendor.tier === 'important' ? 2 : 3;

  // Calculate DORA compliance score
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

  // Calculate data freshness
  const lastUpdated = vendor.gleif_fetched_at || vendor.updated_at;

  // Determine if there are warnings to show
  const warnings: string[] = [];
  if (!vendor.lei) warnings.push('No LEI registered');
  if (!vendor.last_assessment_date) warnings.push('Never assessed');
  if (vendor.lei_status === 'LAPSED') warnings.push('LEI has lapsed');
  if (vendor.tier === 'critical' && !vendor.supports_critical_function) {
    warnings.push('Critical tier but no critical functions defined');
  }

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

  const handleToggleWatchlist = () => {
    setWatchlisted(!watchlisted);
    onToggleWatchlist?.();
    toast.success(watchlisted ? 'Removed from watchlist' : 'Added to watchlist');
  };

  return (
    <div className="space-y-4">
      {/* Warning Banner */}
      {warnings.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Attention Required
            </p>
            <ul className="mt-1 text-sm text-amber-700 dark:text-amber-300 space-y-0.5">
              {warnings.map((warning, i) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Hero Section */}
      <div className="card-premium p-6">
        <div className="space-y-4">
          {/* Top Row: Name, Watchlist, and Actions */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight truncate">
                  {vendor.name}
                </h1>
                {isCritical && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                    <Shield className="h-3 w-3" />
                    Critical Function
                  </Badge>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleToggleWatchlist}
                        className={cn(
                          'p-1.5 rounded-md transition-colors',
                          watchlisted
                            ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/50'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <Star className={cn('h-5 w-5', watchlisted && 'fill-current')} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {watchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {providerLabel && (
                  <p className="text-muted-foreground">{providerLabel}</p>
                )}
                <DataFreshnessBadge lastUpdated={lastUpdated} />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <Send className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Request SOC 2</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Schedule Assessment</TooltipContent>
                </Tooltip>
              </TooltipProvider>

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
                  <DropdownMenuItem asChild>
                    <Link href={`/documents?vendor=${vendor.id}`}>
                      <FileText className="h-4 w-4 mr-2" />
                      View Documents
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onRefreshGleif} disabled={isRefreshing}>
                    <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
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

          {/* Status Indicators with Trends */}
          <div className="flex items-center gap-4 flex-wrap py-3 border-y border-border/50">
            <TierBadge tier={tierValue} ctpp={vendor.is_ctpp} showLabel />

            <div className="w-px h-6 bg-border" />

            {riskGrade ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Risk:</span>
                <GradeBadge grade={riskGrade} size="sm" />
                {riskTrend !== undefined && riskTrend !== 0 && (
                  <TrendIndicator value={riskTrend} format="number" size="sm" invertColors />
                )}
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
              {complianceTrend !== undefined && complianceTrend !== 0 && (
                <TrendIndicator value={complianceTrend} format="percent" size="sm" />
              )}
            </div>

            <div className="w-px h-6 bg-border" />

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {vendor.last_assessment_date
                  ? `Assessed ${new Date(vendor.last_assessment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : 'Never assessed'}
              </span>
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
    </div>
  );
}
