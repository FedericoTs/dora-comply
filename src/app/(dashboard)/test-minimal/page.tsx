/**
 * ULTRA-MINIMAL TEST PAGE
 *
 * This page has absolutely no client components, no hooks, no providers.
 * If this page still crashes with React error #310, the issue is in:
 * - Root layout (ThemeProvider, RegionProvider, CookieConsentBanner)
 * - Dashboard layout (FrameworkProvider)
 *
 * If this page works, we can add components one by one to isolate the issue.
 */

export const dynamic = 'force-dynamic'; // Prevent static generation

export default function TestMinimalPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Ultra-Minimal Test Page</h1>
      <p className="text-muted-foreground mb-4">
        This page has no client components, no hooks, no dynamic imports.
      </p>
      <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
        <p className="text-green-800 dark:text-green-200 font-medium">
          If you can see this, the page rendered successfully!
        </p>
        <p className="text-green-600 dark:text-green-400 text-sm mt-2">
          The issue is likely in a specific component, not the layouts.
        </p>
      </div>
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">Debug Info:</h2>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>Page: /test-minimal</li>
          <li>Layout: dashboard layout (minimal version)</li>
          <li>Client Components: None</li>
          <li>Hooks: None</li>
        </ul>
      </div>
    </div>
  );
}
