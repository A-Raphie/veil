"use client";

/**
 * Faucet — mint the official cTokenMock underlying ERC-20s on Sepolia.
 *
 * Each cTokenMock exposes a public `mint(to, amount)` capped at 1,000,000 units
 * per call (see FAUCET_MINT_AMOUNT). On mainnet there's nothing to mint, so the
 * page is Sepolia-only by design.
 */

import { useState } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { parseUnits, formatUnits, shortAddr } from "@/lib/format";
import { humanizeError } from "@/lib/errors";
import { pushToast } from "@/components/toast";
import { useActiveNetwork } from "@/lib/use-active-network";
import {
  erc20Abi,
  FAUCET_MINT_AMOUNT,
  NETWORKS,
  type Address,
} from "@wrapper-registry/contracts";
import { NetworkBadge } from "@/components/network-badge";
import { Coins } from "lucide-react";
import Link from "next/link";

export default function FaucetPage() {
  const { network, isConnected, isSupported } = useActiveNetwork();
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [busy, setBusy] = useState<Address | null>(null);

  const faucetable = NETWORKS[network].pairs.filter((p) => p.faucetable);

  if (network !== "sepolia") {
    return (
      <div className="space-y-4">
        <Header />
        <div className="card text-sm text-slate-400">
          The faucet is Sepolia-only. Switch networks to claim official cTokenMocks.
          <div className="mt-3"><NetworkBadge /></div>
        </div>
      </div>
    );
  }

  const onMint = async (token: Address, symbol: string, decimals: number) => {
    if (!address) {
      pushToast("error", "Connect a wallet first");
      return;
    }
    setBusy(token);
    try {
      // Mint 1,000,000 whole units (the per-call cap). parseUnits handles decimals.
      const amount = parseUnits("1000000", decimals);
      const tx = await writeContractAsync({
        address: token,
        abi: erc20Abi,
        functionName: "mint",
        args: [address, amount],
      });
      pushToast("success", `Minting 1,000,000 ${symbol}… ${shortAddr(tx)}`);
    } catch (err) {
      pushToast("error", humanizeError(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <Header />

      {!isConnected && (
        <div className="card text-sm text-slate-400">
          Connect a wallet on Sepolia to claim official cTokenMocks.
        </div>
      )}
      {isConnected && !isSupported && (
        <div className="card border-amber-500/40 bg-amber-950/30 text-amber-200 text-sm">
          Your wallet is on an unsupported network. <NetworkBadge />
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        {faucetable.map((p) => (
          <FaucetRow
            key={p.underlying}
            symbol={p.symbol}
            name={p.name}
            decimals={p.decimals}
            token={p.underlying}
            address={address}
            busy={busy === p.underlying}
            disabled={isPending || !isConnected || !isSupported}
            onMint={() => onMint(p.underlying, p.symbol, p.decimals)}
          />
        ))}
      </section>

      <div className="card text-xs text-slate-400">
        Minted tokens are the <span className="text-slate-200">underlying</span> ERC-20. To get the
        confidential (ERC-7984) version, wrap them on the{" "}
        <Link className="text-brand-300 underline" href="/wrap">Wrap</Link> page.
      </div>
    </div>
  );
}

function FaucetRow(props: {
  symbol: string;
  name: string;
  decimals: number;
  token: Address;
  address?: Address;
  busy: boolean;
  disabled: boolean;
  onMint: () => void;
}) {
  const { data: balance } = useReadContract({
    address: props.token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [props.address ?? "0x0000000000000000000000000000000000000001"],
    query: { enabled: !!props.address },
  });

  return (
    <div className="card flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-brand-400" />
          <span className="font-semibold">{props.symbol}</span>
          <span className="text-xs text-slate-500">cTokenMock</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-400">{props.name}</p>
        <p className="mt-0.5 mono text-xs text-slate-500">{shortAddr(props.token)}</p>
        {props.address && balance !== undefined && (
          <p className="mt-1 text-xs text-slate-300">
            Balance: {formatUnits(balance as bigint, props.decimals)} {props.symbol}
          </p>
        )}
      </div>
      <button
        className="btn-primary shrink-0"
        disabled={props.disabled || props.busy}
        onClick={props.onMint}
      >
        {props.busy ? "Minting…" : "Claim 1,000,000"}
      </button>
    </div>
  );
}

function Header() {
  return (
    <header>
      <h1 className="text-2xl font-semibold tracking-tight">Sepolia Faucet</h1>
      <p className="mt-1 text-sm text-slate-400">
        Claim the official cTokenMock test tokens (1,000,000 per call, per token).
        These mint into your connected wallet and are immediately wrap-ready.
      </p>
    </header>
  );
}
