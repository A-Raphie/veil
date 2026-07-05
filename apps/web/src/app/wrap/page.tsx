"use client";

/**
 * Wrap / Unwrap — the core confidential-token flow.
 *
 * Uses the @zama-fhe/react-sdk high-level hooks:
 *   - useShield({ address: wrapper })  → wrap (ERC-20 → ERC-7984), auto-approves
 *   - useUnshield(wrapper)             → unwrap, orchestrates unwrap + finalize + public-decrypt
 *
 * The wrapper contract IS the confidential token in this SDK (no separate pair).
 */

import { useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import {
  useShield,
  useUnshield,
  useConfidentialBalance,
  useHasPermit,
} from "@zama-fhe/react-sdk";
import { erc20Abi, NETWORKS, type Address } from "@wrapper-registry/contracts";
import { useRegistryPairs, type UnifiedPair } from "@/lib/registry";
import { useActiveNetwork } from "@/lib/use-active-network";
import { parseUnits, formatUnits, shortAddr } from "@/lib/format";
import { humanizeError } from "@/lib/errors";
import { pushToast } from "@/components/toast";
import { WrongNetworkBanner } from "@/components/wrong-network-banner";
import { TransactionStatus, type TxState } from "@/components/transaction-status";
import { Skeleton } from "@/components/skeleton";
import Link from "next/link";
import { ArrowLeftRight, ArrowDownUp, Lock, Unlock } from "lucide-react";

export default function WrapPage() {
  // The header renders in SSR (no useSearchParams); only the interactive
  // inner part is wrapped in Suspense so it doesn't block static prerender.
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Wrap & Unwrap</h1>
        <p className="mt-1 text-sm text-slate-400">
          Convert an underlying ERC-20 into its confidential ERC-7984 equivalent and back.
          Wrapping auto-approves the underlying; unwrapping runs the on-chain two-step
          (request → public decrypt → finalize) in one click.
        </p>
      </header>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <WrapPageInner />
      </Suspense>
    </div>
  );
}

function WrapPageInner() {
  const { isConnected } = useActiveNetwork();
  const param = useSearchParams().get("token");
  const [selected, setSelected] = useState<Address | null>(param as Address | null);

  return (
    <>
      <WrongNetworkBanner />

      {!isConnected && (
        <div className="card text-sm text-slate-300">Connect a wallet to wrap or unwrap tokens.</div>
      )}

      <TokenGrid selected={selected} onSelect={setSelected} />

      {selected && isConnected && <WrapCard key={selected} wrapper={selected} />}
    </>
  );
}

function TokenGrid({
  selected,
  onSelect,
}: {
  selected: Address | null;
  onSelect: (a: Address | null) => void;
}) {
  const { network } = useActiveNetwork();
  const { data: pairs, isLoading } = useRegistryPairs(network);

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {pairs?.map((p) => (
        <button
          key={p.confidentialToken}
          className={[
            "card text-left transition-colors",
            selected === p.confidentialToken
              ? "border-brand-500/50 bg-brand-950/20"
              : "hover:border-white/10",
          ].join(" ")}
          onClick={() => onSelect(p.confidentialToken)}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold">{p.symbol}</span>
            <span className="text-xs text-slate-500">ERC-7984</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-400">{p.name}</p>
          <p className="mono mt-0.5 text-xs text-slate-500">
            {shortAddr(p.confidentialToken)}
          </p>
        </button>
      ))}
    </section>
  );
}

