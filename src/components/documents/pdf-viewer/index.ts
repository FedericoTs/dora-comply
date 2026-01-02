/**
 * PDF Viewer Module
 *
 * Interactive PDF viewer with evidence highlighting support.
 * Key features:
 * - Page navigation with thumbnails
 * - Zoom controls
 * - Evidence highlight overlays
 * - Scroll-to-highlight functionality
 */

export { PDFViewer } from './pdf-viewer';
export { PDFPage } from './pdf-page';
export { PDFControls } from './pdf-controls';
export { PDFHighlightLayer } from './pdf-highlight-layer';
export { PDFThumbnailBar } from './pdf-thumbnail-bar';

export type {
  PDFViewerProps,
  PDFPageProps,
  PDFControlsProps,
  PDFThumbnailBarProps,
  PDFHighlightLayerProps,
  PDFHighlight,
  BoundingBox,
  HighlightColor,
} from './types';
