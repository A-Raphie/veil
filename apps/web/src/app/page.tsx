"use client";

/** Registry browser — the home page. Renders every ERC-20 ↔ ERC-7984 pair. */

import { useRegistryPairs } from "@/lib/registry";
import { useActiveNetwork } from "@/lib/use-active-network";
import { shortAddr, explorerAddressUrl } from "@/lib/format";
import { NETWORKS } from "@wrapper-registry/contracts";
import { Copy } from "@/components/copy";
import { Sparkles, ShieldCheck, FileWarning } from "lucide-react";

export default function RegistryPage() {
  const { network, isConnected } = useActiveNetwork();
  const { data: pairs, isLoading, isError, refetch } = useRegistryPairs(network);
  const registry = NETWORKS[network].registry;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Wrapper Registry</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Every official ERC-20 ↔ ERC-7984 confidential wrapper pair on{" "}
          <span className="text-slate-200">{network === "sepolia" ? "Sepolia" : "Ethereum"}</span>,
          sourced live from the on-chain registry, plus any local dev pairs. Wrap, unwrap, and
          decrypt balances from each card.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="mono">Registry: <a className="underline decoration-dotted hover:text-slate-300" href={explorerAddressUrl(network, registry)}>{shortAddr(registry)}</a></span>
          {!isConnected && <span className="badge bg-slate-700/40 text-slate-300">Connect a wallet to transact</span>}
        </div>
      </section>

      {isLoading && (
        <div className="card animate-pulse text-slate-400">Loading registry…</div>
      )}
      {isError && (
        <div className="card flex items-center gap-3 border-red-500/40 bg-red-950/30 text-red-200">
          <FileWarning className="h-4 w-4" />
          Couldn't read the on-chain registry.{" "}
          <button className="underline" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {pairs && pairs.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pairs.map((p) => (
            <article key={p.confidentialToken} className="card flex flex-col gap-3">
              <header className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold">{p.symbol}</h3>
                  <p className="text-xs text-slate-400">{p.name}</p>
                </div>
                <span
                  className={[
                    "badge",
                    p.source === "registry"
                      ? "bg-brand-500/15 text-brand-300"
                      : "bg-violet-500/15 text-violet-300",
                  ].join(" ")}
                >
                  {p.source === "registry" ? (
                    <><ShieldCheck className="h-3 w-3" /> registry</>
                  ) : (
                    <><Sparkles className="h-3 w-3" /> local</>
                  )}
                </span>
              </header>

              <dl className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">ERC-7984 wrapper</dt>
                  <dd className="flex items-center gap-1.5">
                    <a className="mono text-slate-200 underline decoration-dotted hover:text-white" href={explorerAddressUrl(network, p.confidentialToken)}>{shortAddr(p.confidentialToken)}</a>
                    <Copy value={p.confidentialToken} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Underlying ERC-20</dt>
                  <dd className="flex items-center gap-1.5">
                    <a className="mono text-slate-200 underline decoration-dotted hover:text-white" href={explorerAddressUrl(network, p.underlying)}>{shortAddr(p.underlying)}</a>
                    <Copy value={p.underlying} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Decimals</dt>
                  <dd className="text-slate-300">{p.decimals}</dd>
                </div>
                {network === "sepolia" && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-slate-500">Faucet</dt>
                    <dd className={p.faucetable ? "text-brand-300" : "text-slate-500"}>
                      {p.faucetable ? "mintable" : "—"}
                    </dd>
                  </div>
                )}
              </dl>

              <footer className="mt-auto flex flex-wrap gap-2 pt-1">
                <a href={`/wrap?token=${p.confidentialToken}`} className="btn-primary text-xs">Wrap / Unwrap</a>
                <a href={`/decrypt?token=${p.confidentialToken}`} className="btn-secondary text-xs">Decrypt balance</a>
              </footer>
            </article>
          ))}
        </section>
      )}

      {pairs && pairs.length === 0 && (
        <div className="card text-sm text-slate-400">No pairs found on this network.</div>
      )}
    </div>
  );
}
