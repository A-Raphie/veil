"use client";

/**
 * Hero — the landing's first impression.
 *
 * Concept: "the veil" = the FHE encryption layer hiding your balance until you
 * prove ownership. The right side reads REAL on-chain data (registry pair count
 * + a live encrypted total supply) — no fake numbers, no simulated flow. The
 * encrypted supply shown as ciphertext proves FHE is actually working.
 *
 * Behind it: a subtle "ciphertext rain" of hex handles — pure CSS, no canvas.
 */

import Link from "next/link";
import { ArrowRight, Droplets, Lock, Sparkles, ExternalLink } from "lucide-react";
import { useReadContract } from "wagmi";
import { NETWORKS, wrapperAbi } from "@wrapper-registry/contracts";
import { useActiveNetwork } from "@/lib/use-active-network";
import { useRegistryPairs } from "@/lib/registry";
import { shortAddr, explorerAddressUrl } from "@/lib/format";

export function Hero() {
  const { network } = useActiveNetwork();
  const registry = NETWORKS[network].registry;

  return (
    <section className="relative overflow-hidden border-b py-16 md:py-24">
      <CiphertextRain />
      <div className="relative mx-auto w-full max-w-[1600px] px-4 sm:px-6">
        <div className="grid items-start gap-10 md:gap-12 md:grid-cols-2">
        <div className="animate-slide-up">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
            Live on Zama Sepolia · ERC-7984
          </p>
          <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            Encrypted by default.
            <br />
            <span className="text-gradient">Yours to reveal.</span>
          </h1>
          <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-slate-300">
            Every ERC-20 becomes a confidential ERC-7984 token. Balances hidden
            on-chain, decrypted only with your cryptographic permission.
          </p>
          <p className="mt-3 max-w-md text-pretty text-base leading-relaxed text-slate-300">
            No intermediaries. Just math.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#registry" className="btn-primary">
              Browse the registry <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/faucet" className="btn-secondary">
              <Droplets className="h-4 w-4" /> Claim test tokens
            </Link>
          </div>
          {/* Contract address surfaced prominently — answers "is this deployed?" immediately */}
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Registry contract:</span>
            <a
              href={explorerAddressUrl(network, registry)}
              className="mono inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-slate-200 underline decoration-dotted hover:border-brand-500/40 hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              {shortAddr(registry)} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <HeroPanel />
        </div>
      </div>
    </section>
  );
}

/** Decorative "ciphertext rain" — vertical columns of hex handles. */
function CiphertextRain() {
  // Fixed handles (deterministic, not random per render — avoids hydration mismatch).
  const cols = [
    "0x4a7f", "0xb2e9", "0x8c1d", "0xf3a0", "0x2d5e", "0x9b47", "0xe18c", "0x6a2f",
  ];
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 flex justify-between overflow-hidden opacity-[0.07]"
    >
      {cols.map((c, i) => (
        <span
          key={i}
          className="mono whitespace-pre text-xs text-brand-300"
          style={{
            writingMode: "vertical-rl",
            animation: `rain ${8 + (i % 4) * 3}s linear ${i * 0.7}s infinite`,
          }}
        >
          {`${c} ${c} ${c} ${c} ${c} ${c} ${c}`}
        </span>
      ))}
    </div>
  );
}

/**
 * Hero data panel — reads REAL on-chain data, no fake animation.
 * Pulls the registry pair count and one real confidential total supply from
 * the first registry pair. The supply shows as a ciphertext handle, proving
 * FHE is actually working. No invented numbers.
 */
function HeroPanel() {
  const { network } = useActiveNetwork();
  const firstPair = NETWORKS[network].pairs[0];

  const { data: pairs } = useRegistryPairs(network);

  const { data: encryptedSupply } = useReadContract({
    address: firstPair?.confidentialToken,
    abi: wrapperAbi,
    functionName: "confidentialTotalSupply",
    query: { enabled: !!firstPair },
  });

  return (
    <div className="relative ml-auto w-full max-w-md animate-slide-up [animation-delay:150ms]">
      {/* glow behind the card */}
      <div
        aria-hidden="true"
        className="absolute -inset-4 -z-10 rounded-3xl opacity-40 blur-2xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(42,154,124,0.4), transparent 70%)",
        }}
      />
      <div className="glass space-y-4 rounded-xl border border-brand-500/20 p-5 shadow-2xl shadow-brand-950/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Live registry
          </span>
          <span className="badge bg-brand-500/15 text-brand-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
            on-chain
          </span>
        </div>

        {/* Real pair count */}
        <div className="rounded-lg border border-white/5 bg-black/40 p-4">
          <p className="text-xs text-slate-500">Pairs registered</p>
          <p className="mono mt-0.5 text-3xl font-semibold text-brand-300">
            {pairs?.length ?? "…"}
          </p>
        </div>

        {/* Real encrypted total supply — FHE proof. Rendered unconditionally
            (not gated on firstPair) so the panel height is stable from first
            paint and doesn't shift when data arrives. */}
        <div className="rounded-lg border border-violet-500/20 bg-violet-950/10 p-4">
          <p className="flex items-center gap-1 text-xs text-violet-300/80">
            <Lock className="h-3 w-3" />
            <span className="mono uppercase tracking-wide">{firstPair?.symbol ?? "TOKEN"} encrypted supply</span>
          </p>
          <p className="mono mt-1 min-h-[2.5rem] break-all text-xs text-violet-300/60">
            {encryptedSupply !== undefined
              ? `${(encryptedSupply as bigint).toString().slice(0, 24)}…`
              : "loading…"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Real on-chain value — FHE-encrypted, unreadable without a permit.
          </p>
        </div>

        <Link href="#registry" className="btn-primary w-full">
          Browse the registry <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
