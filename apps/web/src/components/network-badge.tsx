"use client";

/** Inline network status badge + a "switch to a supported network" CTA. */

import { useSwitchChain } from "wagmi";
import { SEPOLIA_CHAIN_ID } from "@wrapper-registry/contracts";
import { useActiveNetwork } from "@/lib/use-active-network";

const LABELS: Record<number, string> = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia",
};

export function NetworkBadge() {
  const { chainId, isSupported, isConnected } = useActiveNetwork();
  const { switchChainAsync, isPending } = useSwitchChain();

  if (!isConnected) {
    return (
      <span className="badge bg-slate-700/40 text-slate-300">
        Not connected
      </span>
    );
  }

  const label = LABELS[chainId] ?? `Chain ${chainId}`;

  if (!isSupported) {
    return (
      <button
        className="badge bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
        disabled={isPending}
        onClick={() => switchChainAsync?.({ chainId: SEPOLIA_CHAIN_ID })}
      >
        {label} — switch to Sepolia
      </button>
    );
  }

  return (
    <span className="badge bg-brand-500/15 text-brand-300">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
      {label}
    </span>
  );
}
