'use client';

/**
 * Export Buttons Component
 *
 * Client component for downloading SOC 2 analysis in PDF or Excel format
 */

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ExportButtonsProps {
  documentId: string;
  documentName: string;
}

export function ExportButtons({ documentId, documentName }: ExportButtonsProps) {
  const [loading, setLoading] = useState<'pdf' | 'xlsx' | null>(null);

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    setLoading(format);

    try {
      const response = await fetch(`/api/documents/${documentId}/export?format=${format}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SOC2-Analysis-${documentName.replace(/\.[^/.]+$/, '')}.${format}`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`${format.toUpperCase()} exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export report');
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading !== null}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={loading !== null}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4 text-red-500" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('xlsx')}
          disabled={loading !== null}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
