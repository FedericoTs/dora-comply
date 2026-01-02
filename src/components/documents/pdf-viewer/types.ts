/**
 * PDF Viewer Types
 *
 * Type definitions for the PDF viewer and highlighting system.
 * Used for evidence traceability in compliance documents.
 */

import type {
  PDFDocumentProxy as PdfjsDocumentProxy,
  PDFPageProxy as PdfjsPageProxy,
} from 'pdfjs-dist';

// Re-export with our own names for consistency
export type PDFDocumentProxy = PdfjsDocumentProxy;
export type PDFPageProxy = PdfjsPageProxy;

export interface PDFViewerProps {
  /** URL to the PDF document (signed URL from Supabase) */
  url: string;
  /** Initial page to display */
  initialPage?: number;
  /** Initial zoom level (0.5 - 3.0) */
  initialZoom?: number;
  /** Highlights to display on the document */
  highlights?: PDFHighlight[];
  /** Currently selected highlight ID */
  selectedHighlightId?: string;
  /** Callback when a highlight is clicked */
  onHighlightClick?: (highlight: PDFHighlight) => void;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Callback when document loads */
  onDocumentLoad?: (numPages: number) => void;
  /** Whether to show the thumbnail sidebar */
  showThumbnails?: boolean;
  /** Whether to show the control bar */
  showControls?: boolean;
  /** Custom class name */
  className?: string;
}

export interface PDFHighlight {
  /** Unique identifier for the highlight */
  id: string;
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Bounding box as percentages (0-100) for responsive positioning */
  boundingBox: BoundingBox;
  /** Color of the highlight */
  color?: HighlightColor;
  /** Optional label to display */
  label?: string;
  /** Evidence type for styling */
  evidenceType?: 'control' | 'exception' | 'cuec' | 'subservice' | 'finding';
  /** Extracted text content */
  extractedText?: string;
  /** Confidence score (0-1) */
  confidence?: number;
}

export interface BoundingBox {
  /** X position as percentage (0-100) */
  x: number;
  /** Y position as percentage (0-100) */
  y: number;
  /** Width as percentage (0-100) */
  width: number;
  /** Height as percentage (0-100) */
  height: number;
}

export type HighlightColor =
  | 'yellow'
  | 'green'
  | 'blue'
  | 'red'
  | 'orange'
  | 'purple';

export interface PDFPageProps {
  /** The PDF document proxy from pdfjs-dist */
  pdfDocument: PDFDocumentProxy | null;
  /** Page number to render (1-indexed) */
  pageNumber: number;
  /** Zoom scale (1 = 100%) */
  scale: number;
  /** Highlights for this specific page */
  highlights?: PDFHighlight[];
  /** Currently selected highlight ID */
  selectedHighlightId?: string;
  /** Callback when a highlight is clicked */
  onHighlightClick?: (highlight: PDFHighlight) => void;
  /** Whether this page is currently visible */
  isVisible?: boolean;
  /** Custom class name */
  className?: string;
}

export interface PDFControlsProps {
  /** Current page number */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Current zoom level */
  zoom: number;
  /** Callback to change page */
  onPageChange: (page: number) => void;
  /** Callback to change zoom */
  onZoomChange: (zoom: number) => void;
  /** Whether document is loading */
  isLoading?: boolean;
  /** Custom class name */
  className?: string;
}

export interface PDFThumbnailBarProps {
  /** The PDF document proxy */
  pdfDocument: PDFDocumentProxy | null;
  /** Current page number */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when thumbnail is clicked */
  onPageSelect: (page: number) => void;
  /** Pages with highlights */
  highlightedPages?: number[];
  /** Custom class name */
  className?: string;
}

export interface PDFHighlightLayerProps {
  /** Highlights to render */
  highlights: PDFHighlight[];
  /** Currently selected highlight ID */
  selectedHighlightId?: string;
  /** Callback when highlight is clicked */
  onHighlightClick?: (highlight: PDFHighlight) => void;
  /** Container width for scaling */
  containerWidth: number;
  /** Container height for scaling */
  containerHeight: number;
}

