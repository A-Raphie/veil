"use client";

/**
 * Error boundary — catches runtime errors and shows a recoverable UI instead of
 * a blank page. Required by the production-readiness rubric.
 */

import { useEffect } from "react";
import { Alert } from "@/components/alert";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the operator console; in prod this is where you'd ship to Sentry.
    console.error("[veil] route error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-16">
      <Alert variant="error" title="Something went wrong">
        <p>
          {error.message || "An unexpected error occurred."}
          {error.digest && (
            <>
              {" "}
              (ref <span className="mono">{error.digest}</span>)
            </>
          )}
        </p>
      </Alert>
      <button className="btn-primary mt-4" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
