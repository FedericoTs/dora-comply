'use client';

/**
 * Incident Export Button
 *
 * Dropdown button for exporting incident data in DORA-compliant format
 * Supports initial, intermediate, final reports and full summary
 */

import { useState } from 'react';
import { Download, FileText, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface IncidentExportButtonProps {
  incidentId: string;
  incidentRef: string;
  classification: string;
}

type ReportType = 'initial' | 'intermediate' | 'final' | null;

const REPORT_TYPES: { value: ReportType; label: string; description: string; doraOnly?: boolean }[] = [
  {
    value: 'initial',
    label: 'Initial Report (4h)',
    description: 'First notification within 4 hours',
    doraOnly: true,
  },
  {
    value: 'intermediate',
    label: 'Intermediate Report (72h)',
    description: 'Status update within 72 hours',
    doraOnly: true,
  },
  {
    value: 'final',
    label: 'Final Report (1 month)',
    description: 'Complete analysis within 1 month',
    doraOnly: true,
  },
  {
    value: null,
    label: 'Full Summary',
    description: 'Complete incident record'
  },
];

export function IncidentExportButton({
  incidentId,
  incidentRef,
  classification,
}: IncidentExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingType, setExportingType] = useState<ReportType | 'summary' | null>(null);

  const isMajorIncident = classification === 'major';

  const handleExport = async (reportType: ReportType) => {
    setIsExporting(true);
    setExportingType(reportType);

    try {
      // Build URL with query params
      const url = new URL(`/api/incidents/${incidentId}/export`, window.location.origin);
      if (reportType) {
        url.searchParams.set('type', reportType);
      }
      url.searchParams.set('format', 'pdf');

      const response = await fetch(url.toString());

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Export failed');
      }

      // Get the blob and create download
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${incidentRef}_${reportType || 'summary'}_${new Date().toISOString().split('T')[0]}.pdf`;

      // Try to get filename from header
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Export Complete', {
        description: `${reportType ? `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report` : 'Summary'} downloaded`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export Failed', {
        description: error instanceof Error ? error.message : 'Failed to export incident',
      });
    } finally {
      setIsExporting(false);
      setExportingType(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>DORA Article 19 Reports</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {REPORT_TYPES.map((type) => {
          // Skip DORA-specific reports for non-major incidents
          if (type.doraOnly && !isMajorIncident) return null;

          const isCurrentlyExporting = isExporting && exportingType === (type.value || 'summary');

          return (
            <DropdownMenuItem
              key={type.value || 'summary'}
              onClick={() => handleExport(type.value)}
              disabled={isExporting}
              className="flex flex-col items-start py-2 cursor-pointer"
            >
              <div className="flex items-center gap-2 w-full">
                {isCurrentlyExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span className="font-medium">{type.label}</span>
              </div>
              <span className="text-xs text-muted-foreground ml-6">
                {type.description}
              </span>
            </DropdownMenuItem>
          );
        })}
        {!isMajorIncident && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Regulatory reports only available for Major incidents
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
