"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            {/* Icon */}
            <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-semibold text-gray-700 mb-4">
              Critical Error
            </h1>

            {/* Description */}
            <p className="text-gray-500 mb-2">
              A critical error occurred. Please try refreshing the page.
            </p>

            {/* Error digest */}
            {error.digest && (
              <p className="text-xs text-gray-400 mb-8 font-mono">
                Error ID: {error.digest}
              </p>
            )}

            {/* Actions */}
            <Button
              onClick={reset}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
