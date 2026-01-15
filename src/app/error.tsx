"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          We encountered an unexpected error. Our team has been notified.
        </p>

        {/* Error digest for support */}
        {error.digest && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-8 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button asChild variant="outline">
            <a href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </a>
          </Button>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-gray-400 dark:text-gray-500">
          If this problem persists,{" "}
          <a href="/support" className="text-emerald-600 hover:underline">
            contact support
          </a>
        </p>
      </div>
    </div>
  );
}
