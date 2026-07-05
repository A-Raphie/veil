"use client";

/**
 * WrapperInspector — a no-wallet interactive explorer for any ERC-7984 wrapper.
 *
 * Paste an address → instantly see its PUBLIC metadata (name, symbol, decimals,
 * whether it's a valid ERC-7984, whether it's in the official registry, the
 * underlying ERC-20) AND a ciphertext handle for the total supply — proving
 * exactly what FHE keeps private vs public.
 *
 * No wallet connection needed. This mirrors TryAnneal's `is_this_safe()` and
 * Cordon's "paste any address" screener — the winsznx pattern of a live,
 * no-friction interactive widget on the landing.
 *
 * Privacy-safe by construction: reads only public view functions. The
 * `confidentialTotalSupply` returns an encrypted handle (ciphertext), which we
 * display as-is to demonstrate FHE — it's literally unreadable without a permit.
 */

import { useState } from "react";
import { usePublicClient, useReadContract } from "wagmi";
import { wrapperAbi, registryAbi, NETWORKS, type Address } from "@wrapper-registry/contracts";
import { useActiveNetwork } from "@/lib/use-active-network";
import { checkAddress, addressErrorReason } from "@/lib/address";
import { shortAddr, explorerAddressUrl } from "@/lib/format";
import { Alert } from "@/components/alert";
import { Skeleton } from "@/components/skeleton";
import { Search, ShieldCheck, Eye, EyeOff, ExternalLink, Lock } from "lucide-react";
import { Copy } from "@/components/copy";

