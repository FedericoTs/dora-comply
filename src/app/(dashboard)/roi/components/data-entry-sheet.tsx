'use client';

/**
 * Data Entry Sheet - Enhanced 10X Version
 *
 * Features:
 * - Dual view: Record Grid + Detail Editor
 * - Quick record picker with visual preview
 * - Keyboard navigation (←→ arrows)
 * - Batch selection for bulk operations
 * - LEI search integration
 * - Inline validation
 */

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Loader2,
  ExternalLink,
  FileText,
  Grid3X3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ROI_TEMPLATES,
  getTemplateUrl,
  type RoiTemplateId,
  type TemplateWithStatus,
} from '@/lib/roi/types';
import { useDataEntrySheet } from '@/hooks/use-data-entry-sheet';
import {
  FieldInput,
  RecordListView,
  RecordNavigator,
  DataEntryEmptyState,
} from '@/components/roi';

interface DataEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateWithStatus | null;
  onSave?: () => void;
}

export function DataEntrySheet({
  open,
  onOpenChange,
  template,
  onSave,
}: DataEntrySheetProps) {
  const router = useRouter();
  const sheetRef = useRef<HTMLDivElement>(null);

  const {
    isLoading,
    isSaving,
    records,
    currentIndex,
    values,
    hasChanges,
    viewMode,
    selectedRecords,
    recordPickerOpen,
    leiSearchField,
    leiSearching,
    leiSuggestions,
    fields,
    primaryFields,
    completionStats,
    hasRecords,
    currentRecord,
    setViewMode,
    setRecordPickerOpen,
    navigateToRecord,
    handleValueChange,
    handleLeiSearch,
    handleSelectLei,
    handleSave,
    toggleRecordSelection,
    clearSelection,
  } = useDataEntrySheet({ template, open, onSave });

  if (!template) return null;

  const templateInfo = ROI_TEMPLATES[template.templateId as RoiTemplateId];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col h-full overflow-hidden" ref={sheetRef}>
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg truncate">{template.name}</SheetTitle>
              <SheetDescription className="text-sm">
                {template.templateId} • {templateInfo?.esaReference}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              {hasRecords && records.length > 1 && (
                <div className="flex items-center border rounded-lg p-0.5">
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode('list')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'detail' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode('detail')}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Badge
                variant={completionStats.percent === 100 ? 'default' : 'secondary'}
                className="shrink-0"
              >
                {completionStats.percent}%
              </Badge>
            </div>
          </div>

          {/* Record Navigation */}
          {hasRecords && viewMode === 'detail' && (
            <RecordNavigator
              records={records}
              fields={fields}
              currentIndex={currentIndex}
              currentRecord={currentRecord}
              recordPickerOpen={recordPickerOpen}
              onPickerOpenChange={setRecordPickerOpen}
              onNavigate={navigateToRecord}
            />
          )}

          {/* Keyboard hint */}
          {hasRecords && viewMode === 'detail' && records.length > 1 && (
            <p className="text-xs text-muted-foreground pt-2">
              Use ← → arrow keys to navigate between records
            </p>
          )}
        </SheetHeader>

        {/* Content - scrollable area */}
        <ScrollArea className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : fields.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                This template is auto-generated from relationships
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(getTemplateUrl(template.templateId as RoiTemplateId))}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View in Full Editor
              </Button>
            </div>
          ) : !hasRecords ? (
            <DataEntryEmptyState
              fields={fields}
              values={values}
              leiSearchField={leiSearchField}
              leiSuggestions={leiSuggestions}
              leiSearching={leiSearching}
              onValueChange={handleValueChange}
              onLeiSearch={handleLeiSearch}
              onSelectLei={handleSelectLei}
            />
          ) : viewMode === 'list' ? (
            <RecordListView
              records={records}
              fields={fields}
              primaryFields={primaryFields}
              currentIndex={currentIndex}
              selectedRecords={selectedRecords}
              onNavigate={navigateToRecord}
              onToggleSelection={toggleRecordSelection}
              onClearSelection={clearSelection}
            />
          ) : (
            /* Detail View - Field Editor */
            <div className="p-6 space-y-4">
              {fields.map((field) => (
                <FieldInput
                  key={field.esaCode}
                  field={field}
                  value={values[field.esaCode]}
                  onChange={(v) => handleValueChange(field.esaCode, v)}
                  onLeiSearch={(q) => handleLeiSearch(field.esaCode, q)}
                  showLeiSuggestions={
                    leiSearchField === field.esaCode && leiSuggestions.length > 0
                  }
                  leiSuggestions={leiSuggestions}
                  leiSearching={leiSearching && leiSearchField === field.esaCode}
                  onSelectLei={handleSelectLei}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0 bg-background">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(getTemplateUrl(template.templateId as RoiTemplateId))}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Full Editor
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
