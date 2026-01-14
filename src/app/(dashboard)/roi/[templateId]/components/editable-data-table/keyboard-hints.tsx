'use client';

export function KeyboardHints() {
  const isMac = typeof navigator !== 'undefined' && navigator.platform?.includes('Mac');
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground px-1">
      <span>
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Click</kbd> to select
      </span>
      <span>
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Double-click</kbd> or{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Enter</kbd> to edit
      </span>
      <span>
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Tab</kbd> /{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Arrows</kbd> to navigate
      </span>
      <span>
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">{modKey}+Enter</kbd> add row
      </span>
      <span>
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">{modKey}+Z</kbd> to undo
      </span>
    </div>
  );
}
