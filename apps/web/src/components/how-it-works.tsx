"use client";

/**
 * How it works — three steps, each naming the mechanism (not just the action).
 * Each step carries a PUBLIC:/PRIVATE: classification strip (borrowed from
 * DarkOdds' dossier aesthetic) — it teaches what FHE actually hides, which
 * doubles as proof the project understands the primitive.
 */

import Link from "next/link";
import { Droplets, ArrowLeftRight, KeyRound, Eye, EyeOff } from "lucide-react";

interface Step {
  n: string;
  href: string;
  icon: typeof Droplets;
  title: string;
  body: string;
  publicInfo: string;
  privateInfo: string;
}

const STEPS: Step[] = [
  {
    n: "01",
    href: "/faucet",
    icon: Droplets,
    title: "Claim test tokens",
    body: "Mint the official cTokenMocks on Sepolia. No KYC, no wait — straight into your wallet, ready to wrap.",
    publicInfo: "token address, mint tx",
    privateInfo: "—",
  },
  {
    n: "02",
    href: "/wrap",
    icon: ArrowLeftRight,
    title: "Wrap into ciphertext",
    body: "Convert an ERC-20 into its confidential ERC-7984 twin. The balance is now an encrypted handle — unreadable on-chain.",
    publicInfo: "wrap tx, token ID",
    privateInfo: "balance, amount",
  },
  {
    n: "03",
    href: "/decrypt",
    icon: KeyRound,
    title: "Decrypt with a permit",
    body: "Sign a one-time EIP-712 permit and your balance resolves to cleartext — in your browser, never to anyone else.",
    publicInfo: "permit signature",
    privateInfo: "decrypted balance",
  },
];

export function HowItWorks() {
  return (
    <section className="py-14">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6">
        <p className="mono text-xs uppercase tracking-[0.18em] text-brand-400">
          02 — How it works
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">
          Three steps from a public token to a private balance.
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n}>
              <Link
                href={s.href}
                className="card-hover group block h-full"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border bg-black/30 text-brand-400">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span className="mono text-xs text-slate-500">{s.n}</span>
                </div>
                <h3 className="mt-4 font-medium">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{s.body}</p>
                {/* PUBLIC:/PRIVATE: strip — what FHE hides vs what's visible */}
                <div className="mt-4 space-y-1 border-t pt-3 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Eye className="h-3 w-3 text-slate-500" />
                    <span className="mono uppercase tracking-wide text-slate-500">PUBLIC:</span>
                    <span>{s.publicInfo}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-brand-300/80">
                    <EyeOff className="h-3 w-3" />
                    <span className="mono uppercase tracking-wide text-brand-400/70">PRIVATE:</span>
                    <span>{s.privateInfo}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
