"use client";

/**
 * TransactionStatus — inline feedback for on-chain writes.
 * Shows pending spinner → success (with explorer link) or error, replacing
 * the loose toast-only feedback. Designed to be embedded in a card.
 */

import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { explorerTxUrl } from "@/lib/format";
import type { NetworkKey } from "@wrapper-registry/contracts";

export type TxState =
  | { kind: "idle" }
  | { kind: "pending"; label?: string }
  | { kind: "success"; txHash?: string; network: NetworkKey; label?: string }
  | { kind: "error"; message: string };

export function TransactionStatus({ state }: { state: TxState }) {
  if (state.kind === "idle") return null;

  if (state.kind === "pending") {
    return (
      <div
        role="status"
        className="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-950/30 px-4 py-2.5 text-sm text-sky-100"
      >
        <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
        <span>{state.label ?? "Transaction pending…"}</span>
      </div>
    );
  }

  if (state.kind === "success") {
    return (
      <div
        role="status"
        className="flex items-center justify-between gap-3 rounded-lg border border-brand-500/30 bg-brand-950/30 px-4 py-2.5 text-sm text-brand-100"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-brand-400" />
          <span>{state.label ?? "Confirmed"}</span>
        </div>
        {state.txHash && (
          <a
            href={explorerTxUrl(state.network, state.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand-300 underline decoration-dotted hover:text-brand-200"
          >
            View tx <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-950/30 px-4 py-2.5 text-sm text-rose-100"
    >
      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
      <span className="break-words">{state.message}</span>
    </div>
  );
}
