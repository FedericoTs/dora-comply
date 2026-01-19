'use client';

/**
 * ERROR BOUNDARY FOR DASHBOARD - DEBUGGING REACT ERROR #310
 *
 * This error boundary captures and logs detailed error information
 * to help identify the root cause of React error #310.
 */

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log detailed error information
    console.error('=== DASHBOARD ERROR BOUNDARY CAUGHT ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error digest:', error.digest);
    console.error('Error stack:', error.stack);
    console.error('============================================');

    // Log to help identify hook issues
    if (error.message.includes('hook') || error.message.includes('Rendered')) {
      console.error('HOOK ERROR DETECTED - This is likely React error #310');
      console.error('Check for:');
      console.error('  1. Conditional hook calls');
      console.error('  2. Early returns before hooks');
      console.error('  3. Hooks in loops or conditions');
      console.error('  4. Dynamic imports with hooks');
    }
  }, [error]);

  // Parse error type
  const isHookError = error.message.includes('hook') ||
                      error.message.includes('Rendered') ||
                      error.message.includes('310');

  const isHydrationError = error.message.includes('hydration') ||
                           error.message.includes('Hydration') ||
                           error.message.includes('server') && error.message.includes('client');

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-xl w-full">
        {/* Error Card */}
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
                {isHookError ? 'React Hook Error Detected' :
                 isHydrationError ? 'Hydration Mismatch Error' :
                 'Something went wrong'}
              </h2>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {isHookError
                  ? 'A React hook was called in an invalid order. This is usually caused by conditional hook calls or early returns before hooks.'
                  : isHydrationError
                  ? 'The server-rendered HTML does not match what the client rendered. This can happen with date/time values or browser-specific code.'
                  : 'An unexpected error occurred while loading this page.'}
              </p>
            </div>
          </div>

          {/* Error Details (for debugging) */}
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-md">
            <div className="flex items-center gap-2 text-xs font-mono text-red-800 dark:text-red-200 mb-2">
              <Bug className="h-3 w-3" />
              DEBUG INFO
            </div>
            <div className="space-y-1 text-xs font-mono text-red-700 dark:text-red-300 break-all">
              <p><strong>Type:</strong> {error.name}</p>
              <p><strong>Message:</strong> {error.message}</p>
              {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
            </div>
          </div>

          {/* Stack trace (collapsed) */}
          <details className="mt-3">
            <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:underline">
              View stack trace
            </summary>
            <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs font-mono text-red-700 dark:text-red-300 overflow-auto max-h-40">
              {error.stack}
            </pre>
          </details>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={reset} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </a>
            </Button>
          </div>
        </div>

        {/* Debugging tips */}
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Debugging Tips
          </h3>
          <ul className="mt-2 text-xs text-amber-700 dark:text-amber-300 space-y-1">
            <li>• Check browser console for detailed error logs</li>
            <li>• Look for components with conditional hook calls</li>
            <li>• Check if any component has early returns before useState/useEffect</li>
            <li>• Verify all dynamic imports handle SSR correctly</li>
            <li>• Check for date/time values that differ between server and client</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
