"use client";

/**
 * Wallet connect button.
 * If multiple connectors are available (e.g. MetaMask + WalletConnect), shows a
 * dropdown picker. If only one, connects directly. Handles the no-wallet case
 * with a clear message instead of a silently-disabled button.
 */

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChevronDown, Wallet } from "lucide-react";

export function WalletButton({ className }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const { connectors, connectAsync, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

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

  // No connectors at all — likely no injected wallet and no WC configured.
  if (connectors.length === 0) {
    return (
      <a
        href="https://metamask.io/download"
        target="_blank"
        rel="noopener noreferrer"
        className={cn("btn-secondary", className)}
        title="No wallet detected"
      >
        <Wallet className="h-4 w-4" /> Install wallet
      </a>
    );
  }

  // Single connector — connect directly.
  if (connectors.length === 1) {
    const primary = connectors[0];
    return (
      <button
        className={cn("btn-primary", className)}
        disabled={isPending}
        aria-label={`Connect wallet via ${primary.name}`}
        onClick={() => connectAsync({ connector: primary })}
      >
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  // Multiple connectors — show a picker dropdown.
  return (
    <div className="relative">
      <button
        className={cn("btn-primary", className)}
        disabled={isPending}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Connect Wallet <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-lg border bg-[rgb(var(--bg-elevated))] shadow-xl"
        >
          {connectors.map((c) => (
            <button
              key={c.uid}
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm hover:bg-white/5"
              onClick={() => {
                setOpen(false);
                connectAsync({ connector: c });
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
