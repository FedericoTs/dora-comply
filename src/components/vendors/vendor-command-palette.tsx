'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Plus,
  Search,
  Filter,
  Download,
  Building2,
  AlertTriangle,
  Clock,
  Settings,
  FileText,
  Shield,
  BarChart3,
  Tag,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import type { Vendor } from '@/lib/vendors/types';
import type { SmartFilterId } from './vendor-quick-filters-plus';

// ============================================================================
// Types
// ============================================================================

export type CommandAction =
  | { type: 'navigate'; path: string }
  | { type: 'filter'; filterId: SmartFilterId }
  | { type: 'search'; query: string }
  | { type: 'export'; format: 'csv' | 'xlsx' | 'json' }
  | { type: 'custom'; action: string };

interface CommandOption {
  id: string;
  label: string;
  icon: React.ElementType;
  description?: string;
  shortcut?: string[];
  action: CommandAction;
  keywords?: string[];
}

interface VendorCommandPaletteProps {
  vendors?: Vendor[];
  recentVendors?: Vendor[];
  onAction?: (action: CommandAction) => void;
  onFilterChange?: (filterId: SmartFilterId) => void;
  onSearch?: (query: string) => void;
}

// ============================================================================
// Static Commands
// ============================================================================

const NAVIGATION_COMMANDS: CommandOption[] = [
  {
    id: 'add-vendor',
    label: 'Add New Vendor',
    icon: Plus,
    description: 'Create a new third-party vendor',
    shortcut: ['N'],
    action: { type: 'navigate', path: '/vendors/new' },
    keywords: ['create', 'new', 'add', 'vendor'],
  },
  {
    id: 'dashboard',
    label: 'Vendor Dashboard',
    icon: BarChart3,
    description: 'View vendor overview and stats',
    action: { type: 'navigate', path: '/vendors' },
    keywords: ['dashboard', 'home', 'overview'],
  },
  {
    id: 'roi',
    label: 'Register of Information',
    icon: FileText,
    description: 'View DORA Register of Information',
    action: { type: 'navigate', path: '/roi' },
    keywords: ['roi', 'register', 'dora', 'information'],
  },
  {
    id: 'compliance',
    label: 'Compliance Overview',
    icon: Shield,
    description: 'Check compliance status',
    action: { type: 'navigate', path: '/compliance' },
    keywords: ['compliance', 'dora', 'status'],
  },
];

const FILTER_COMMANDS: CommandOption[] = [
  {
    id: 'filter-all',
    label: 'Show All Vendors',
    icon: Building2,
    action: { type: 'filter', filterId: 'all' },
    keywords: ['all', 'show', 'view'],
  },
  {
    id: 'filter-critical',
    label: 'Show Critical Vendors',
    icon: AlertTriangle,
    description: 'Filter to critical tier only',
    action: { type: 'filter', filterId: 'critical' },
    keywords: ['critical', 'tier', 'important'],
  },
  {
    id: 'filter-at-risk',
    label: 'Show At-Risk Vendors',
    icon: AlertTriangle,
    description: 'Vendors with risk score below 60',
    action: { type: 'filter', filterId: 'at_risk' },
    keywords: ['risk', 'at-risk', 'danger'],
  },
  {
    id: 'filter-needs-review',
    label: 'Show Pending Review',
    icon: Clock,
    description: 'Vendors pending review',
    action: { type: 'filter', filterId: 'needs_review' },
    keywords: ['review', 'pending', 'waiting'],
  },
  {
    id: 'filter-action-needed',
    label: 'Show Action Needed',
    icon: Tag,
    description: 'Vendors missing documents or assessments',
    action: { type: 'filter', filterId: 'action_needed' },
    keywords: ['action', 'missing', 'incomplete'],
  },
  {
    id: 'filter-expiring',
    label: 'Show Expiring Soon',
    icon: Calendar,
    description: 'Contracts expiring within 60 days',
    action: { type: 'filter', filterId: 'expiring_soon' },
    keywords: ['expiring', 'contracts', 'soon'],
  },
];

const ACTION_COMMANDS: CommandOption[] = [
  {
    id: 'export-csv',
    label: 'Export to CSV',
    icon: Download,
    action: { type: 'export', format: 'csv' },
    keywords: ['export', 'csv', 'download'],
  },
  {
    id: 'export-xlsx',
    label: 'Export to Excel',
    icon: Download,
    action: { type: 'export', format: 'xlsx' },
    keywords: ['export', 'excel', 'xlsx', 'download'],
  },
  {
    id: 'settings',
    label: 'Vendor Settings',
    icon: Settings,
    action: { type: 'navigate', path: '/settings/vendors' },
    keywords: ['settings', 'preferences', 'config'],
  },
];