/** Preloaded example tokens — the first registry pair, clickable. */
export function WrapperInspector() {
  const { network } = useActiveNetwork();
  const firstPair = NETWORKS[network].pairs[0];
  const [input, setInput] = useState<string>(firstPair?.confidentialToken ?? "");
  const check = checkAddress(input);
  const address = check.ok ? check.address : null;

  return (
    <section className="py-14">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6">
        <p className="mono text-xs uppercase tracking-[0.18em] text-brand-400">
          04 — Inspect
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">
          Inspect any wrapper.{" "}
          <span className="text-slate-500">No wallet required.</span>
        </h2>
        <p className="mt-1 max-w-xl text-sm text-slate-400">
          Paste any ERC-7984 confidential token address. Public metadata reads
          instantly; encrypted fields display as ciphertext handles — exactly
          what FHE keeps private. Connect a wallet only when you want to decrypt
          a balance.
        </p>

        <div className="mt-6 card space-y-3">
          <label htmlFor="inspect-input" className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Search className="h-3.5 w-3.5" /> Wrapper contract address
          </label>
          <input
            id="inspect-input"
            className="input mono"
            placeholder="0x… ERC-7984 wrapper address"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          {input && !check.ok && check.reason !== "empty" && (
            <p className="text-xs text-rose-300">{addressErrorReason(check.reason)}</p>
          )}

          {/* Example chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Try:</span>
            {NETWORKS[network].pairs.slice(0, 4).map((p) => (
              <button
                key={p.confidentialToken}
                className="rounded-md border px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-brand-500/40 hover:text-white"
                onClick={() => setInput(p.confidentialToken)}
              >
                {p.symbol}
              </button>
            ))}
          </div>
        </div>

        {address && <InspectorResult key={address} address={address} />}
      </div>
    </section>
  );
}

function InspectorResult({ address }: { address: Address }) {
  const { network } = useActiveNetwork();
  const explorer = NETWORKS[network].explorer;

  // --- Public metadata reads ---
  const { data: name, isLoading: loadingName } = useReadContract({
    address, abi: wrapperAbi, functionName: "name", query: { enabled: !!address },
  });
  const { data: symbol, isLoading: loadingSymbol } = useReadContract({
    address, abi: wrapperAbi, functionName: "symbol", query: { enabled: !!address },
  });
  const { data: decimals } = useReadContract({
    address, abi: wrapperAbi, functionName: "decimals", query: { enabled: !!address },
  });
  const { data: rate } = useReadContract({
    address, abi: wrapperAbi, functionName: "rate", query: { enabled: !!address },
  });
  const { data: underlying } = useReadContract({
    address, abi: wrapperAbi, functionName: "underlying", query: { enabled: !!address },
  });

  // --- ERC-7984 interface check ---
  const { data: isErc7984, isLoading: checkingInterface } = useReadContract({
    address,
    abi: [{ type: "function", name: "supportsInterface", stateMutability: "view", inputs: [{ name: "interfaceId", type: "bytes4" }], outputs: [{ name: "", type: "bool" }] }] as const,
    functionName: "supportsInterface",
    args: ["0x4958f2a4"],
    query: { enabled: !!address },
  });

  // --- Registry lookup (is this an official pair?) ---
  const registry = NETWORKS[network].registry;
  const { data: registryUnderlying } = useReadContract({
    address: registry,
    abi: registryAbi,
    functionName: "getTokenAddress",
    args: [address],
    query: { enabled: !!address },
  });
  const inRegistry = Array.isArray(registryUnderlying) ? registryUnderlying[0] === true : false;

  // --- The encrypted total supply (ciphertext — demonstrates FHE) ---
  const { data: encryptedSupply } = useReadContract({
    address, abi: wrapperAbi, functionName: "confidentialTotalSupply", query: { enabled: !!address },
  });

  const anyLoading = loadingName || loadingSymbol || checkingInterface;

  return (
    <div className="mt-4 animate-veil-rise card space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isErc7984 ? (
            <span className="badge bg-brand-500/15 text-brand-300">
              <ShieldCheck className="h-3 w-3" /> ERC-7984
            </span>
          ) : checkingInterface ? (
            <Skeleton className="h-5 w-20 rounded-full" />
          ) : (
            <span className="badge bg-rose-500/15 text-rose-300">Not ERC-7984</span>
          )}
          {inRegistry && (
            <span className="badge bg-brand-500/15 text-brand-300">
              <ShieldCheck className="h-3 w-3" /> In registry
            </span>
          )}
        </div>
        <a
          href={`${explorer}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mono inline-flex items-center gap-1 text-xs text-slate-400 underline decoration-dotted hover:text-white"
        >
          {shortAddr(address)} <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Not ERC-7984 → clear error, stop here */}
      {isErc7984 === false && (
        <Alert variant="error" title="Not a confidential wrapper">
          This contract doesn&apos;t implement the ERC-7984 interface
          (<span className="mono">0x4958f2a4</span>). It may be a regular ERC-20
          or an unrelated contract.
        </Alert>
      )}

      {/* Metadata grid — only if it's ERC-7984 */}
      {isErc7984 !== false && (
        <>
          <dl className="grid gap-3 sm:grid-cols-2">
            {/* PUBLIC fields */}
            <Field label="Name" loading={anyLoading} value={name as string} type="public" />
            <Field label="Symbol" loading={anyLoading} value={symbol as string} type="public" />
            <Field
              label="Decimals"
              loading={anyLoading}
              value={decimals !== undefined ? String(decimals) : undefined}
              type="public"
            />
            <Field
              label="Wrap rate"
              loading={anyLoading}
              value={rate !== undefined ? `${(rate as bigint).toString()} : 1` : undefined}
              type="public"
            />
            <Field
              label="Underlying ERC-20"
              loading={anyLoading}
              value={underlying ? shortAddr(underlying as Address) : undefined}
              type="public"
              link={underlying ? `${explorer}/address/${underlying}` : undefined}
            />
          </dl>

          {/* The FHE proof — encrypted total supply shown as ciphertext */}
          <div className="rounded-lg border border-violet-500/20 bg-violet-950/10 p-4">
            <p className="flex items-center gap-1.5 text-xs text-violet-300/80">
              <EyeOff className="h-3 w-3" />
              <span className="mono uppercase tracking-wide">PRIVATE — encrypted on-chain</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Lock className="h-4 w-4 text-violet-400" />
              <span className="mono text-sm text-violet-300/70">
                {encryptedSupply !== undefined
                  ? `${(encryptedSupply as bigint).toString().slice(0, 18)}…`
                  : "—"}
              </span>
              <span className="text-xs text-slate-500">
                ciphertext handle — unreadable without a permit
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              This is the confidential total supply. It&apos;s a real on-chain
              value, but FHE-encrypted — no one can read it. Connect a wallet and
              grant a permit on the{" "}
              <a href="/decrypt" className="underline decoration-dotted hover:text-slate-300">decrypt page</a>{" "}
              to reveal your own balance.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/** A single metadata field with PUBLIC/PRIVATE classification. */
function Field({
  label,
  value,
  loading,
  type,
  link,
}: {
  label: string;
  value?: string;
  loading?: boolean;
  type: "public" | "private";
  link?: string;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/20 p-3">
      <p className="flex items-center gap-1 text-[11px] text-slate-500">
        {type === "public" ? (
          <Eye className="h-3 w-3 text-slate-500" />
        ) : (
          <EyeOff className="h-3 w-3" />
        )}
        <span className="mono uppercase tracking-wide">{type}:</span>
        <span className="normal-case tracking-normal text-slate-400">{label}</span>
      </p>
      {loading ? (
        <Skeleton className="mt-1 h-4 w-24" />
      ) : link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mono mt-1 block text-sm text-slate-200 underline decoration-dotted hover:text-white"
        >
          {value ?? "—"}
        </a>
      ) : (
        <p className="mono mt-1 text-sm text-slate-200">{value ?? "—"}</p>
      )}
    </div>
  );
}
