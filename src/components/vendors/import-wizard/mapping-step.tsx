'use client';

import { ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  VENDOR_IMPORT_FIELDS,
  type ParsedCSV,
  type ColumnMapping,
  type VendorImportField,
} from '@/lib/vendors/csv-import';

interface MappingStepProps {
  parsedCSV: ParsedCSV;
  mappings: ColumnMapping[];
  onMappingChange: (csvColumn: string, vendorField: VendorImportField | null) => void;
}

export function MappingStep({ parsedCSV, mappings, onMappingChange }: MappingStepProps) {
  const hasNameMapped = mappings.some((m) => m.vendorField === 'name');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowRightLeft className="h-4 w-4" />
        Map your CSV columns to vendor fields. Required fields are marked with *.
      </div>

      <ScrollArea className="h-[400px] border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CSV Column</TableHead>
              <TableHead>Sample Data</TableHead>
              <TableHead>Map To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map((mapping) => {
              const column = parsedCSV.columns.find((c) => c.header === mapping.csvColumn);
              return (
                <TableRow key={mapping.csvColumn}>
                  <TableCell className="font-medium">{mapping.csvColumn}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {column?.sampleValues.filter(Boolean).join(', ') || '(empty)'}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={mapping.vendorField || 'none'}
                      onValueChange={(value) =>
                        onMappingChange(
                          mapping.csvColumn,
                          value === 'none' ? null : (value as VendorImportField)
                        )
                      }
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Skip this column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Skip this column</SelectItem>
                        {Object.entries(VENDOR_IMPORT_FIELDS).map(([key, field]) => {
                          const alreadyMapped = mappings.some(
                            (m) => m.vendorField === key && m.csvColumn !== mapping.csvColumn
                          );
                          return (
                            <SelectItem
                              key={key}
                              value={key}
                              disabled={alreadyMapped}
                            >
                              {field.label}
                              {field.required && ' *'}
                              {alreadyMapped && ' (mapped)'}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>

      {!hasNameMapped && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          You must map a column to &quot;Vendor Name&quot; to continue.
        </div>
      )}
    </div>
  );
}
