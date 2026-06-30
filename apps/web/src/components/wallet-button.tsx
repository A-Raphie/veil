"use client";

/** Minimal wallet connect button using wagmi's connectors list. */

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";

export function WalletButton({ className }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const { connectors, connectAsync, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="badge bg-brand-500/15 text-brand-300">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          {shortAddr(address)}
        </span>
        <button className="btn-secondary" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  // If only one connector (common case), connect directly.
  const primary = connectors[0];
  return (
    <button
      className={cn("btn-primary", className)}
      disabled={isPending || !primary}
      onClick={() => primary && connectAsync({ connector: primary })}
    >
      {isPending ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