// ============================================================================
// Component
// ============================================================================

export function VendorCommandPalette({
  vendors = [],
  recentVendors = [],
  onAction,
  onFilterChange,
  onSearch,
}: VendorCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Handle command selection
  const handleSelect = useCallback(
    (command: CommandOption | { action: CommandAction }) => {
      const action = command.action;

      // Notify parent
      onAction?.(action);

      switch (action.type) {
        case 'navigate':
          router.push(action.path);
          break;
        case 'filter':
          onFilterChange?.(action.filterId);
          break;
        case 'search':
          onSearch?.(action.query);
          break;
        case 'export':
          // Export is handled by parent
          break;
        case 'custom':
          // Custom action is handled by parent
          break;
      }

      setOpen(false);
      setSearch('');
    },
    [router, onAction, onFilterChange, onSearch]
  );

  // Handle vendor navigation
  const handleVendorSelect = useCallback(
    (vendor: Vendor) => {
      router.push(`/vendors/${vendor.id}`);
      setOpen(false);
      setSearch('');
    },
    [router]
  );

  // Filter vendors by search
  const filteredVendors = search.length >= 2
    ? vendors.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.lei?.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <>
      {/* Trigger button (optional - can be hidden if only using keyboard) */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-input bg-background hover:bg-accent"
      >
        <Search className="h-4 w-4" />
        <span>Search vendors...</span>
        <kbd className="ml-2 pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium hidden sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search vendors, commands, or type / for filters..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center">
                <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No results found for &quot;{search}&quot;
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try a different search term or command
                </p>
              </div>
            </CommandEmpty>

            {/* Recent Vendors */}
            {recentVendors.length > 0 && !search && (
              <CommandGroup heading="Recent">
                {recentVendors.slice(0, 3).map((vendor) => (
                  <CommandItem
                    key={vendor.id}
                    onSelect={() => handleVendorSelect(vendor)}
                    className="flex items-center gap-3"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{vendor.name}</p>
                      {vendor.lei && (
                        <p className="text-xs text-muted-foreground">LEI: {vendor.lei}</p>
                      )}
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Search Results */}
            {filteredVendors.length > 0 && (
              <CommandGroup heading="Vendors">
                {filteredVendors.map((vendor) => (
                  <CommandItem
                    key={vendor.id}
                    onSelect={() => handleVendorSelect(vendor)}
                    className="flex items-center gap-3"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{vendor.name}</p>
                      {vendor.lei && (
                        <p className="text-xs text-muted-foreground">LEI: {vendor.lei}</p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                      {vendor.tier}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Navigation Commands */}
            <CommandGroup heading="Navigation">
              {NAVIGATION_COMMANDS.map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={() => handleSelect(command)}
                  className="flex items-center gap-3"
                >
                  <command.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm">{command.label}</p>
                    {command.description && (
                      <p className="text-xs text-muted-foreground">{command.description}</p>
                    )}
                  </div>
                  {command.shortcut && (
                    <CommandShortcut>
                      {command.shortcut.map((key, i) => (
                        <kbd key={i} className="px-1.5 py-0.5 text-xs rounded bg-muted">
                          {key}
                        </kbd>
                      ))}
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            {/* Filter Commands */}
            <CommandGroup heading="Quick Filters">
              {FILTER_COMMANDS.map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={() => handleSelect(command)}
                  className="flex items-center gap-3"
                >
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm">{command.label}</p>
                    {command.description && (
                      <p className="text-xs text-muted-foreground">{command.description}</p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            {/* Action Commands */}
            <CommandGroup heading="Actions">
              {ACTION_COMMANDS.map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={() => handleSelect(command)}
                  className="flex items-center gap-3"
                >
                  <command.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{command.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>

        {/* Footer */}
        <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">esc</kbd>
              close
            </span>
          </div>
        </div>
      </CommandDialog>
    </>
  );
}

// ============================================================================
// Hook for using command palette
// ============================================================================

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return {
    isOpen,
    setIsOpen,
    toggle: () => setIsOpen((open) => !open),
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
