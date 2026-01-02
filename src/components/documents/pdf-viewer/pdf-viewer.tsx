'use client';

/**
 * PDF Viewer Component
 *
 * Interactive PDF viewer with highlighting support for evidence traceability.
 * Uses pdfjs-dist for rendering and supports:
 * - Page navigation and thumbnails
 * - Zoom controls
 * - Evidence highlight overlays
 * - Scroll-to-highlight functionality
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
} from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, FileWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PDFPage } from './pdf-page';
import { PDFControls } from './pdf-controls';
import { PDFThumbnailBar } from './pdf-thumbnail-bar';
import type { PDFViewerProps, PDFDocumentProxy, PDFHighlight } from './types';

// Configure PDF.js worker
// In Next.js, we need to set the worker source to the CDN
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PDFViewerState {
  pdfDocument: PDFDocumentProxy | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  isLoading: boolean;
  error: string | null;
}

export const PDFViewer = memo(function PDFViewer({
  url,
  initialPage = 1,
  initialZoom = 1.0,
  highlights = [],
  selectedHighlightId,
  onHighlightClick,
  onPageChange,
  onDocumentLoad,
  showThumbnails = true,
  showControls = true,
  className,
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<PDFViewerState>({
    pdfDocument: null,
    currentPage: initialPage,
    totalPages: 0,
    zoom: initialZoom,
    isLoading: true,
    error: null,
  });

  // Memoize highlighted pages for thumbnail bar
  const highlightedPages = useMemo(() => {
    const pages = new Set<number>();
    highlights.forEach((h) => pages.add(h.pageNumber));
    return Array.from(pages);
  }, [highlights]);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      if (!url) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'No document URL provided',
        }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const loadingTask = pdfjsLib.getDocument({
          url,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/cmaps/',
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;

        if (cancelled) {
          pdf.destroy();
          return;
        }

        setState((prev) => ({
          ...prev,
          pdfDocument: pdf,
          totalPages: pdf.numPages,
          currentPage: Math.min(initialPage, pdf.numPages),
          isLoading: false,
        }));

        onDocumentLoad?.(pdf.numPages);
      } catch (err) {
        if (cancelled) return;

        console.error('Error loading PDF:', err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load PDF',
        }));
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
    };
  }, [url, initialPage, onDocumentLoad]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      state.pdfDocument?.destroy();
    };
  }, [state.pdfDocument]);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, state.totalPages));
      setState((prev) => ({ ...prev, currentPage: validPage }));
      onPageChange?.(validPage);
    },
    [state.totalPages, onPageChange]
  );

  // Handle zoom change
  const handleZoomChange = useCallback((zoom: number) => {
    setState((prev) => ({ ...prev, zoom }));
  }, []);

  // Handle highlight click with scroll-to behavior
  const handleHighlightClick = useCallback(
    (highlight: PDFHighlight) => {
      // Navigate to the highlight's page
      if (highlight.pageNumber !== state.currentPage) {
        handlePageChange(highlight.pageNumber);
      }
      onHighlightClick?.(highlight);
    },
    [state.currentPage, handlePageChange, onHighlightClick]
  );

  // Scroll to selected highlight when it changes
  useEffect(() => {
    if (!selectedHighlightId || !highlights.length) return;

    const selectedHighlight = highlights.find(
      (h) => h.id === selectedHighlightId
    );
    if (selectedHighlight && selectedHighlight.pageNumber !== state.currentPage) {
      handlePageChange(selectedHighlight.pageNumber);
    }
  }, [selectedHighlightId, highlights, state.currentPage, handlePageChange]);

  // Render loading state
  if (state.isLoading) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center h-full bg-muted/30',
          className
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Loading document...</p>
      </div>
    );
  }

  // Render error state
  if (state.error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center h-full bg-muted/30',
          className
        )}
      >
        <FileWarning className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm font-medium text-destructive">
          Failed to load document
        </p>
        <p className="text-xs text-muted-foreground mt-1">{state.error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('flex flex-col h-full bg-muted/20', className)}
    >
      {/* Controls bar */}
      {showControls && (
        <PDFControls
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          zoom={state.zoom}
          onPageChange={handlePageChange}
          onZoomChange={handleZoomChange}
          isLoading={state.isLoading}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnail sidebar */}
        {showThumbnails && (
          <PDFThumbnailBar
            pdfDocument={state.pdfDocument}
            currentPage={state.currentPage}
            totalPages={state.totalPages}
            onPageSelect={handlePageChange}
            highlightedPages={highlightedPages}
          />
        )}

        {/* PDF page display area */}
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="flex flex-col items-center p-4 space-y-4">
            {/* Render current page and adjacent pages for smooth scrolling */}
            {[state.currentPage].map((pageNum) => (
              <PDFPage
                key={`page-${pageNum}`}
                pdfDocument={state.pdfDocument}
                pageNumber={pageNum}
                scale={state.zoom}
                highlights={highlights}
                selectedHighlightId={selectedHighlightId}
                onHighlightClick={handleHighlightClick}
                isVisible={true}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Page indicator */}
      <div className="flex items-center justify-center py-2 border-t bg-background/50 text-xs text-muted-foreground">
        Page {state.currentPage} of {state.totalPages}
        {highlights.length > 0 && (
          <span className="ml-2">
            ({highlights.filter((h) => h.pageNumber === state.currentPage).length}{' '}
            evidence markers on this page)
          </span>
        )}
      </div>
    </div>
  );
});
