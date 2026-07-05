"use client";

/** Segmented network toggle — switch between Sepolia and Ethereum Mainnet. */

import { useSwitchChain } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { SEPOLIA_CHAIN_ID, MAINNET_CHAIN_ID } from "@wrapper-registry/contracts";
import { useActiveNetwork } from "@/lib/use-active-network";

const NETWORKS = [
  { chainId: SEPOLIA_CHAIN_ID, label: "Sepolia", chain: sepolia },
  { chainId: MAINNET_CHAIN_ID, label: "Mainnet", chain: mainnet },
] as const;

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

  if (!isSupported) {
    return (
      <div className="flex overflow-hidden rounded-full border border-amber-500/40 text-xs">
        {NETWORKS.map((n) => (
          <button
            key={n.chainId}
            className="bg-amber-950/40 px-3 py-1 text-amber-200 transition-colors hover:bg-amber-500/25"
            disabled={isPending}
            onClick={() => switchChainAsync?.({ chainId: n.chainId })}
          >
            {isPending ? "…" : n.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden rounded-full border border-white/10 text-xs">
      {NETWORKS.map((n) => {
        const active = chainId === n.chainId;
        return (
          <button
            key={n.chainId}
            className={`px-3 py-1 transition-colors ${
              active
                ? "bg-brand-500/20 text-brand-300"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
            disabled={active || isPending}
            onClick={() => switchChainAsync?.({ chainId: n.chainId })}
          >
            {active && (
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-400" />
            )}
            {n.label}
          </button>
        );
      })}
    </div>
  );
}
