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
  useWrappedToken,
} from "@zama-fhe/react-sdk";
import {
  erc20Abi,
  NETWORKS,
  type Address,
} from "@wrapper-registry/contracts";
import { useRegistryPairs, type UnifiedPair } from "@/lib/registry";
import { useActiveNetwork } from "@/lib/use-active-network";
import { parseUnits, formatUnits, shortAddr, explorerTxUrl } from "@/lib/format";
import { humanizeError } from "@/lib/errors";
import { pushToast } from "@/components/toast";
import Link from "next/link";
import { ArrowLeftRight, ArrowDownUp, ExternalLink } from "lucide-react";

export default function WrapPage() {
  // useSearchParams must be inside a Suspense boundary for static prerender.
  return (
    <Suspense fallback={<div className="card animate-pulse text-slate-400">Loading…</div>}>
      <WrapPageInner />
    </Suspense>
  );
}

function WrapPageInner() {
  const { isConnected } = useActiveNetwork();
  const param = useSearchParams().get("token");
  const [selected, setSelected] = useState<Address | null>(param as Address | null);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Wrap & Unwrap</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Convert an underlying ERC-20 into its confidential ERC-7984 equivalent and back.
          Wrapping auto-approves the underlying; unwrapping runs the on-chain two-step
          (request → public decrypt → finalize) in one click.
        </p>
      </header>

      {!isConnected && (
        <div className="card text-sm text-slate-400">Connect a wallet to wrap or unwrap tokens.</div>
      )}

      <TokenPicker selected={selected} onSelect={setSelected} />

      {selected && isConnected && <WrapCard key={selected} wrapper={selected} />}
    </div>
  );
}

function TokenPicker({
  selected,
  onSelect,
}: {
  selected: Address | null;
  onSelect: (a: Address | null) => void;
}) {
  const { network } = useActiveNetwork();
  const { data: pairs, isLoading } = useRegistryPairs(network);

  if (isLoading) return <div className="card animate-pulse text-slate-400">Loading pairs…</div>;

  return (
    <div className="card">
      <label className="text-xs font-medium text-slate-400">Confidential token</label>
      <select
        className="input mt-2"
        value={selected ?? ""}
        onChange={(e) => onSelect((e.target.value || null) as Address | null)}
      >
        <option value="">Select a wrapper…</option>
        {pairs?.map((p) => (
          <option key={p.confidentialToken} value={p.confidentialToken}>
            {p.symbol} — {p.name} ({shortAddr(p.confidentialToken)})
          </option>
        ))}
      </select>
    </div>
  );
}

function WrapCard({ wrapper }: { wrapper: Address }) {
  const { network } = useActiveNetwork();
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"wrap" | "unwrap">("wrap");

  // react-sdk token instance + shield/unshield hooks (operating on the wrapper).
  const wt = useWrappedToken(wrapper);
  const { mutateAsync: shield, isPending: shielding } = useShield({ address: wrapper });
  const { mutateAsync: unshield, isPending: unshielding } = useUnshield(wrapper);

  // Underlying metadata + balances for the UI.
  const pair = useSelectedPair(wrapper);
  const decimals = pair?.decimals ?? 6;

  const { data: underlyingBalance } = useReadContract({
    address: pair?.underlying,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? "0x0"],
    query: { enabled: !!address && !!pair?.underlying },
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
    try {
      const { txHash } = await shield({ amount: parsedAmount, approvalStrategy: "exact" });
      pushToast("success", `Wrapped ${amount} ${pair?.symbol}`);
      // surface the tx link
      window.open(explorerTxUrl(network, txHash), "_blank", "noopener");
    } catch (err) {
      pushToast("error", humanizeError(err));
    }
  };

  const onUnwrap = async () => {
    if (!parsedAmount || parsedAmount <= 0n) {
      pushToast("error", "Enter a valid amount");
      return;
    }
    try {
      const { txHash } = await unshield({
        amount: parsedAmount,
        onUnwrapSubmitted: () => pushToast("info", "Unwrap requested — awaiting decryption proof…"),
        onFinalizeSubmitted: () => pushToast("success", "Finalized — unwrapped to your wallet"),
      });
      void txHash;
    } catch (err) {
      pushToast("error", humanizeError(err));
    }
  };

  return (
    <div className="card space-y-4">
      {/* mode toggle */}
      <div className="flex rounded-lg border p-1 text-sm">
        <button
          className={[
            "flex-1 rounded-md px-3 py-1.5 font-medium transition-colors",
            mode === "wrap" ? "bg-brand-600 text-white" : "text-slate-300 hover:text-white",
          ].join(" ")}
          onClick={() => setMode("wrap")}
        >
          <ArrowLeftRight className="mr-1.5 inline h-3.5 w-3.5" /> Wrap
        </button>
        <button
          className={[
            "flex-1 rounded-md px-3 py-1.5 font-medium transition-colors",
            mode === "unwrap" ? "bg-brand-600 text-white" : "text-slate-300 hover:text-white",
          ].join(" ")}
          onClick={() => setMode("unwrap")}
        >
          <ArrowDownUp className="mr-1.5 inline h-3.5 w-3.5" /> Unwrap
        </button>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
          <span>{mode === "wrap" ? "Underlying amount" : "Confidential amount to unwrap"}</span>
          {pair && (
            <span>
              Bal: {mode === "wrap"
                ? `${formatUnits(underlyingBalance as bigint ?? 0n, decimals)} ${pair.symbol}`
                : "encrypted"}
            </span>
          )}
        </div>
        <input
          className="input"
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
          ? mode === "wrap" ? "Wrapping…" : "Unwrapping…"
          : mode === "wrap" ? `Wrap ${pair?.symbol ?? ""}` : `Unwrap c${pair?.symbol ?? ""}`}
      </button>

      {pair && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>ERC-20 ↔ ERC-7984</span>
          <Link className="inline-flex items-center gap-1 underline decoration-dotted hover:text-slate-300" href={`/decrypt?token=${wrapper}`}>
            View confidential balance <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}
      {/* wt instance is currently used for type presence; future metadata calls go here */}
      <span className="hidden">{typeof wt}</span>
    </div>
  );
}

function useSelectedPair(wrapper: Address): UnifiedPair | undefined {
  const { network } = useActiveNetwork();
  const { data: pairs } = useRegistryPairs(network);
  return pairs?.find((p) => p.confidentialToken.toLowerCase() === wrapper.toLowerCase());
}
