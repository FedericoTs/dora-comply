'use client';

/**
 * PDF Thumbnail Bar
 *
 * Sidebar showing page thumbnails for quick navigation.
 * Highlights pages that contain evidence markers.
 */

import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PDFThumbnailBarProps, PDFPageProxy } from './types';

interface ThumbnailProps {
  pdfDocument: PDFThumbnailBarProps['pdfDocument'];
  pageNumber: number;
  isActive: boolean;
  hasHighlights: boolean;
  onClick: () => void;
}

const THUMBNAIL_SCALE = 0.2;
const THUMBNAIL_WIDTH = 100;

const Thumbnail = memo(function Thumbnail({
  pdfDocument,
  pageNumber,
  isActive,
  hasHighlights,
  onClick,
}: ThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderThumbnail() {
      if (!pdfDocument || !canvasRef.current) return;

      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (cancelled) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale: THUMBNAIL_SCALE });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        if (!cancelled) {
          setIsRendered(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error rendering thumbnail:', err);
        }
      }
    }

    renderThumbnail();

    return () => {
      cancelled = true;
    };
  }, [pdfDocument, pageNumber]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative group rounded-md overflow-hidden transition-all duration-200',
        'border-2 hover:border-primary/50',
        isActive
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-transparent'
      )}
      aria-label={`Go to page ${pageNumber}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Canvas thumbnail */}
      <canvas
        ref={canvasRef}
        className={cn(
          'block bg-white transition-opacity duration-200',
          !isRendered && 'opacity-0'
        )}
        style={{ width: THUMBNAIL_WIDTH }}
      />

      {/* Loading placeholder */}
      {!isRendered && (
        <div
          className="bg-muted animate-pulse"
          style={{ width: THUMBNAIL_WIDTH, height: THUMBNAIL_WIDTH * 1.4 }}
        />
      )}

      {/* Page number badge */}
      <div
        className={cn(
          'absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5',
          'text-[10px] font-medium rounded',
          'bg-background/90 border shadow-sm',
          isActive && 'bg-primary text-primary-foreground border-primary'
        )}
      >
        {pageNumber}
      </div>

      {/* Highlight indicator */}
      {hasHighlights && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-500 shadow-sm" />
      )}

      {/* Hover overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-primary/10 opacity-0 transition-opacity',
          'group-hover:opacity-100'
        )}
      />
    </button>
  );
});

export const PDFThumbnailBar = memo(function PDFThumbnailBar({
  pdfDocument,
  currentPage,
  totalPages,
  onPageSelect,
  highlightedPages = [],
  className,
}: PDFThumbnailBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const highlightSet = new Set(highlightedPages);

  // Auto-scroll to current page thumbnail
  useEffect(() => {
    if (!scrollRef.current) return;

    const thumbnailHeight = THUMBNAIL_WIDTH * 1.4 + 16; // Approximate height + gap
    const scrollPosition = (currentPage - 1) * thumbnailHeight - 100;

    scrollRef.current.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: 'smooth',
    });
  }, [currentPage]);

  if (!pdfDocument || totalPages === 0) {
    return (
      <div className={cn('w-28 bg-muted/30 p-2', className)}>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-muted animate-pulse rounded"
              style={{ width: THUMBNAIL_WIDTH, height: THUMBNAIL_WIDTH * 1.4 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-28 bg-muted/30 border-r', className)}>
      <ScrollArea className="h-full" ref={scrollRef}>
        <div className="p-2 space-y-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNumber) => (
              <Thumbnail
                key={pageNumber}
                pdfDocument={pdfDocument}
                pageNumber={pageNumber}
                isActive={pageNumber === currentPage}
                hasHighlights={highlightSet.has(pageNumber)}
                onClick={() => onPageSelect(pageNumber)}
              />
            )
          )}
        </div>
      </ScrollArea>
    </div>
  );
});
