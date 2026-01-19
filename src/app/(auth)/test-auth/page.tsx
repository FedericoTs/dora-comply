/**
 * ULTRA-MINIMAL TEST PAGE - AUTH LAYOUT
 *
 * This page uses the AUTH layout, not the dashboard layout.
 * If this page works but /test-minimal fails, the issue is in:
 * - Dashboard layout
 * - FrameworkProvider
 *
 * If both fail, the issue is in:
 * - Root layout (ThemeProvider, RegionProvider, Toaster, CookieConsentBanner)
 */

export const dynamic = 'force-dynamic';

export default function TestAuthPage() {
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Auth Layout Test Page</h1>
      <p className="text-muted-foreground mb-4">
        This page uses the AUTH layout (simpler, no FrameworkProvider).
      </p>
      <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg inline-block">
        <p className="text-green-800 dark:text-green-200 font-medium">
          If you can see this, the auth layout works!
        </p>
      </div>
      <div className="mt-6 text-sm text-muted-foreground">
        <p>Now try visiting <a href="/test-minimal" className="text-primary underline">/test-minimal</a> (dashboard layout)</p>
      </div>
    </div>
  );
}
