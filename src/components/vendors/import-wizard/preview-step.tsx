'use client';

import { Check, X, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ImportPreview } from '@/lib/vendors/csv-import';

interface PreviewStepProps {
  preview: ImportPreview;
}

export function PreviewStep({ preview }: PreviewStepProps) {
  const hasDuplicates = preview.duplicateLEIs.length > 0 || preview.duplicateNames.length > 0;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="text-2xl font-semibold">{preview.totalRows}</div>
          <div className="text-sm text-muted-foreground">Total Rows</div>
        </div>
        <div className="p-3 rounded-lg bg-green-50">
          <div className="text-2xl font-semibold text-green-700">{preview.validRows}</div>
          <div className="text-sm text-green-600">Valid</div>
        </div>
        <div className="p-3 rounded-lg bg-red-50">
          <div className="text-2xl font-semibold text-red-700">{preview.invalidRows}</div>
          <div className="text-sm text-red-600">Invalid</div>
        </div>
        <div className="p-3 rounded-lg bg-amber-50">
          <div className="text-2xl font-semibold text-amber-700">
            {preview.duplicateLEIs.length + preview.duplicateNames.length}
          </div>
          <div className="text-sm text-amber-600">Duplicates</div>
        </div>
      </div>

      {/* Warnings */}
      {hasDuplicates && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
          <div className="flex items-center gap-2 font-medium text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Duplicate entries detected
          </div>
          {preview.duplicateLEIs.length > 0 && (
            <p className="mt-1 text-amber-700">
              Duplicate LEIs: {preview.duplicateLEIs.join(', ')}
            </p>
          )}
          {preview.duplicateNames.length > 0 && (
            <p className="mt-1 text-amber-700">
              Duplicate names: {preview.duplicateNames.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Data preview table */}
      <ScrollArea className="h-[300px] border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Row</TableHead>
              <TableHead className="w-[60px]">Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>LEI</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Issues</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.rows.slice(0, 50).map((row) => (
              <TableRow
                key={row.rowIndex}
                className={cn(!row.isValid && 'bg-red-50')}
              >
                <TableCell className="text-muted-foreground">{row.rowIndex}</TableCell>
                <TableCell>
                  {row.isValid ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" />
                      OK
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <X className="h-3 w-3 mr-1" />
                      Error
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-medium">{row.data.name || '(empty)'}</TableCell>
                <TableCell className="font-mono text-sm">
                  {row.data.lei || '-'}
                </TableCell>
                <TableCell>
                  {row.data.tier && (
                    <Badge variant="outline">{row.data.tier}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-destructive max-w-[200px]">
                  {row.errors.map((e) => e.message).join('; ')}
                  {row.warnings.length > 0 && (
                    <span className="text-amber-600">
                      {row.warnings.join('; ')}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {preview.rows.length > 50 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing first 50 of {preview.rows.length} rows
        </p>
      )}
    </div>
  );
}
