"use client";

/** Loading fallback for Suspense boundaries — shown during route transitions. */

import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4 py-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </div>
  );
}
