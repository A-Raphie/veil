"use client";

import Link from "next/link";
import { useState } from "react";
import { WalletButton } from "./wallet-button";
import { NetworkBadge } from "./network-badge";
import { Menu, X } from "lucide-react";
import { VeilMark } from "./veil-mark";

const NAV = [
  { href: "/", label: "Registry" },
  { href: "/faucet", label: "Faucet" },
  { href: "/wrap", label: "Wrap" },
  { href: "/decrypt", label: "Decrypt" },
];

export function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-4">
      {/* Left cluster: logo + nav links together */}
      <div className="flex items-center gap-6">
        <button
          type="button"
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link href="/" className="flex items-center gap-2" aria-label="Veil home">
          <VeilMark className="h-6 w-6" />
          <span className="text-lg font-semibold tracking-tight">Veil</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
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
      </div>

      {/* Right cluster: network + wallet */}
      <div className="flex items-center gap-3">
        <NetworkBadge />
        <WalletButton />
      </div>

      {/* Mobile nav drawer */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="grid w-full grid-cols-2 gap-2 border-t pt-4 md:hidden"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md border px-3 py-2 text-center text-sm hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
