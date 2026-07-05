"use client";

/**
 * Landing — hero + how-it-works + proof strip + the live registry grid.
 */

import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { WrapperInspector } from "@/components/wrapper-inspector";
import { WrongNetworkBanner } from "@/components/wrong-network-banner";
import { SkeletonPairGrid } from "@/components/skeleton";
import { useRegistryPairs } from "@/lib/registry";
import { useActiveNetwork } from "@/lib/use-active-network";
import { shortAddr, explorerAddressUrl } from "@/lib/format";
import { NETWORKS } from "@wrapper-registry/contracts";
import { Copy } from "@/components/copy";
import { Sparkles, ShieldCheck, FileWarning, ArrowRight, Layers, Lock, GitBranch } from "lucide-react";
import Link from "next/link";

export default function RegistryPage() {
  return (
    <div className="space-y-4">
      <Hero />
      <HowItWorks />
      <Manifesto />
      <WrapperInspector />
      <ProofStrip />
      <RegistrySection />
    </div>
  );
}

/** The competitive one-liner — "category creation" move judges reward. */
function Manifesto() {
  return (
    <section className="border-y bg-black/20 py-14">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6">
        <p className="mono text-xs uppercase tracking-[0.18em] text-brand-400">
          03 — Why
        </p>
        <p className="mt-4 max-w-3xl text-balance text-2xl font-semibold leading-snug tracking-tight md:text-3xl">
          Everyone built confidential tokens.{" "}
          <span className="text-slate-500">
            Nobody built the registry that makes them usable.
          </span>
        </p>
        <p className="mt-4 max-w-xl text-sm text-slate-400">
          Veil turns Zama&apos;s on-chain wrapper registry into a product every
          developer and user can point at — browse, wrap, decrypt, extend. The
          path of least resistance, not another fragmented set of bespoke
          wrappers.
        </p>
      </div>
    </section>
  );
}

/** Compact proof/stats strip — credibility cues (standard, networks, pairs). */
function ProofStrip() {
  const { network } = useActiveNetwork();
  const { data: pairs } = useRegistryPairs(network);

  const stats = [
    { icon: Layers, label: "Pairs live", value: pairs?.length?.toString() ?? "—" },
    { icon: GitBranch, label: "Network", value: "Sepolia" },
    { icon: Lock, label: "Standard", value: "ERC-7984" },
  ];

  return (
    <section className="border-y bg-black/20">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border bg-black/30 text-brand-400">
                <s.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-sm font-medium">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RegistrySection() {
  const { network, isConnected } = useActiveNetwork();
  const { data: pairs, isLoading, isError, refetch } = useRegistryPairs(network);
  const registry = NETWORKS[network].registry;

  return (
    <section id="registry" className="scroll-mt-20 py-14">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6">
      <WrongNetworkBanner />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            The registry, <span className="text-slate-500">live on-chain</span>
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Every official ERC-20 ↔ ERC-7984 pair, read straight from the
            Wrappers Registry contract. Wrap, unwrap, or decrypt from any card.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="badge bg-brand-500/15 text-brand-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
            live · {pairs?.length ?? "—"} pairs
          </span>
          <span className="mono">
            Registry:{" "}
            <a
              className="underline decoration-dotted hover:text-slate-300"
              href={explorerAddressUrl(network, registry)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {shortAddr(registry)}
            </a>
          </span>
        </div>
      </div>

      {!isConnected && (
        <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-950/20 px-4 py-2 text-xs text-amber-200/80">
          Connect a wallet on Sepolia to transact. Browsing the registry needs no wallet.
        </p>
      )}

      {isLoading && <div className="mt-6"><SkeletonPairGrid /></div>}

      {isError && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          <FileWarning className="h-4 w-4 shrink-0" />
          Couldn&apos;t read the on-chain registry.
          <button className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {pairs && pairs.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pairs.map((p) => (
            <article key={p.confidentialToken} className="card-hover group flex flex-col gap-3">
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
                    <>
                      <ShieldCheck className="h-3 w-3" /> registry
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" /> local
                    </>
                  )}
                </span>
              </header>

              <dl className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">ERC-7984 wrapper</dt>
                  <dd className="flex items-center gap-1.5">
                    <a
                      className="mono text-slate-200 underline decoration-dotted hover:text-white"
                      href={explorerAddressUrl(network, p.confidentialToken)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {shortAddr(p.confidentialToken)}
                    </a>
                    <Copy value={p.confidentialToken} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Underlying ERC-20</dt>
                  <dd className="flex items-center gap-1.5">
                    <a
                      className="mono text-slate-200 underline decoration-dotted hover:text-white"
                      href={explorerAddressUrl(network, p.underlying)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {shortAddr(p.underlying)}
                    </a>
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
                <Link
                  href={`/wrap?token=${p.confidentialToken}`}
                  className="btn-primary text-xs"
                >
                  Wrap / Unwrap <ArrowRight className="h-3 w-3" />
                </Link>
                <Link
                  href={`/decrypt?token=${p.confidentialToken}`}
                  className="btn-secondary text-xs"
                >
                  Decrypt balance
                </Link>
              </footer>
            </article>
          ))}
        </div>
      )}

      {pairs && pairs.length === 0 && (
        <div className="mt-6 card text-sm text-slate-400">No pairs found on this network.</div>
      )}
      </div>
    </section>
  );
}
