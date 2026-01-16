'use client';

/**
 * Framework Selector Component
 *
 * Multi-select component for enabling/selecting compliance frameworks.
 * Used in settings and dashboard contexts.
 */

import { useState } from 'react';
import { Check, ChevronsUpDown, Shield, Layers, FileText, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  FrameworkCode,
  FRAMEWORK_NAMES,
  FRAMEWORK_DESCRIPTIONS,
} from '@/lib/compliance/framework-types';

// =============================================================================
// Types
// =============================================================================

interface FrameworkSelectorProps {
  value: FrameworkCode[];
  onChange: (value: FrameworkCode[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  maxDisplay?: number;
}

interface SingleFrameworkSelectorProps {
  value: FrameworkCode | null;
  onChange: (value: FrameworkCode) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const FRAMEWORK_ICONS: Record<FrameworkCode, typeof Shield> = {
  dora: Shield,
  nis2: Layers,
  gdpr: FileText,
  iso27001: Target,
};

const FRAMEWORK_COLORS: Record<FrameworkCode, string> = {
  dora: 'bg-blue-500',
  nis2: 'bg-purple-500',
  gdpr: 'bg-green-500',
  iso27001: 'bg-orange-500',
};

const ALL_FRAMEWORKS: FrameworkCode[] = ['dora', 'nis2', 'gdpr', 'iso27001'];

// =============================================================================
// Multi-Select Framework Selector
// =============================================================================

export function FrameworkSelector({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select frameworks...',
  className,
  maxDisplay = 2,
}: FrameworkSelectorProps) {
  const [open, setOpen] = useState(false);

  const toggleFramework = (framework: FrameworkCode) => {
    if (value.includes(framework)) {
      onChange(value.filter((f) => f !== framework));
    } else {
      onChange([...value, framework]);
    }
  };

  const displayValue = () => {
    if (value.length === 0) return placeholder;
    if (value.length <= maxDisplay) {
      return value.map((f) => FRAMEWORK_NAMES[f]).join(', ');
    }
    return `${value.slice(0, maxDisplay).map((f) => FRAMEWORK_NAMES[f]).join(', ')} +${value.length - maxDisplay}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between', className)}
        >
          <span className="truncate">{displayValue()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search frameworks..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {ALL_FRAMEWORKS.map((framework) => {
                const Icon = FRAMEWORK_ICONS[framework];
                const isSelected = value.includes(framework);

                return (
                  <CommandItem
                    key={framework}
                    value={framework}
                    onSelect={() => toggleFramework(framework)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={cn('p-1.5 rounded', FRAMEWORK_COLORS[framework])}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{FRAMEWORK_NAMES[framework]}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {FRAMEWORK_DESCRIPTIONS[framework].slice(0, 60)}...
                        </div>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// Single-Select Framework Selector
// =============================================================================

export function SingleFrameworkSelector({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select framework...',
  className,
}: SingleFrameworkSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between', className)}
        >
          {value ? (
            <div className="flex items-center gap-2">
              <div className={cn('p-1 rounded', FRAMEWORK_COLORS[value])}>
                {(() => {
                  const Icon = FRAMEWORK_ICONS[value];
                  return <Icon className="h-3 w-3 text-white" />;
                })()}
              </div>
              <span>{FRAMEWORK_NAMES[value]}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search frameworks..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {ALL_FRAMEWORKS.map((framework) => {
                const Icon = FRAMEWORK_ICONS[framework];

                return (
                  <CommandItem
                    key={framework}
                    value={framework}
                    onSelect={() => {
                      onChange(framework);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={cn('p-1.5 rounded', FRAMEWORK_COLORS[framework])}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium">{FRAMEWORK_NAMES[framework]}</span>
                    </div>
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        value === framework ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// Framework Badge List
// =============================================================================

interface FrameworkBadgeListProps {
  frameworks: FrameworkCode[];
  size?: 'sm' | 'default';
  className?: string;
}

export function FrameworkBadgeList({
  frameworks,
  size = 'default',
  className,
}: FrameworkBadgeListProps) {
  if (frameworks.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">No frameworks selected</span>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {frameworks.map((framework) => {
        const Icon = FRAMEWORK_ICONS[framework];

        return (
          <Badge
            key={framework}
            variant="outline"
            className={cn(
              'flex items-center gap-1',
              size === 'sm' && 'text-xs px-1.5 py-0.5'
            )}
          >
            <div className={cn('rounded', FRAMEWORK_COLORS[framework], size === 'sm' ? 'p-0.5' : 'p-1')}>
              <Icon className={cn('text-white', size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
            </div>
            <span>{size === 'sm' ? framework.toUpperCase() : FRAMEWORK_NAMES[framework]}</span>
          </Badge>
        );
      })}
    </div>
  );
}

// =============================================================================
// Framework Chip (compact single framework display)
// =============================================================================

interface FrameworkChipProps {
  framework: FrameworkCode;
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function FrameworkChip({
  framework,
  size = 'default',
  showLabel = true,
  className,
}: FrameworkChipProps) {
  const Icon = FRAMEWORK_ICONS[framework];

  const sizeClasses = {
    sm: 'h-5 text-xs gap-1 px-1.5',
    default: 'h-7 text-sm gap-1.5 px-2',
    lg: 'h-9 text-base gap-2 px-3',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        FRAMEWORK_COLORS[framework],
        'text-white',
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{FRAMEWORK_NAMES[framework]}</span>}
    </div>
  );
}
