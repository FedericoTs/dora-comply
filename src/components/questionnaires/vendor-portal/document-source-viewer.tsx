'use client';

/**
 * Document Source Viewer
 *
 * Full-screen side sheet for viewing AI answer sources with question context.
 * Shows the question, AI answer, and the source document side by side.
 */

import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PDFViewer } from '@/components/documents/pdf-viewer/pdf-viewer';
import type { TemplateQuestion, QuestionnaireAnswer, QuestionnaireDocument } from '@/lib/nis2-questionnaire/types';

interface SourceContext {
  question: TemplateQuestion;
  answer: QuestionnaireAnswer;
  document: QuestionnaireDocument;
  pageNumber: number;
}

interface DocumentSourceViewerProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  sourceContext: SourceContext | null;
  documents: QuestionnaireDocument[];
  allSources?: SourceContext[]; // For navigation between AI answers
  onNavigate?: (context: SourceContext) => void;
}

// Helper to parse multiselect values for display
function formatAnswerValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'string') {
    // Try to parse JSON array
    if (value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        }
      } catch {
        // Not valid JSON
      }
    }
    // Boolean values
    if (value === 'true') return 'Yes';
    if (value === 'false') return 'No';
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value || '');
}

export function DocumentSourceViewer({
  isOpen,
  onClose,
  token,
  sourceContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- available for future use
  documents: _documents,
  allSources = [],
  onNavigate,
}: DocumentSourceViewerProps) {
  const [isFullWidth, setIsFullWidth] = useState(false);

  // Compute current index based on sourceContext (memoized, no setState in effect)
  const currentIndex = useMemo(() => {
    if (sourceContext && allSources.length > 0) {
      const idx = allSources.findIndex(
        (s) => s.question.id === sourceContext.question.id
      );
      return idx >= 0 ? idx : 0;
    }
    return 0;
  }, [sourceContext, allSources]);

  if (!sourceContext) return null;

  const { question, answer, document: doc, pageNumber } = sourceContext;
  const documentUrl = `/api/vendor-portal/${token}/documents/${doc.id}/download`;
  const answerText = answer.answer_text || answer.answer_json;

  // Navigation helpers
  const canGoBack = allSources.length > 0 && currentIndex > 0;
  const canGoForward = allSources.length > 0 && currentIndex < allSources.length - 1;

  const handlePrevious = () => {
    if (canGoBack && onNavigate) {
      onNavigate(allSources[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (canGoForward && onNavigate) {
      onNavigate(allSources[currentIndex + 1]);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          'flex flex-col p-0 gap-0 transition-all duration-200',
          isFullWidth ? 'w-full max-w-full' : 'w-[90vw] max-w-5xl'
        )}
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b bg-background flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-emerald-600" />
              <span className="truncate">{doc.file_name}</span>
            </SheetTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullWidth(!isFullWidth)}
                className="h-8 w-8 p-0"
              >
                {isFullWidth ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Question Context Panel */}
        <div className="px-4 py-3 border-b bg-emerald-50/50 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Sparkles className="h-3 w-3" />
                  AI Extracted
                </Badge>
                {answer.ai_confidence && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      answer.ai_confidence >= 0.8
                        ? 'border-emerald-500 text-emerald-700'
                        : answer.ai_confidence >= 0.6
                        ? 'border-amber-500 text-amber-700'
                        : 'border-gray-400 text-gray-600'
                    )}
                  >
                    {Math.round(answer.ai_confidence * 100)}% confidence
                  </Badge>
                )}
              </div>
              <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                {question.question_text}
              </h3>
              <p className="text-sm text-emerald-800 bg-emerald-100/50 px-2 py-1 rounded">
                <span className="font-medium">AI Answer:</span>{' '}
                {formatAnswerValue(answerText)}
              </p>
              {answer.ai_citation && (
                <p className="text-xs text-gray-500 mt-1">
                  Citation: {answer.ai_citation}
                </p>
              )}
            </div>

            {/* Navigation buttons */}
            {allSources.length > 1 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={!canGoBack}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-gray-500 min-w-[4rem] text-center">
                  {currentIndex + 1} / {allSources.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={!canGoForward}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* PDF Viewer - Takes remaining space */}
        <div className="flex-1 overflow-hidden">
          <PDFViewer
            url={documentUrl}
            initialPage={pageNumber}
            showThumbnails={true}
            showControls={true}
            className="h-full"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