function WrapCard({ wrapper }: { wrapper: Address }) {
  const { network } = useActiveNetwork();
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"wrap" | "unwrap">("wrap");
  const [tx, setTx] = useState<TxState>({ kind: "idle" });

  const { mutateAsync: shield, isPending: shielding } = useShield({ address: wrapper });
  const { mutateAsync: unshield, isPending: unshielding } = useUnshield(wrapper);

  const pair = useSelectedPair(wrapper);
  const decimals = pair?.decimals ?? 6;

  const { data: underlyingBalance, isLoading: balLoading } = useReadContract({
    address: pair?.underlying,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? "0x0"],
    query: { enabled: !!address && !!pair?.underlying },
  });

  // Confidential balance (only meaningful in unwrap mode; needs a permit).
  const { data: hasPermit } = useHasPermit({ contractAddresses: [wrapper] });
  const { data: confidentialBalance } = useConfidentialBalance({
    address: wrapper,
    account: address ?? "0x0000000000000000000000000000000000000000",
  });

  const parsedAmount = useMemo(() => {
    try {
      return parseUnits(amount || "0", decimals);
    } catch {
      return null;
    }
  }, [amount, decimals]);

  const pending = mode === "wrap" ? shielding : unshielding;

  const onWrap = async () => {
    if (!parsedAmount || parsedAmount <= 0n) {
      pushToast("error", "Enter a valid amount");
      return;
    }
    setTx({ kind: "pending", label: "Wrapping — approving & wrapping…" });
    try {
      const { txHash } = await shield({ amount: parsedAmount, approvalStrategy: "exact" });
      setTx({
        kind: "success",
        txHash,
        network,
        label: `Wrapped ${amount} ${pair?.symbol}`,
      });
      setAmount("");
    } catch (err) {
      setTx({ kind: "error", message: humanizeError(err) });
    }
  };

  const onUnwrap = async () => {
    if (!parsedAmount || parsedAmount <= 0n) {
      pushToast("error", "Enter a valid amount");
      return;
    }
    setTx({ kind: "pending", label: "Unwrapping (2-step: request → decrypt → finalize)…" });
    try {
      const { txHash } = await unshield({
        amount: parsedAmount,
        onUnwrapSubmitted: () =>
          setTx({ kind: "pending", label: "Unwrap requested — awaiting decryption proof…" }),
        onFinalizeSubmitted: () =>
          setTx({ kind: "pending", label: "Finalizing on-chain…" }),
      });
      setTx({
        kind: "success",
        txHash,
        network,
        label: `Unwrapped ${amount} c${pair?.symbol}`,
      });
      setAmount("");
    } catch (err) {
      setTx({ kind: "error", message: humanizeError(err) });
    }
  };

  return (
    <div className="card space-y-4">
      {/* mode toggle */}
      <div className="flex rounded-lg border border-white/5 p-1 text-sm" role="tablist" aria-label="Operation">
        <button
          role="tab"
          aria-selected={mode === "wrap"}
          className={[
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
            mode === "wrap" ? "bg-brand-600 text-white" : "text-slate-300 hover:text-white",
          ].join(" ")}
          onClick={() => {
            setMode("wrap");
            setTx({ kind: "idle" });
          }}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" /> Wrap
        </button>
        <button
          role="tab"
          aria-selected={mode === "unwrap"}
          className={[
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
            mode === "unwrap" ? "bg-brand-600 text-white" : "text-slate-300 hover:text-white",
          ].join(" ")}
          onClick={() => {
            setMode("unwrap");
            setTx({ kind: "idle" });
          }}
        >
          <ArrowDownUp className="h-3.5 w-3.5" /> Unwrap
        </button>
      </div>

      {/* balances */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/5 bg-black/20 p-3">
          <p className="flex items-center gap-1 text-xs text-slate-500">
            <Unlock className="h-3 w-3" /> Underlying
          </p>
          {balLoading ? (
            <Skeleton className="mt-1 h-4 w-24" />
          ) : (
            <p className="mono mt-1 text-sm text-slate-200">
              {formatUnits(underlyingBalance as bigint ?? 0n, decimals)} {pair?.symbol}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-white/5 bg-black/20 p-3">
          <p className="flex items-center gap-1 text-xs text-slate-500">
            <Lock className="h-3 w-3" /> Confidential
          </p>
          {mode === "unwrap" && hasPermit && confidentialBalance !== undefined ? (
            <p className="mono mt-1 text-sm text-brand-300">
              {formatUnits(confidentialBalance as bigint, decimals)} c{pair?.symbol}
            </p>
          ) : (
            <p className="mono mt-1 text-sm text-violet-300/60">encrypted</p>
          )}
        </div>
      </div>

      {/* amount input */}
      <div>
        <label htmlFor="amount" className="mb-1 block text-xs font-medium text-slate-400">
          {mode === "wrap" ? "Underlying amount" : "Confidential amount to unwrap"}
        </label>
        <input
          id="amount"
          className="input mono"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">
          {mode === "wrap"
            ? "Wrapping rounds down to 6 decimals (ERC-7984 euint64); any excess is refunded."
            : "Unwrap runs the on-chain two-step (request + public decrypt + finalize) automatically."}
        </p>
      </div>

      <button
        className="btn-primary w-full"
        disabled={pending || !parsedAmount || parsedAmount <= 0n}
        onClick={mode === "wrap" ? onWrap : onUnwrap}
      >
        {pending
          ? mode === "wrap"
            ? "Wrapping…"
            : "Unwrapping…"
          : mode === "wrap"
            ? `Wrap ${pair?.symbol ?? ""}`
            : `Unwrap c${pair?.symbol ?? ""}`}
      </button>

      <TransactionStatus state={tx} />

      {pair && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>ERC-20 ↔ ERC-7984</span>
          <Link
            className="underline decoration-dotted hover:text-slate-300"
            href={`/decrypt?token=${wrapper}`}
          >
            View confidential balance
          </Link>
        </div>
      )}
    </div>
  );
}

function useSelectedPair(wrapper: Address): UnifiedPair | undefined {
  const { network } = useActiveNetwork();
  const { data: pairs } = useRegistryPairs(network);
  return pairs?.find((p) => p.confidentialToken.toLowerCase() === wrapper.toLowerCase());
}
