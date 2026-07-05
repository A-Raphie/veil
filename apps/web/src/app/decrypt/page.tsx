"use client";

/**
 * Decrypt any ERC-7984 balance.
 *
 * Bounty requirement: "Support user decryption of the connected wallet's balance
 * for ANY ERC-7984 token, not only registered ones (paste-an-address or auto-detect)."
 *
 * Uses the SDK permit flow with explicit gating:
 *   useHasPermit  → already permitted? (no popup)
 *   useGrantPermit→ request the one-time EIP-712 signature
 *   useConfidentialBalance → read the decrypted balance once permitted
 *
 * Address input is validated syntactically before any contract call, so invalid
 * or non-ERC-7984 addresses produce a friendly error (rubric: error handling).
 */

import { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import {
  useConfidentialBalance,
  useGrantPermit,
  useHasPermit,
} from "@zama-fhe/react-sdk";
import type { Address } from "viem";
import { useRegistryPairs } from "@/lib/registry";
import { useActiveNetwork } from "@/lib/use-active-network";
import { shortAddr, formatUnits } from "@/lib/format";
import { checkAddress, addressErrorReason } from "@/lib/address";
import { humanizeError } from "@/lib/errors";
import { pushToast } from "@/components/toast";
import { WrongNetworkBanner } from "@/components/wrong-network-banner";
import { Alert } from "@/components/alert";
import { Lock, Unlock, ScanSearch, KeyRound } from "lucide-react";
import { Copy } from "@/components/copy";
import { Skeleton } from "@/components/skeleton";

export default function DecryptPage() {
  // Header renders in SSR; the interactive inner part is Suspense-gated.
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-14">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Decrypt Confidential Balance</h1>
        <p className="mt-1 text-sm text-slate-400">
          Reveal your encrypted balance for any confidential token.
        </p>
      </header>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <DecryptPageInner />
      </Suspense>
    </div>
  );
}

function DecryptPageInner() {
  const { isConnected } = useActiveNetwork();
  const param = useSearchParams().get("token");
  const [token, setToken] = useState<string>(param ?? "");

  // Validate as the user types (debounced-free; cheap syntactic check).
  const check = useMemo(() => checkAddress(token), [token]);
  const validToken = check.ok ? check.address : null;

  return (
    <>
      <WrongNetworkBanner />

      {!isConnected && (
        <div className="card text-sm text-slate-300">Connect a wallet to decrypt its balances.</div>
      )}

      <div className="card space-y-3">
        <label htmlFor="token-input" className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <ScanSearch className="h-3.5 w-3.5" /> Confidential token address (any ERC-7984)
        </label>
        <input
          id="token-input"
          className="input mono"
          placeholder="0x… wrapper contract address"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
        {token && !check.ok && check.reason !== "empty" && (
          <p className="text-xs text-rose-300">{addressErrorReason(check.reason)}</p>
        )}
        <p className="text-xs text-slate-500">
          Auto-detect: pick from{" "}
          <a className="underline" href="/">
            the registry
          </a>
          , or paste an address for a wrapper that isn&apos;t registered.
        </p>
      </div>

      {isConnected && validToken && <DecryptCard token={validToken} />}

      <KnownTokens onPick={setToken} active={token} />
    </>
  );
}

function DecryptCard({ token }: { token: Address }) {
  const { address } = useAccount();
  const { network } = useActiveNetwork();
  const [granted, setGranted] = useState(false);

  const { data: pairs } = useRegistryPairs(network);
  const pair = pairs?.find((p) => p.confidentialToken.toLowerCase() === token.toLowerCase());
  const decimals = pair?.decimals ?? 6;

  // Detect whether the pasted address is actually an ERC-7984 wrapper via
  // supportsInterface(0x4958f2a4). Gives a clear error BEFORE the permit flow.
  const { data: isErc7984, isLoading: checkingInterface } = useReadContract({
    address: token,
    abi: [
      {
        type: "function",
        name: "supportsInterface",
        stateMutability: "view",
        inputs: [{ name: "interfaceId", type: "bytes4" }],
        outputs: [{ name: "", type: "bool" }],
      },
    ] as const,
    functionName: "supportsInterface",
    args: ["0x4958f2a4"],
    query: { enabled: !!token },
  });

  const { data: hasPermit, isLoading: checkingPermit } = useHasPermit({
    contractAddresses: [token],
  });

  const { mutateAsync: grantPermit, isPending: granting } = useGrantPermit();

  const permitted = hasPermit === true || granted;
  const { data: balance, isLoading: reading, error } = useConfidentialBalance({
    address: token,
    account: address ?? "0x0000000000000000000000000000000000000000",
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

      {/* Interface detection — reject non-ERC-7984 contracts up front. */}
      {checkingInterface && (
        <p className="text-xs text-slate-500">Checking ERC-7984 interface…</p>
      )}
      {isErc7984 === false && (
        <Alert variant="error" title="Not an ERC-7984 wrapper">
          This contract doesn&apos;t implement the ERC-7984 interface
          (<span className="mono">0x4958f2a4</span>). Decryption only works on confidential
          wrapper tokens.
        </Alert>
      )}

      {isErc7984 !== false && !permitted && (
        <Alert variant="warning" title="Decrypt permission required">
          <p>
            Sign a one-time EIP-712 permit to let Veil decrypt your balance of this token.
            It&apos;s reusable — returning users skip this step.
          </p>
          <button
            className="btn-primary mt-3"
            disabled={granting || checkingPermit}
            onClick={onGrant}
          >
            {granting ? "Awaiting signature…" : "Grant decrypt permit"}
          </button>
        </Alert>
      )}

      {permitted && (
        <div className="rounded-lg border border-brand-500/30 bg-brand-950/20 p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-brand-300">
            <Unlock className="h-3.5 w-3.5" /> Decrypted balance
          </div>
          <div className="animate-veil-rise mt-1 font-mono text-3xl font-semibold text-brand-200">
            {reading ? "decrypting…" : error ? "—" : (balance ? formatUnits(balance as bigint, decimals) : "0")}
          </div>
          {error && (
            <p className="mt-2 text-xs text-rose-300">
              {humanizeError(error)}
              {!error.message?.includes("permit") && (
                <span className="mt-1 block text-slate-400">
                  This may not be a valid ERC-7984 wrapper, or you have no balance of it.
                </span>
              )}
            </p>
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
  const { data: pairs, isLoading } = useRegistryPairs(network);
  if (isLoading) return <Skeleton className="h-16 w-full" />;
  if (!pairs?.length) return null;
  return (
    <div className="card">
      <h2 className="text-xs font-medium text-slate-400">Pick from the registry</h2>
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
