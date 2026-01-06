'use client';

/**
 * Editable Table Wrapper
 *
 * Client component that connects EditableDataTable to the API
 * Handles cell updates, row add/delete, optimistic updates, and undo
 */

import { useCallback, useState, useRef } from 'react';
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

// Undo timeout in ms (10 seconds)
const UNDO_TIMEOUT = 10000;

export function EditableTableWrapper({
  templateId,
  initialData,
  columns,
  validationErrors,
}: EditableTableWrapperProps) {
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown>[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [newRowIndex, setNewRowIndex] = useState<number | null>(null);

  // Store pending deletions for undo
  const pendingDeletions = useRef<Map<string, {
    rows: Array<{ index: number; data: Record<string, unknown> }>;
    timeoutId: NodeJS.Timeout;
  }>>(new Map());

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

      // Update local state
      setData(prev => {
        const newData = [...prev];
        if (newData[rowIndex]) {
          newData[rowIndex] = { ...newData[rowIndex], [columnCode]: value };
        }
        return newData;
      });
    } catch (error) {
      console.error('Cell update error:', error);
      toast.error('Failed to save changes');
      throw error;
    }
  }, [templateUrlId]);

  // Handle row add
  const handleRowAdd = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/roi/${templateUrlId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ record: {} }), // Smart defaults applied server-side
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create record');
      }

      const result = await response.json();

      // Transform the database record back to ESA format for display
      // For now, just add to local state - the table will show a new row
      const newRow: Record<string, unknown> = { _id: result.data?.id };

      // Copy smart defaults that would be visible
      columns.forEach(col => {
        newRow[col.esaCode] = '';
      });

      setData(prev => {
        const newData = [...prev, newRow];
        setNewRowIndex(newData.length - 1); // Mark new row for highlighting
        return newData;
      });

      // Clear new row highlight after animation
      setTimeout(() => setNewRowIndex(null), 2000);

      toast.success('Row added', {
        description: 'Edit the new row to fill in the details.',
      });

      // Refresh data to get server-transformed values
      router.refresh();
    } catch (error) {
      console.error('Row add error:', error);
      toast.error('Failed to add row', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [templateUrlId, columns, router]);

  // Handle row delete with undo
  const handleRowDelete = useCallback(async (rowIndices: number[]) => {
    if (rowIndices.length === 0) return;

    // Store rows for potential undo
    const rowsToDelete = rowIndices
      .map(index => ({ index, data: data[index] }))
      .filter(row => row.data);

    if (rowsToDelete.length === 0) return;

    // Generate unique deletion ID
    const deletionId = `del_${Date.now()}`;

    // Optimistic removal
    setData(prev => prev.filter((_, idx) => !rowIndices.includes(idx)));

    // Show undo toast
    const toastId = toast('Row deleted', {
      description: rowIndices.length > 1
        ? `${rowIndices.length} rows removed`
        : 'Row removed',
      action: {
        label: 'Undo',
        onClick: () => {
          // Cancel the deletion
          const pending = pendingDeletions.current.get(deletionId);
          if (pending) {
            clearTimeout(pending.timeoutId);
            pendingDeletions.current.delete(deletionId);

            // Restore rows
            setData(prev => {
              const restored = [...prev];
              pending.rows.forEach(({ index, data: rowData }) => {
                restored.splice(index, 0, rowData);
              });
              return restored;
            });

            toast.success('Restored', { id: toastId });
          }
        },
      },
      duration: UNDO_TIMEOUT,
    });

    // Set up delayed API call
    const timeoutId = setTimeout(async () => {
      const pending = pendingDeletions.current.get(deletionId);
      if (!pending) return; // Was undone

      try {
        const response = await fetch(`/api/roi/${templateUrlId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rowIndices }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to delete');
        }

        pendingDeletions.current.delete(deletionId);
        router.refresh();
      } catch (error) {
        console.error('Row delete error:', error);

        // Restore rows on error
        setData(prev => {
          const restored = [...prev];
          pending.rows.forEach(({ index, data: rowData }) => {
            restored.splice(index, 0, rowData);
          });
          return restored;
        });

        toast.error('Failed to delete', {
          description: error instanceof Error ? error.message : 'Please try again.',
        });

        pendingDeletions.current.delete(deletionId);
      }
    }, UNDO_TIMEOUT);

    // Store pending deletion
    pendingDeletions.current.set(deletionId, {
      rows: rowsToDelete,
      timeoutId,
    });
  }, [data, templateUrlId, router]);

  return (
    <EditableDataTable
      templateId={templateId}
      data={data}
      columns={columns}
      validationErrors={validationErrors}
      onCellUpdate={handleCellUpdate}
      onRowAdd={handleRowAdd}
      onRowDelete={handleRowDelete}
      newRowIndex={newRowIndex}
      isLoading={isLoading}
    />
  );
}
