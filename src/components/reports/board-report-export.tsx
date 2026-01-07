'use client';

/**
 * Board Report Export Component
 *
 * Dropdown button for exporting DORA compliance board reports
 * in PDF or PowerPoint format.
 */

import { useState } from 'react';
import {
  FileText,
  Presentation,
  Download,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type ExportFormat = 'pdf' | 'pptx';

interface BoardReportExportProps {
  className?: string;
}

export function BoardReportExport({ className }: BoardReportExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setExportingFormat(format);

    try {
      const response = await fetch(`/api/board/report?format=${format}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header or generate default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `DORA-Board-Report.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      toast.success(
        format === 'pdf'
          ? 'PDF report downloaded successfully'
          : 'PowerPoint presentation downloaded successfully'
      );
    } catch (error) {
      console.error('Export error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to export report'
      );
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={className}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Board Report
              <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4 text-red-500" />
          <div className="flex flex-col">
            <span className="font-medium">PDF Report</span>
            <span className="text-xs text-muted-foreground">
              6-page executive summary
            </span>
          </div>
          {isExporting && exportingFormat === 'pdf' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('pptx')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <Presentation className="mr-2 h-4 w-4 text-orange-500" />
          <div className="flex flex-col">
            <span className="font-medium">PowerPoint</span>
            <span className="text-xs text-muted-foreground">
              8-slide presentation
            </span>
          </div>
          {isExporting && exportingFormat === 'pptx' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
