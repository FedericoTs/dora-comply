'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  templateId: string;
  hasErrors: boolean;
  rowCount: number;
}

export function ExportButton({ templateId, hasErrors, rowCount }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (rowCount === 0) {
      toast.warning('No data to export', {
        description: 'Add records to this template before exporting.',
      });
      return;
    }

    setIsExporting(true);
    try {
      // Convert B_01.01 → b_01_01 for URL-safe format (replace dot with underscore)
      const urlSafeId = templateId.toLowerCase().replace('.', '_');
      window.location.href = `/api/roi/${urlSafeId}/export`;

      toast.success('Export started', {
        description: `Downloading ${templateId} with ${rowCount} records.`,
      });
    } catch {
      toast.error('Export failed', {
        description: 'Could not download the CSV file.',
      });
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  if (hasErrors) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" disabled className="gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Export
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Fix validation errors before exporting</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleExport}
      disabled={isExporting || rowCount === 0}
      className="gap-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Export CSV
    </Button>
  );
}
