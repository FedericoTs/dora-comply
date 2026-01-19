/**
 * COMPLETELY ISOLATED TEST PAGE
 *
 * This page:
 * - Is NOT under (auth) or (dashboard) route groups
 * - Uses the root layout only (ThemeProvider, RegionProvider, Toaster)
 * - Has NO server-side data fetching
 * - Should work even if Supabase is not configured
 */

export const dynamic = 'force-dynamic';

export default function TestIsolatedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">Isolated Test Page</h1>
        <p className="text-muted-foreground mb-6">
          This page uses ONLY the root layout. No auth, no dashboard, no Supabase.
        </p>

        <div className="p-6 bg-green-100 dark:bg-green-900/30 rounded-lg mb-6">
          <p className="text-green-800 dark:text-green-200 font-semibold text-lg">
            SUCCESS!
          </p>
          <p className="text-green-600 dark:text-green-400 text-sm mt-2">
            If you see this, the root layout works correctly.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">Now test the other pages:</p>
          <div className="flex flex-col gap-2">
            <a href="/test-auth" className="text-primary underline hover:no-underline">
              /test-auth (auth layout)
            </a>
            <a href="/test-minimal" className="text-primary underline hover:no-underline">
              /test-minimal (dashboard layout)
            </a>
            <a href="/dashboard" className="text-primary underline hover:no-underline">
              /dashboard (full dashboard)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
