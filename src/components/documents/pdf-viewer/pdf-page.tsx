'use client';

/**
 * PDF Page Component
 *
 * Renders a single PDF page with canvas and optional highlight overlay.
 * Uses pdfjs-dist for rendering with proper scaling.
 */

import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { PDFHighlightLayer } from './pdf-highlight-layer';
import type { PDFPageProps, PDFPageProxy } from './types';

export const PDFPage = memo(function PDFPage({
  pdfDocument,
  pageNumber,
  scale,
  highlights = [],
  selectedHighlightId,
  onHighlightClick,
  isVisible = true,
  className,
}: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<ReturnType<PDFPageProxy['render']> | null>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isRendered, setIsRendered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter highlights for this page
  const pageHighlights = highlights.filter((h) => h.pageNumber === pageNumber);

  const renderPage = useCallback(async () => {
    if (!pdfDocument || !canvasRef.current || !isVisible) return;

    try {
      // Cancel any pending render
      if (renderTaskRef.current) {
        await renderTaskRef.current.promise.catch(() => {});
        renderTaskRef.current = null;
      }

      const page = await pdfDocument.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        setError('Canvas context not available');
        return;
      }

      // Calculate viewport with device pixel ratio for crisp rendering
      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * pixelRatio });
      const displayViewport = page.getViewport({ scale });

      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${displayViewport.width}px`;
      canvas.style.height = `${displayViewport.height}px`;

      // Update container dimensions for highlight overlay
      setDimensions({
        width: displayViewport.width,
        height: displayViewport.height,
      });

      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      await renderTask.promise;

      setIsRendered(true);
      setError(null);
    } catch (err) {
      // Ignore cancelled render errors
      if (err instanceof Error && err.name === 'RenderingCancelledException') {
        return;
      }
      console.error('Error rendering PDF page:', err);
      setError('Failed to render page');
    }
  }, [pdfDocument, pageNumber, scale, isVisible]);

  // Render page when dependencies change
  // Intentional PDF rendering trigger
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    renderPage();

    return () => {
      // Cancel any pending render on cleanup
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [renderPage]);

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted/50 text-muted-foreground',
          className
        )}
        style={{ minHeight: 400 }}
      >
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-block bg-white shadow-md', className)}
      style={{
        width: dimensions.width || 'auto',
        height: dimensions.height || 'auto',
      }}
    >
      {/* PDF Canvas */}
      <canvas
        ref={canvasRef}
        className={cn(
          'block transition-opacity duration-200',
          !isRendered && 'opacity-0'
        )}
      />

      {/* Loading skeleton */}
      {!isRendered && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading page {pageNumber}...</div>
        </div>
      )}

      {/* Highlight overlay */}
      {isRendered && pageHighlights.length > 0 && (
        <PDFHighlightLayer
          highlights={pageHighlights}
          selectedHighlightId={selectedHighlightId}
          onHighlightClick={onHighlightClick}
          containerWidth={dimensions.width}
          containerHeight={dimensions.height}
        />
      )}
    </div>
  );
});
