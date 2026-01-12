'use client';

/**
 * Split Evidence View
 *
 * Side-by-side view showing:
 * - Left panel: Extracted data (controls, exceptions, etc.)
 * - Right panel: Source PDF document with highlighting
 *
 * This is our 10X differentiator - NO competitor offers this feature.
 * Key capabilities:
 * - Click on extracted item → PDF scrolls to exact location
 * - Evidence highlighting with confidence scores
 * - Resizable split panels
 * - Full audit trail per evidence item
 */

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
  Suspense,
} from 'react';
import dynamic from 'next/dynamic';
import { GripVertical, PanelLeftClose, PanelRightClose, FileText, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PDFHighlight } from '@/components/documents/pdf-viewer';

// Lazy load PDF viewer - pdfjs-dist is 36MB
const PDFViewer = dynamic(
  () => import('@/components/documents/pdf-viewer').then(mod => ({ default: mod.PDFViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading PDF viewer...</span>
      </div>
    ),
  }
);

interface SplitEvidenceViewProps {
  /** URL to the PDF document */
  pdfUrl: string;
  /** Highlights to show on the PDF */
  highlights?: PDFHighlight[];
  /** Currently selected evidence item ID */
  selectedEvidenceId?: string;
  /** Callback when evidence is selected */
  onEvidenceSelect?: (evidenceId: string | null) => void;
  /** Left panel content (extracted data) */
  extractedContent: ReactNode;
  /** Left panel header */
  extractedHeader?: ReactNode;
  /** Initial split position (0-100, percentage for left panel) */
  initialSplit?: number;
  /** Minimum panel width in pixels */
  minPanelWidth?: number;
  /** Whether the viewer is in fullscreen mode */
  isFullscreen?: boolean;
  /** Callback to toggle fullscreen */
  onToggleFullscreen?: () => void;
  /** Custom class name */
  className?: string;
}

const DEFAULT_SPLIT = 40; // 40% left, 60% right
const MIN_PANEL_WIDTH = 300;

export function SplitEvidenceView({
  pdfUrl,
  highlights = [],
  selectedEvidenceId,
  onEvidenceSelect,
  extractedContent,
  extractedHeader,
  initialSplit = DEFAULT_SPLIT,
  minPanelWidth = MIN_PANEL_WIDTH,
  isFullscreen = false,
  onToggleFullscreen,
  className,
}: SplitEvidenceViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitPosition, setSplitPosition] = useState(initialSplit);
  const [isDragging, setIsDragging] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Handle resize dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const relativeX = e.clientX - rect.left;
      const newSplit = (relativeX / containerWidth) * 100;

      // Enforce minimum widths
      const minLeftPercent = (minPanelWidth / containerWidth) * 100;
      const maxLeftPercent = 100 - minLeftPercent;

      setSplitPosition(Math.max(minLeftPercent, Math.min(maxLeftPercent, newSplit)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minPanelWidth]);

  // Handle highlight click from PDF
  const handleHighlightClick = useCallback(
    (highlight: PDFHighlight) => {
      onEvidenceSelect?.(highlight.id);
    },
    [onEvidenceSelect]
  );

  // Toggle panel collapse
  const handleToggleLeft = useCallback(() => {
    setLeftCollapsed((prev) => !prev);
    if (rightCollapsed) setRightCollapsed(false);
  }, [rightCollapsed]);

  const handleToggleRight = useCallback(() => {
    setRightCollapsed((prev) => !prev);
    if (leftCollapsed) setLeftCollapsed(false);
  }, [leftCollapsed]);

  // Calculate actual panel widths
  const leftWidth = leftCollapsed ? 0 : rightCollapsed ? 100 : splitPosition;
  const rightWidth = rightCollapsed ? 0 : leftCollapsed ? 100 : 100 - splitPosition;

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-full overflow-hidden bg-background border rounded-lg',
        isDragging && 'select-none cursor-col-resize',
        isFullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
    >
      {/* Left Panel - Extracted Data */}
      <div
        className={cn(
          'flex flex-col border-r bg-background transition-all duration-200',
          leftCollapsed && 'w-0 border-r-0 overflow-hidden'
        )}
        style={{
          width: leftCollapsed ? 0 : `${leftWidth}%`,
          minWidth: leftCollapsed ? 0 : minPanelWidth,
        }}
      >
        {/* Left Panel Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">
              {extractedHeader || 'Extracted Data'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleToggleLeft}
            aria-label={leftCollapsed ? 'Expand left panel' : 'Collapse left panel'}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        {/* Left Panel Content */}
        <div className="flex-1 overflow-auto">{extractedContent}</div>
      </div>

      {/* Resize Handle */}
      {!leftCollapsed && !rightCollapsed && (
        <div
          className={cn(
            'flex items-center justify-center w-1.5 cursor-col-resize',
            'bg-border hover:bg-primary/20 transition-colors',
            isDragging && 'bg-primary/30'
          )}
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Right Panel - PDF Viewer */}
      <div
        className={cn(
          'flex flex-col bg-muted/10 transition-all duration-200',
          rightCollapsed && 'w-0 overflow-hidden'
        )}
        style={{
          width: rightCollapsed ? 0 : `${rightWidth}%`,
          minWidth: rightCollapsed ? 0 : minPanelWidth,
        }}
      >
        {/* Right Panel Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Source Document</span>
            {highlights.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {highlights.length} evidence markers
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onToggleFullscreen && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onToggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleToggleRight}
              aria-label={rightCollapsed ? 'Expand right panel' : 'Collapse right panel'}
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          <PDFViewer
            url={pdfUrl}
            highlights={highlights}
            selectedHighlightId={selectedEvidenceId}
            onHighlightClick={handleHighlightClick}
            showThumbnails={!isFullscreen}
            showControls={true}
            className="h-full"
          />
        </div>
      </div>

      {/* Collapsed Panel Indicators */}
      {leftCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
          onClick={handleToggleLeft}
        >
          <PanelLeftClose className="h-4 w-4 rotate-180" />
        </Button>
      )}
      {rightCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
          onClick={handleToggleRight}
        >
          <PanelRightClose className="h-4 w-4 rotate-180" />
        </Button>
      )}
    </div>
  );
}
