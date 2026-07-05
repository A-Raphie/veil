"use client";

/**
 * WrongNetworkBanner — a prominent, dismissible banner with a one-click switch.
 * Shown when the connected wallet is on a chain this app doesn't support.
 * Offers switching to Sepolia (the bounty judging network).
 */

import { useState } from "react";
import { useSwitchChain } from "wagmi";
import { SEPOLIA_CHAIN_ID } from "@wrapper-registry/contracts";
import { AlertTriangle, X } from "lucide-react";
import { useActiveNetwork } from "@/lib/use-active-network";

export function WrongNetworkBanner() {
  const { isSupported, isConnected } = useActiveNetwork();
  const { switchChainAsync, isPending } = useSwitchChain();
  const [dismissed, setDismissed] = useState(false);

  if (!isConnected || isSupported || dismissed) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-100"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
        <span>You&apos;re on an unsupported network. Switch to Sepolia to use Veil.</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="btn bg-amber-500 px-3 py-1.5 text-xs font-medium text-black hover:bg-amber-400"
          disabled={isPending}
          onClick={() => switchChainAsync?.({ chainId: SEPOLIA_CHAIN_ID })}
        >
          {isPending ? "Switching…" : "Switch to Sepolia"}
        </button>
        <button
          className="text-amber-400 hover:text-amber-200"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
