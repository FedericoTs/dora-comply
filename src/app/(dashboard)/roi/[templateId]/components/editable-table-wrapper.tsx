'use client';

/**
 * Editable Table Wrapper
 *
 * Client component that connects EditableDataTable to the API
 * Handles cell updates, optimistic updates, and error handling
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EditableDataTable } from './editable-data-table';
import { templateIdToUrl, type RoiTemplateId } from '@/lib/roi/types';

interface SerializableColumn {
  esaCode: string;
  dbColumn: string;
  dbTable: string;
  description: string;
  required: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  enumeration?: Record<string, string>;
}

interface EditableTableWrapperProps {
  templateId: RoiTemplateId;
  initialData: Record<string, unknown>[];
  columns: SerializableColumn[];
  validationErrors?: Map<number, Set<string>>;
}

export function EditableTableWrapper({
  templateId,
  initialData,
  columns,
  validationErrors,
}: EditableTableWrapperProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Get the URL-formatted template ID
  const templateUrlId = templateIdToUrl(templateId);

  // Handle cell update
  const handleCellUpdate = useCallback(async (
    rowIndex: number,
    columnCode: string,
    value: unknown
  ) => {
    try {
      const response = await fetch(`/api/roi/${templateUrlId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rowIndex,
          columnCode,
          value,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update');
      }

      // Don't show toast for every cell - too noisy
      // toast.success('Saved');
    } catch (error) {
      console.error('Cell update error:', error);
      toast.error('Failed to save changes');
      throw error; // Re-throw to let EditableDataTable handle the error state
    }
  }, [templateUrlId]);

  // Handle row add (placeholder - TODO: implement)
  const handleRowAdd = useCallback(async () => {
    toast.info('Add new record', {
      description: 'This feature will be available soon. Add records through the Vendors or Contracts pages.',
    });
  }, []);

  // Handle row delete (placeholder - TODO: implement)
  const handleRowDelete = useCallback(async (rowIndices: number[]) => {
    toast.info('Delete records', {
      description: `Selected ${rowIndices.length} record(s). Delete through the Vendors or Contracts pages.`,
    });
  }, []);

  return (
    <EditableDataTable
      templateId={templateId}
      data={initialData}
      columns={columns}
      validationErrors={validationErrors}
      onCellUpdate={handleCellUpdate}
      onRowAdd={handleRowAdd}
      onRowDelete={handleRowDelete}
    />
  );
}
