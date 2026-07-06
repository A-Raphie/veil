"use client";

/**
 * Veil landing — 7 sections matching the winsznx structural bar:
 * Hero → Problem → How it works → Inspect → The Stack → Registry → Footer
 */

import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { WrapperInspector } from "@/components/wrapper-inspector";
import { AddPairForm } from "@/components/add-pair-form";
import { WrongNetworkBanner } from "@/components/wrong-network-banner";
import { SkeletonPairGrid } from "@/components/skeleton";
import { useRegistryPairs } from "@/lib/registry";
import { useActiveNetwork } from "@/lib/use-active-network";
import { shortAddr, explorerAddressUrl } from "@/lib/format";
import { NETWORKS } from "@wrapper-registry/contracts";
import { Copy } from "@/components/copy";
import { Sparkles, ShieldCheck, ShieldOff, FileWarning, ArrowRight, Layers, Lock, GitBranch, AlertTriangle, Eye, Cpu, KeyRound, Network } from "lucide-react";
import Link from "next/link";

export default function RegistryPage() {
  return (
    <div className="space-y-4">
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <WrapperInspector />
      <TheStack />
      <RegistrySection />
    </div>
  );
}

/** Problem section — merged with the manifesto one-liner as heading. */
function ProblemSection() {
  const { network } = useActiveNetwork();
  const { data: pairs } = useRegistryPairs(network);
  const pairCount = pairs?.length?.toString() ?? "…";

  const problems = [
    {
      icon: Layers,
      stat: "1",
      label: "registry contract",
      description: "Zama deployed an on-chain Wrappers Registry on Sepolia. No frontend to browse it. Developers and users read contract ABIs.",
    },
    {
      icon: Eye,
      stat: "5",
      label: "steps to wrap one token",
      description: "Find the wrapper. Approve the underlying. Wrap. Decrypt. No faucet, no guided flow, no single place to do it all.",
    },
    {
      icon: AlertTriangle,
      stat: pairCount,
      label: "official pairs",
      description: "Every official pair exists on-chain. None of them walk you through the process.",
    },
  ];

  return (
    <section className="py-14">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6">
        <p className="mono text-xs uppercase tracking-[0.18em] text-brand-400">
          01 — The Problem
        </p>
        <h2 className="mt-2 text-balance text-2xl font-semibold leading-snug tracking-tight md:text-3xl">
          Everyone built confidential tokens.{" "}
          <span className="text-slate-500">Nobody built the registry that makes them usable.</span>
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {problems.map((p) => (
            <div key={p.label} className="card">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border bg-black/30 text-rose-400">
                  <p.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-rose-400">{p.stat}</p>
                  <p className="text-xs text-slate-500">{p.label}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-400">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The Stack — mechanism deep-dive (winsznx's signature section). */
function TheStack() {
  const layers = [
    {
      icon: Cpu,
      name: "FHEVM",
      role: "Encrypted EVM state",
      detail: "Balances stored as ciphertext on-chain. Arithmetic (add, sub, compare) runs on encrypted values via the Coprocessor — plaintext never touches storage.",
    },
    {
      icon: Layers,
      name: "ERC-7984",
      role: "Confidential token standard",
      detail: "The wrapper standard. Every ERC-20 has a confidential twin with an encrypted balance. Wrap converts plaintext → ciphertext; unwrap reverses it.",
    },
    {
      icon: KeyRound,
      name: "EIP-712 Permit",
      role: "User-decryption flow",
      detail: "To read your own balance, you sign a one-time typed message. The KMS threshold-signs a re-encryption key. Only your browser sees the plaintext — never the contract, never the relayer.",
    },
    {
      icon: Network,
      name: "Relayer + Gateway",
      role: "FHE orchestration",
      detail: "The relayer handles proof generation, public decryption, and key distribution. Open and keyless on Sepolia — no API key needed for the bounty flow.",
    },
  ];

  return (
    <section className="border-y bg-black/20 py-14">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6">
        <p className="mono text-xs uppercase tracking-[0.18em] text-brand-400">
          04 — The Stack
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">
          How it works under the hood.
        </h2>
        <p className="mt-1 max-w-xl text-sm text-slate-400">
          Four layers, each doing one job. Veil orchestrates them through the
          @zama-fhe/sdk so you never touch the cryptography directly.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {layers.map((l, i) => (
            <div key={l.name} className="card">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border bg-black/30 text-brand-400">
                  <l.icon className="h-4 w-4" />
                </span>
                <span className="mono text-xs text-slate-500">L{i + 1}</span>
              </div>
              <h3 className="mt-4 font-medium">{l.name}</h3>
              <p className="text-xs text-brand-300">{l.role}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{l.detail}</p>
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
            <article key={p.confidentialToken} className={["card-hover group flex flex-col gap-3", !p.isValid && "opacity-40", !p.faucetable && p.isValid && "opacity-50"].join(" ")}>
              <header className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold">{p.symbol}</h3>
                  <p className="text-xs text-slate-400">{p.name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {!p.isValid && (
                    <span className="badge bg-rose-500/15 text-rose-300">
                      <ShieldOff className="h-3 w-3" /> revoked
                    </span>
                  )}
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
                </div>
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
                      {p.faucetable ? "mintable" : "restricted"}
                    </dd>
                  </div>
                )}
              </dl>

              <footer className="mt-auto flex flex-wrap gap-2 pt-1">
                {p.isValid ? (
                  <Link
                    href={`/wrap?token=${p.confidentialToken}`}
                    className="btn-primary text-xs"
                  >
                    Wrap / Unwrap <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <span className="btn-secondary text-xs opacity-50 cursor-not-allowed">
                    Revoked
                  </span>
                )}
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

      {/* Extensibility: in-browser admin UI for adding custom pairs */}
      <div className="mt-6">
        <AddPairForm />
      </div>
      </div>
    </section>
  );
}
