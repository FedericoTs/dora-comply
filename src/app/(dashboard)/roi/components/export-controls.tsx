'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  FileCheck,
  Package,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export function ExportControls() {
  const [isExporting, setIsExporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // First, prepare the package
      const prepResponse = await fetch('/api/roi/package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validateFirst: true }),
      });

      const prepData = await prepResponse.json();

      if (!prepData.success) {
        toast.error('Export Failed', {
          description: prepData.error?.message || 'Could not prepare package',
        });
        return;
      }

      // Download the package
      window.location.href = prepData.data.downloadUrl;

      toast.success('Export Started', {
        description: `Downloading RoI package with ${prepData.data.summary.totalRows} records.`,
      });
    } catch {
      toast.error('Export Failed', {
        description: 'Could not generate RoI package',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport}>
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
  );
}
