'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  FileCheck,
  Package,
  ChevronDown,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Building2,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface PackageInfo {
  parameters: {
    entityId: string;
    refPeriod: string;
    baseCurrency: string;
  };
  organization: {
    lei: string;
    name: string;
  };
  summary: {
    totalTemplates: number;
    totalRows: number;
    templatesWithData: number;
  };
  downloadUrl: string;
}

export function ExportControls() {
  const [isExporting, setIsExporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const response = await fetch('/api/roi/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeAiSuggestions: true }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.data.summary.isValid) {
          toast.success('Validation Passed', {
            description: 'All templates pass ESA validation rules.',
          });
        } else {
          toast.warning('Validation Issues Found', {
            description: `${data.data.summary.totalErrors} errors, ${data.data.summary.totalWarnings} warnings found.`,
          });
        }
      } else {
        toast.error('Validation Failed', {
          description: data.error?.message || 'An error occurred',
        });
      }
    } catch {
      toast.error('Validation Failed', {
        description: 'Could not connect to validation service',
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Prepare package and show confirmation dialog
  const handlePrepareExport = async () => {
    setIsPreparing(true);
    try {
      const response = await fetch('/api/roi/package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validateFirst: true }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error('Export Failed', {
          description: data.error?.message || 'Could not prepare package',
        });
        return;
      }

      setPackageInfo(data.data);
      setShowDownloadDialog(true);
    } catch {
      toast.error('Export Failed', {
        description: 'Could not generate RoI package',
      });
    } finally {
      setIsPreparing(false);
    }
  };

  // Execute the actual download
  const handleDownload = () => {
    if (!packageInfo) return;

    setIsExporting(true);
    window.location.href = packageInfo.downloadUrl;

    toast.success('Download Started', {
      description: `Downloading RoI package with ${packageInfo.summary.totalRows} records.`,
    });

    setTimeout(() => {
      setIsExporting(false);
      setShowDownloadDialog(false);
      setPackageInfo(null);
    }, 1000);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleValidate}
          disabled={isValidating}
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <FileCheck className="h-4 w-4 mr-2" />
          )}
          Validate
        </Button>

        {/* Prominent One-Click Export Button */}
        <Button
          size="sm"
          onClick={handlePrepareExport}
          disabled={isPreparing || isExporting}
          className="bg-primary hover:bg-primary/90"
        >
          {isPreparing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Package className="h-4 w-4 mr-2" />
          )}
          Download RoI
        </Button>

        {/* Dropdown for individual templates */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="px-2">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onClick={handlePrepareExport}>
              <Package className="h-4 w-4 mr-2" />
              Download Full Package (ZIP)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* B_01.xx - Entity Information */}
            <DropdownMenuItem asChild>
              <a href="/api/roi/b_01_01/export" download>
                <Download className="h-4 w-4 mr-2" />
                Entity Maintaining Register (B_01.01)
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/api/roi/b_01_02/export" download>
                <Download className="h-4 w-4 mr-2" />
                Entities in Scope (B_01.02)
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/api/roi/b_01_03/export" download>
                <Download className="h-4 w-4 mr-2" />
                Branches (B_01.03)
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* B_02.xx - Contractual Arrangements */}
            <DropdownMenuItem asChild>
              <a href="/api/roi/b_02_01/export" download>
                <Download className="h-4 w-4 mr-2" />
                Arrangements Overview (B_02.01)
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/api/roi/b_02_02/export" download>
                <Download className="h-4 w-4 mr-2" />
                Arrangements Details (B_02.02)
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/api/roi/b_02_03/export" download>
                <Download className="h-4 w-4 mr-2" />
                Linked Arrangements (B_02.03)
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* B_03.xx - Linkage Tables */}
            <DropdownMenuItem asChild>
              <a href="/api/roi/b_03_01/export" download>
                <Download className="h-4 w-4 mr-2" />
                Entity-Arrangement Links (B_03.01)
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/api/roi/b_03_02/export" download>
                <Download className="h-4 w-4 mr-2" />
                Provider-Arrangement Links (B_03.02)
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/api/roi/b_03_03/export" download>
                <Download className="h-4 w-4 mr-2" />
                Intra-Group Links (B_03.03)
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* B_04.xx - B_07.xx - Entities & Functions */}
            <DropdownMenuItem asChild>
              <a href="/api/roi/b_04_01/export" download>
                <Download className="h-4 w-4 mr-2" />
                Service Recipients (B_04.01)
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/api/roi/b_05_01/export" download>
                <Download className="h-4 w-4 mr-2" />
                ICT Providers (B_05.01)
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/api/roi/b_05_02/export" download>
                <Download className="h-4 w-4 mr-2" />
                Subcontracting (B_05.02)
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/api/roi/b_06_01/export" download>
                <Download className="h-4 w-4 mr-2" />
                Critical Functions (B_06.01)
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/api/roi/b_07_01/export" download>
                <Download className="h-4 w-4 mr-2" />
                Exit Arrangements (B_07.01)
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* B_99.xx - Reference Data */}
            <DropdownMenuItem asChild>
              <a href="/api/roi/b_99_01/export" download>
                <Download className="h-4 w-4 mr-2" />
                Lookup Values (B_99.01)
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Download Confirmation Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Download RoI Package
            </DialogTitle>
            <DialogDescription>
              Your complete Register of Information is ready for download
            </DialogDescription>
          </DialogHeader>

          {packageInfo && (
            <div className="space-y-4 py-4">
              {/* Organization Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{packageInfo.organization.name || 'Your Organization'}</p>
                  <p className="text-xs text-muted-foreground font-mono">{packageInfo.organization.lei}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <FileSpreadsheet className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{packageInfo.summary.templatesWithData}</p>
                  <p className="text-xs text-muted-foreground">Templates</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{packageInfo.summary.totalRows}</p>
                  <p className="text-xs text-muted-foreground">Records</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-bold">{packageInfo.parameters.refPeriod}</p>
                  <p className="text-xs text-muted-foreground">Period</p>
                </div>
              </div>

              <Separator />

              {/* Package Contents */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Package Contents:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    xBRL-CSV Format
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {packageInfo.summary.totalTemplates} Templates
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    ESA Compliant
                  </Badge>
                </div>
              </div>

              {/* Warning if no data */}
              {packageInfo.summary.totalRows === 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <p>No data found. Complete the RoI templates before exporting.</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDownloadDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={isExporting || !packageInfo || packageInfo.summary.totalRows === 0}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download ZIP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
