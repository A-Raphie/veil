"use client";

/**
 * Wrap / Unwrap — the core confidential-token flow.
 *
 * Every pair gets its own compact card in a responsive grid.
 * No scrolling on desktop: 4 cols × 2 rows.
 */

import { useMemo, useState, Suspense } from "react";
import { useAccount, useReadContract } from "wagmi";
import {
  useShield,
  useUnshield,
  useConfidentialBalance,
  useHasPermit,
} from "@zama-fhe/react-sdk";
import { erc20Abi } from "@wrapper-registry/contracts";
import { useRegistryPairs, type UnifiedPair } from "@/lib/registry";
import { useActiveNetwork } from "@/lib/use-active-network";
import { parseUnits, formatUnits, shortAddr } from "@/lib/format";
import { humanizeError } from "@/lib/errors";
import { pushToast } from "@/components/toast";
import { WrongNetworkBanner } from "@/components/wrong-network-banner";
import { TransactionStatus, type TxState } from "@/components/transaction-status";
import { Skeleton } from "@/components/skeleton";
import Link from "next/link";
import { ArrowLeftRight, ArrowDownUp, Lock, Unlock, ShieldCheck } from "lucide-react";

export default function WrapPage() {
  return (
    <section className="py-[45px]">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6">
        <WrongNetworkBanner />

        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Wrap & <span className="text-slate-500">Unwrap</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Convert an underlying ERC-20 into its confidential ERC-7984 equivalent and back.
          </p>
        </div>

        <Suspense fallback={<div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}</div>}>
          <WrapPageInner />
        </Suspense>
      </div>
    </section>
  );
}

function WrapPageInner() {
  const { isConnected } = useActiveNetwork();
  const { network } = useActiveNetwork();
  const { data: pairs, isLoading, isError, refetch } = useRegistryPairs(network);

  return (
    <>
      {!isConnected && (
        <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-950/20 px-4 py-2 text-xs text-center text-amber-200/80">
          Connect a wallet on {network === "mainnet" ? "mainnet" : "Sepolia"} to wrap or unwrap.
        </p>
      )}

      {isLoading && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-6 rounded-lg border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          Couldn&apos;t load registry pairs.
          <button className="ml-2 underline" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {pairs && pairs.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pairs.filter((p) => p.isValid).map((p) => (
            <PairWrapCard key={p.confidentialToken} pair={p} />
          ))}
        </div>
      )}

      {pairs && pairs.length === 0 && (
        <div className="mt-6 card text-sm text-slate-400">No pairs found on this network.</div>
      )}
    </>
  );
}

function PairWrapCard({ pair }: { pair: UnifiedPair }) {
  const { network } = useActiveNetwork();
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"wrap" | "unwrap">("wrap");
  const [tx, setTx] = useState<TxState>({ kind: "idle" });

  const { mutateAsync: shield, isPending: shielding } = useShield({ address: pair.confidentialToken });
  const { mutateAsync: unshield, isPending: unshielding } = useUnshield(pair.confidentialToken);

  const decimals = pair.decimals;

  const { data: underlyingBalance, isLoading: balLoading } = useReadContract({
    address: pair.underlying,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? "0x0"],
    query: { enabled: !!address },
  });

  const { data: hasPermit } = useHasPermit({ contractAddresses: [pair.confidentialToken] });
  const { data: confidentialBalance } = useConfidentialBalance({
    address: pair.confidentialToken,
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

  const inputId = `wrap-amount-${pair.confidentialToken}`;

  const onWrap = async () => {
    if (!parsedAmount || parsedAmount <= 0n) {
      pushToast("error", "Enter a valid amount");
      return;
    }
    setTx({ kind: "pending", label: "Wrapping…" });
    try {
      const { txHash } = await shield({ amount: parsedAmount, approvalStrategy: "exact" });
      setTx({ kind: "success", txHash, network, label: `Wrapped ${amount} ${pair.symbol}` });
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
    setTx({ kind: "pending", label: "Unwrapping…" });
    try {
      const { txHash } = await unshield({
        amount: parsedAmount,
        onUnwrapSubmitted: () => setTx({ kind: "pending", label: "Decrypting…" }),
        onFinalizeSubmitted: () => setTx({ kind: "pending", label: "Finalizing…" }),
      });
      setTx({ kind: "success", txHash, network, label: `Unwrapped ${amount} c${pair.symbol}` });
      setAmount("");
    } catch (err) {
      setTx({ kind: "error", message: humanizeError(err) });
    }
  };

  return (
    <article className="card flex flex-col gap-2">
      <header className="flex items-center justify-between gap-2">
        <span className="font-semibold">{pair.symbol}</span>
        <span className="badge bg-brand-500/15 text-brand-300">
          <ShieldCheck className="h-3 w-3" /> ERC-7984
        </span>
      </header>

      <div className="flex rounded-md border border-white/5 p-0.5 text-xs" role="tablist" aria-label={`${pair.symbol} operation`}>
        <button
          role="tab"
          aria-selected={mode === "wrap"}
          className={[
            "flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 font-medium transition-colors",
            mode === "wrap" ? "bg-brand-600 text-white" : "text-slate-300 hover:text-white",
          ].join(" ")}
          onClick={() => { setMode("wrap"); setTx({ kind: "idle" }); }}
        >
          <ArrowLeftRight className="h-3 w-3" /> Wrap
        </button>
        <button
          role="tab"
          aria-selected={mode === "unwrap"}
          className={[
            "flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 font-medium transition-colors",
            mode === "unwrap" ? "bg-brand-600 text-white" : "text-slate-300 hover:text-white",
          ].join(" ")}
          onClick={() => { setMode("unwrap"); setTx({ kind: "idle" }); }}
        >
          <ArrowDownUp className="h-3 w-3" /> Unwrap
        </button>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-slate-500"><Unlock className="h-3 w-3" /> Underlying</span>
          {balLoading ? (
            <Skeleton className="h-3 w-16" />
          ) : (
            <span className="mono text-slate-200">{formatUnits(underlyingBalance as bigint ?? 0n, decimals)} {pair.symbol}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-slate-500"><Lock className="h-3 w-3" /> Confidential</span>
          {mode === "unwrap" && hasPermit && confidentialBalance !== undefined ? (
            <span className="mono text-brand-300">{formatUnits(confidentialBalance as bigint, decimals)} c{pair.symbol}</span>
          ) : (
            <span className="mono text-violet-300/60">encrypted</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          id={inputId}
          className="input mono flex-1"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          className="btn-primary shrink-0 text-xs"
          disabled={pending || !parsedAmount || parsedAmount <= 0n}
          onClick={mode === "wrap" ? onWrap : onUnwrap}
        >
          {pending
            ? mode === "wrap" ? "Wrapping…" : "Unwrapping…"
            : mode === "wrap" ? `Wrap` : `Unwrap`}
        </button>
      </div>

      <TransactionStatus state={tx} />

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>ERC-20 ↔ ERC-7984</span>
        <Link
          className="underline decoration-dotted hover:text-slate-300"
          href={`/decrypt?token=${pair.confidentialToken}`}
        >
          View balance →
        </Link>
      </div>
    </article>
  );
}
