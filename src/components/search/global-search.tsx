'use client';

/**
 * Global Search Component
 *
 * Command palette-style search that searches across vendors, documents, and incidents.
 * Triggered by clicking the search input or pressing Cmd/Ctrl+K.
 */

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  FileText,
  AlertTriangle,
  FileSearch,
  Search,
  Loader2,
  ArrowRight,
  Clock,
  Layers,
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { globalSearch, getRecentItems, type SearchResults, type SearchResult, type SearchResultType } from '@/lib/search/actions';
import { useDebounce } from '@/hooks/use-debounce';

// ============================================================================
// Types
// ============================================================================

interface GlobalSearchProps {
  /** Placeholder text for the search input */
  placeholder?: string;
}

// ============================================================================
// Icons by type
// ============================================================================

const typeIcons: Record<SearchResultType, typeof Building2> = {
  vendor: Building2,
  document: FileText,
  incident: AlertTriangle,
  page: Layers,
};

const typeLabels: Record<SearchResultType, string> = {
  vendor: 'Vendors',
  document: 'Documents',
  incident: 'Incidents',
  page: 'Pages',
};

// ============================================================================
// Component
// ============================================================================

export function GlobalSearch({ placeholder = 'Search anything...' }: GlobalSearchProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [recentItems, setRecentItems] = useState<SearchResults | null>(null);
  const [isPending, startTransition] = useTransition();

  const debouncedQuery = useDebounce(query, 200);

  // Prevent hydration mismatch by only rendering dialog after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- necessary for hydration safety
    setMounted(true);
  }, []);

  // Load recent items when dialog opens
  useEffect(() => {
    if (open && !recentItems) {
      startTransition(async () => {
        const items = await getRecentItems();
        setRecentItems(items);
      });
    }
  }, [open, recentItems]);

  // Search when query changes
  // Intentional search results update - clearing results is necessary when query is empty
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional early return after clearing results
      setResults(null);
      return;
    }

    startTransition(async () => {
      const searchResults = await globalSearch(debouncedQuery);
       
      setResults(searchResults);
    });
  }, [debouncedQuery]);

  // Keyboard shortcut
  useEffect(() => {
    if (!mounted) return;

    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [mounted]);

  // Handle selection
  const handleSelect = useCallback((result: SearchResult) => {
    setOpen(false);
    setQuery('');
    router.push(result.href);
  }, [router]);

  // Reset state when closing
  const handleOpenChange = useCallback((open: boolean) => {
    setOpen(open);
    if (!open) {
      setQuery('');
      setResults(null);
    }
  }, []);

  // Determine what to show
  const showResults = debouncedQuery.length >= 2 && results;
  const showRecent = !showResults && recentItems;
  const hasNoResults = showResults && results.total === 0;

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-80 pl-3 pr-2 py-2 rounded-lg bg-muted border-0 text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">{placeholder}</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Dialog - only render on client to prevent hydration mismatch */}
      {mounted && (
        <CommandDialog
          open={open}
          onOpenChange={handleOpenChange}
          title="Global Search"
          description="Search across vendors, documents, incidents, and pages"
        >
        <CommandInput
          placeholder="Search vendors, documents, incidents..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[400px]">
          {isPending && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isPending && hasNoResults && (
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-4">
                <FileSearch className="h-10 w-10 text-muted-foreground/50" />
                <p>No results found for &ldquo;{debouncedQuery}&rdquo;</p>
                <p className="text-xs text-muted-foreground">
                  Try searching for vendor names, document filenames, or incident titles
                </p>
              </div>
            </CommandEmpty>
          )}

          {/* Search Results */}
          {!isPending && showResults && (
            <>
              {results.vendors.length > 0 && (
                <CommandGroup heading={typeLabels.vendor}>
                  {results.vendors.map((result) => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      onSelect={handleSelect}
                    />
                  ))}
                </CommandGroup>
              )}

              {results.documents.length > 0 && (
                <>
                  {results.vendors.length > 0 && <CommandSeparator />}
                  <CommandGroup heading={typeLabels.document}>
                    {results.documents.map((result) => (
                      <SearchResultItem
                        key={result.id}
                        result={result}
                        onSelect={handleSelect}
                      />
                    ))}
                  </CommandGroup>
                </>
              )}

              {results.incidents.length > 0 && (
                <>
                  {(results.vendors.length > 0 || results.documents.length > 0) && <CommandSeparator />}
                  <CommandGroup heading={typeLabels.incident}>
                    {results.incidents.map((result) => (
                      <SearchResultItem
                        key={result.id}
                        result={result}
                        onSelect={handleSelect}
                      />
                    ))}
                  </CommandGroup>
                </>
              )}

              {results.pages.length > 0 && (
                <>
                  {(results.vendors.length > 0 || results.documents.length > 0 || results.incidents.length > 0) && <CommandSeparator />}
                  <CommandGroup heading={typeLabels.page}>
                    {results.pages.map((result) => (
                      <SearchResultItem
                        key={result.id}
                        result={result}
                        onSelect={handleSelect}
                      />
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}

          {/* Recent Items (empty state) */}
          {!isPending && showRecent && (
            <>
              <CommandGroup heading="Recent">
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Recently viewed
                </div>
                {recentItems.vendors.map((result) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    onSelect={handleSelect}
                  />
                ))}
                {recentItems.incidents.map((result) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    onSelect={handleSelect}
                  />
                ))}
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Quick Actions">
                {recentItems.pages.map((result) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    onSelect={handleSelect}
                  />
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px]">
              ↑↓
            </kbd>
            <span>Navigate</span>
            <kbd className="inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px]">
              ↵
            </kbd>
            <span>Select</span>
            <kbd className="inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px]">
              Esc
            </kbd>
            <span>Close</span>
          </div>
        </div>
      </CommandDialog>
      )}
    </>
  );
}

// ============================================================================
// Search Result Item
// ============================================================================

interface SearchResultItemProps {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
}

function SearchResultItem({ result, onSelect }: SearchResultItemProps) {
  const Icon = typeIcons[result.type];

  return (
    <CommandItem
      value={`${result.type}-${result.id}-${result.title}`}
      onSelect={() => onSelect(result)}
      className="flex items-center gap-3 px-3 py-2"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{result.title}</p>
        {result.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
        )}
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100" />
    </CommandItem>
  );
}
