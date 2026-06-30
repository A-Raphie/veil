"use client";

/**
 * Decrypt any ERC-7984 balance.
 *
 * Bounty requirement: "Support user decryption of the connected wallet's balance
 * for ANY ERC-7984 token, not only registered ones (paste-an-address or auto-detect flow)."
 *
 * Uses the SDK permit flow with explicit gating (the docs warn: never call a decrypt
 * hook ungated, or the user gets a blind wallet popup on render):
 *   useHasPermit  → is the user already permitted? (no popup)
 *   useGrantPermit→ request the one-time EIP-712 signature
 *   useConfidentialBalance → read the decrypted balance once permitted
 */

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  useConfidentialBalance,
  useGrantPermit,
  useHasPermit,
} from "@zama-fhe/react-sdk";
import type { Address } from "viem";
import { useRegistryPairs } from "@/lib/registry";
import { useActiveNetwork } from "@/lib/use-active-network";
import { shortAddr } from "@/lib/format";
import { humanizeError } from "@/lib/errors";
import { pushToast } from "@/components/toast";
import { Lock, Unlock, ScanSearch, KeyRound } from "lucide-react";
import { Copy } from "@/components/copy";

export default function DecryptPage() {
  // useSearchParams must be inside a Suspense boundary for static prerender.
  return (
    <Suspense fallback={<div className="card animate-pulse text-slate-400">Loading…</div>}>
      <DecryptPageInner />
    </Suspense>
  );
}

function DecryptPageInner() {
  const { isConnected } = useActiveNetwork();
  const param = useSearchParams().get("token");
  const [token, setToken] = useState<string>(param ?? "");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Decrypt Confidential Balance</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Decrypt the connected wallet's ERC-7984 balance for <em>any</em> confidential token —
          not just registry ones. Paste a wrapper address or pick from the registry below.
          Decryption uses a one-time EIP-712 signature (a "permit") that grants read access.
        </p>
      </header>

      {!isConnected && (
        <div className="card text-sm text-slate-400">Connect a wallet to decrypt its balances.</div>
      )}

      <div className="card space-y-3">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <ScanSearch className="h-3.5 w-3.5" /> Confidential token address (any ERC-7984)
        </label>
        <input
          className="input mono"
          placeholder="0x… wrapper contract address"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <p className="text-xs text-slate-500">
          Auto-detect: pick from <a className="underline" href="/">the registry</a>, or paste an
          address for a wrapper that isn't registered.
        </p>
      </div>

      {isConnected && token.length === 42 && (
        <DecryptCard token={token as Address} />
      )}

      <KnownTokens onPick={setToken} active={token} />
    </div>
  );
}

function DecryptCard({ token }: { token: Address }) {
  const { address } = useAccount();
  const [granted, setGranted] = useState(false);

  // 1. Check if the user already has a permit covering this token.
  const { data: hasPermit, isLoading: checkingPermit } = useHasPermit({
    contractAddresses: [token],
  });

  // 2. Grant a permit (one-time EIP-712 signature).
  const { mutateAsync: grantPermit, isPending: granting } = useGrantPermit();

  // 3. Read the confidential balance (only fires once permitted).
  const permitted = hasPermit === true || granted;
  const { data: balance, isLoading: reading, error } = useConfidentialBalance({
    address: token,
    account: address!,
  });

  const onGrant = async () => {
    try {
      await grantPermit([token]);
      setGranted(true);
      pushToast("success", "Permit granted — balances decryptable now");
    } catch (err) {
      pushToast("error", humanizeError(err));
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-brand-400" />
          <span className="mono text-sm">{shortAddr(token)}</span>
          <Copy value={token} />
        </div>
        <span className="text-xs text-slate-500">
          holder: {address ? shortAddr(address) : "—"}
        </span>
      </div>

      {!permitted && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 text-sm">
          <div className="flex items-center gap-2 text-amber-200">
            <KeyRound className="h-4 w-4" />
            <span className="font-medium">Decrypt permission required</span>
          </div>
          <p className="mt-1 text-amber-200/80">
            Sign a one-time EIP-712 permit to let this app decrypt your balance of this token.
            It's reusable — returning users skip this step.
          </p>
          <button
            className="btn-primary mt-3"
            disabled={granting || checkingPermit}
            onClick={onGrant}
          >
            {granting ? "Awaiting signature…" : "Grant decrypt permit"}
          </button>
        </div>
      )}

      {permitted && (
        <div className="rounded-lg border border-brand-500/30 bg-brand-950/20 p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-brand-300">
            <Unlock className="h-3.5 w-3.5" /> Decrypted balance
          </div>
          <div className="mt-1 font-mono text-3xl font-semibold">
            {reading ? "decrypting…" : error ? "—" : (balance?.toString() ?? "0")}
          </div>
          {error && (
            <p className="mt-2 text-xs text-red-300">{humanizeError(error)}</p>
          )}
        </div>
      )}
    </div>
  );
}

function KnownTokens({
  onPick,
  active,
}: {
  onPick: (a: string) => void;
  active: string;
}) {
  const { network } = useActiveNetwork();
  const { data: pairs } = useRegistryPairs(network);
  if (!pairs?.length) return null;
  return (
    <div className="card">
      <h3 className="text-xs font-medium text-slate-400">Pick from the registry</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {pairs.map((p) => (
          <button
            key={p.confidentialToken}
            className={[
              "rounded-md border px-3 py-1.5 text-xs transition-colors",
              active.toLowerCase() === p.confidentialToken.toLowerCase()
                ? "border-brand-500 bg-brand-500/10 text-brand-200"
                : "hover:bg-white/5",
            ].join(" ")}
            onClick={() => onPick(p.confidentialToken)}
          >
            {p.symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
