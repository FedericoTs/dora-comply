'use client';

/**
 * PDF Highlight Layer
 *
 * Renders highlight overlays on top of PDF pages.
 * Supports different evidence types with distinct colors.
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { PDFHighlight, PDFHighlightLayerProps } from './types';

// Light, readable highlight colors - 15% base opacity, 25% on hover
const highlightColors: Record<string, string> = {
  yellow: 'bg-yellow-300/15 border-yellow-500/50 hover:bg-yellow-300/25',
  green: 'bg-green-300/15 border-green-500/50 hover:bg-green-300/25',
  blue: 'bg-blue-300/15 border-blue-500/50 hover:bg-blue-300/25',
  red: 'bg-red-300/15 border-red-500/50 hover:bg-red-300/25',
  orange: 'bg-orange-300/15 border-orange-500/50 hover:bg-orange-300/25',
  purple: 'bg-purple-300/15 border-purple-500/50 hover:bg-purple-300/25',
};

// Evidence type colors - subtle enough to read through
const evidenceTypeColors: Record<string, string> = {
  control: 'bg-blue-300/15 border-blue-500/60 hover:bg-blue-300/25',
  exception: 'bg-red-300/15 border-red-500/60 hover:bg-red-300/25',
  cuec: 'bg-orange-300/15 border-orange-500/60 hover:bg-orange-300/25',
  subservice: 'bg-purple-300/15 border-purple-500/60 hover:bg-purple-300/25',
  finding: 'bg-yellow-300/15 border-yellow-500/60 hover:bg-yellow-300/25',
};

interface HighlightBoxProps {
  highlight: PDFHighlight;
  isSelected: boolean;
  onClick?: (highlight: PDFHighlight) => void;
}

const HighlightBox = memo(function HighlightBox({
  highlight,
  isSelected,
  onClick,
}: HighlightBoxProps) {
  const { boundingBox, color, evidenceType, label, confidence } = highlight;

  // Determine color based on evidence type or explicit color
  const colorClass = evidenceType
    ? evidenceTypeColors[evidenceType]
    : color
    ? highlightColors[color]
    : highlightColors.yellow;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'absolute cursor-pointer border rounded-sm transition-all duration-200',
        colorClass,
        isSelected && 'ring-2 ring-primary ring-offset-1 shadow-lg z-10 border-2 !bg-primary/20',
        !isSelected && 'hover:z-10 hover:border-2'
      )}
      style={{
        left: `${boundingBox.x}%`,
        top: `${boundingBox.y}%`,
        width: `${boundingBox.width}%`,
        height: `${boundingBox.height}%`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(highlight);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(highlight);
        }
      }}
      aria-label={label || `Highlight: ${evidenceType || 'evidence'}`}
    >
      {/* Label badge */}
      {label && (
        <div
          className={cn(
            'absolute -top-6 left-0 px-1.5 py-0.5 text-[10px] font-medium rounded',
            'bg-background/95 border shadow-sm whitespace-nowrap',
            isSelected && 'bg-primary text-primary-foreground border-primary'
          )}
        >
          {label}
          {confidence !== undefined && (
            <span className="ml-1 opacity-70">
              {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
});

export const PDFHighlightLayer = memo(function PDFHighlightLayer({
  highlights,
  selectedHighlightId,
  onHighlightClick,
}: PDFHighlightLayerProps) {
  if (highlights.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="relative w-full h-full pointer-events-auto">
        {highlights.map((highlight) => (
          <HighlightBox
            key={highlight.id}
            highlight={highlight}
            isSelected={highlight.id === selectedHighlightId}
            onClick={onHighlightClick}
          />
        ))}
      </div>
    </div>
  );
});
