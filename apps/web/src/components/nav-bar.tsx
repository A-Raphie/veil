"use client";

import Link from "next/link";
import { WalletButton } from "./wallet-button";
import { NetworkBadge } from "./network-badge";

const NAV = [
  { href: "/", label: "Registry" },
  { href: "/faucet", label: "Faucet" },
  { href: "/wrap", label: "Wrap" },
  { href: "/decrypt", label: "Decrypt" },
];

export function NavBar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b py-4">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-lg font-semibold tracking-tight">
          Confidential Wrapper Registry
        </span>
      </Link>
      <nav className="flex items-center gap-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <NetworkBadge />
        <WalletButton />
      </div>
    </header>
  );
}
