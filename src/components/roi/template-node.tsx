'use client';

/**
 * Template Node Component
 *
 * Visual representation of a template in the relationship diagram
 */

import { useState } from 'react';
import { CheckCircle2, AlertCircle, Circle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { TemplateNode } from '@/lib/roi/template-relationships';

interface TemplateNodeProps {
  node: TemplateNode;
  completeness?: number;
  errorCount?: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  onClick?: () => void;
  onNavigate?: () => void;
  color?: string;
  style?: React.CSSProperties;
}

export function TemplateNodeComponent({
  node,
  completeness = 0,
  errorCount = 0,
  isSelected = false,
  isHighlighted = false,
  isDimmed = false,
  onClick,
  onNavigate,
  color,
  style,
}: TemplateNodeProps) {
  const isComplete = completeness === 100;
  const hasErrors = errorCount > 0;

  const getStatusIcon = () => {
    if (isComplete) {
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    }
    if (hasErrors) {
      return <AlertCircle className="h-3 w-3 text-amber-500" />;
    }
    if (completeness > 0) {
      return <Circle className="h-3 w-3 text-blue-500" />;
    }
    return <Circle className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'absolute transform -translate-x-1/2 -translate-y-1/2',
              'rounded-lg border-2 bg-background p-2 shadow-sm transition-all',
              'min-w-[100px] cursor-pointer',
              isSelected && 'ring-2 ring-primary ring-offset-2',
              isHighlighted && 'ring-2 ring-blue-400 ring-offset-1',
              isDimmed && 'opacity-40',
              !isSelected && !isDimmed && 'hover:shadow-md hover:scale-105'
            )}
            style={{
              borderColor: color || '#e5e7eb',
              ...style,
            }}
            onClick={onClick}
          >
            {/* Header with ID */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {node.id}
              </span>
              {getStatusIcon()}
            </div>

            {/* Name */}
            <p className="text-xs font-medium line-clamp-1">{node.shortName}</p>

            {/* Progress Bar */}
            <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isComplete ? 'bg-green-500' : hasErrors ? 'bg-amber-500' : 'bg-primary'
                )}
                style={{ width: `${completeness}%` }}
              />
            </div>

            {/* Stats */}
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{completeness}%</span>
              {hasErrors && (
                <span className="text-amber-600">{errorCount} errors</span>
              )}
            </div>

            {/* Navigate Button (visible on hover/select) */}
            {onNavigate && isSelected && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-1 h-6 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate();
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="space-y-1">
            <p className="font-medium">{node.name}</p>
            <p className="text-xs text-muted-foreground">
              Template {node.id} • {completeness}% complete
            </p>
            {hasErrors && (
              <p className="text-xs text-amber-600">
                {errorCount} validation {errorCount === 1 ? 'error' : 'errors'}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact node for smaller diagrams
 */
interface CompactNodeProps {
  id: string;
  name: string;
  completeness?: number;
  color?: string;
  onClick?: () => void;
}

export function CompactTemplateNode({
  id,
  name,
  completeness = 0,
  color,
  onClick,
}: CompactNodeProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1 rounded-md border cursor-pointer',
        'transition-colors hover:bg-muted/50'
      )}
      style={{ borderColor: color }}
      onClick={onClick}
    >
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs font-medium">{id}</span>
      <span className="text-xs text-muted-foreground">{name}</span>
      <span className="text-xs ml-auto">{completeness}%</span>
    </div>
  );
}
