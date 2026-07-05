/** 404 — friendly not-found page. */

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="mono text-sm text-brand-400">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        This page is encrypted beyond reach.
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Or it just doesn&apos;t exist. Either way, head back to the registry.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Back to the registry
      </Link>
    </div>
  );
}
