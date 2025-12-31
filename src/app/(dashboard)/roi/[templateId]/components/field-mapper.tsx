'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, Database, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';

// Serializable version of ColumnMapping (without transform function)
interface SerializableColumn {
  esaCode: string;
  dbColumn: string;
  dbTable: string;
  description: string;
  required: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  enumeration?: Record<string, string>;
}

interface FieldMapperProps {
  columns: SerializableColumn[];
}

export function FieldMapper({ columns }: FieldMapperProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const displayColumns = isExpanded ? columns : columns.slice(0, 6);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Database className="h-4 w-4 text-muted-foreground" />
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-base">Field Mapping</CardTitle>
          </div>
          <Badge variant="outline">{columns.length} columns</Badge>
        </div>
        <CardDescription>
          Database fields mapped to ESA xBRL-CSV column codes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayColumns.map((col) => (
            <FieldMappingRow key={col.esaCode} column={col} />
          ))}
        </div>

        {columns.length > 6 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show all {columns.length} columns
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface FieldMappingRowProps {
  column: SerializableColumn;
}

function FieldMappingRow({ column }: FieldMappingRowProps) {
  const typeColors: Record<string, string> = {
    string: 'bg-blue-100 text-blue-800',
    number: 'bg-green-100 text-green-800',
    date: 'bg-purple-100 text-purple-800',
    boolean: 'bg-orange-100 text-orange-800',
    enum: 'bg-pink-100 text-pink-800',
  };

  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      {/* Database column */}
      <div className="flex-1 min-w-0">
        <code className="text-xs font-mono text-muted-foreground truncate block">
          {column.dbColumn}
        </code>
      </div>

      {/* Arrow */}
      <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />

      {/* ESA Code */}
      <div className="w-16 flex-shrink-0">
        <Badge variant="outline" className="font-mono text-xs">
          {column.esaCode}
        </Badge>
      </div>

      {/* Column name */}
      <div className="flex-1 min-w-0">
        <span className="text-sm truncate block">{column.description}</span>
      </div>

      {/* Type badge */}
      <Badge className={cn('text-xs capitalize flex-shrink-0', typeColors[column.dataType] || 'bg-gray-100 text-gray-800')}>
        {column.dataType}
      </Badge>

      {/* Required indicator */}
      {column.required && (
        <span className="text-red-500 text-xs flex-shrink-0">*</span>
      )}
    </div>
  );
}
