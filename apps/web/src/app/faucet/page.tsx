"use client";

/**
 * Faucet — mint the official cTokenMock underlying ERC-20s on Sepolia.
 *
 * Each cTokenMock exposes a public `mint(to, amount)` capped at 1,000,000 units
 * per call. On mainnet there's nothing to mint, so the page is Sepolia-only.
 */

import { useState } from "react";
import { useAccount, useWriteContract, useReadContract, useSendCalls } from "wagmi";
import { encodeFunctionData } from "viem";
import { formatUnits, shortAddr } from "@/lib/format";
import { humanizeError } from "@/lib/errors";
import { pushToast } from "@/components/toast";
import { useActiveNetwork } from "@/lib/use-active-network";
import { WrongNetworkBanner } from "@/components/wrong-network-banner";
import { TransactionStatus, type TxState } from "@/components/transaction-status";
import { Skeleton } from "@/components/skeleton";
import {
  erc20Abi,
  FAUCET_MINT_AMOUNT,
  NETWORKS,
  SEPOLIA_CHAIN_ID,
  type Address,
} from "@wrapper-registry/contracts";
import { NetworkBadge } from "@/components/network-badge";
import { Coins, Wallet } from "lucide-react";
import Link from "next/link";

export default function FaucetPage() {
  const { network, isConnected, isSupported } = useActiveNetwork();
  const faucetable = NETWORKS[network].pairs.filter((p) => p.faucetable);

  if (network !== "sepolia") {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-14">
        <Header />
        <div className="card text-sm text-slate-300">
          The faucet is Sepolia-only. Switch networks to claim official cTokenMocks.
          <div className="mt-3">
            <NetworkBadge />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-14">
      <Header />

      <WrongNetworkBanner />

      {!isConnected && (
        <div className="card flex items-center gap-3 text-sm text-slate-300">
          <Wallet className="h-4 w-4 text-brand-400" />
          Connect a wallet on Sepolia to claim official cTokenMocks.
        </div>
      )}

      {isConnected && isSupported && (
        <ClaimAllButton pairs={faucetable} />
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        {faucetable.map((p) => (
          <FaucetRow
            key={p.underlying}
            symbol={p.symbol}
            name={p.name}
            decimals={p.decimals}
            token={p.underlying}
            disabled={!isConnected || !isSupported}
          />
        ))}
      </section>

      <div className="card text-xs text-slate-400">
        Minted tokens are the <span className="text-slate-200">underlying</span> ERC-20. To get the
        confidential (ERC-7984) version, wrap them on the{" "}
        <Link className="text-brand-300 underline" href="/wrap">
          Wrap
        </Link>{" "}
        page.
      </div>
    </div>
  );
}

function FaucetRow(props: {
  symbol: string;
  name: string;
  decimals: number;
  token: Address;
  disabled: boolean;
}) {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [tx, setTx] = useState<TxState>({ kind: "idle" });

  const { data: balance, isLoading: balanceLoading } = useReadContract({
    address: props.token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000001"],
    query: { enabled: !!address },
  });

  const onMint = async () => {
    if (!address) {
      pushToast("error", "Connect a wallet first");
      return;
    }
    setTx({ kind: "pending", label: `Minting 1,000,000 ${props.symbol}…` });
    try {
      const amount = FAUCET_MINT_AMOUNT * 10n ** BigInt(props.decimals);
      const txHash = await writeContractAsync({
        address: props.token,
        abi: erc20Abi,
        functionName: "mint",
        args: [address, amount],
      });
      setTx({
        kind: "success",
        txHash,
        network: "sepolia",
        label: `Minted 1,000,000 ${props.symbol}`,
      });
    } catch (err) {
      setTx({ kind: "error", message: humanizeError(err) });
    }
  };

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-brand-400" />
            <span className="font-semibold">{props.symbol}</span>
            <span className="text-xs text-slate-500">cTokenMock</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-400">{props.name}</p>
          <p className="mono mt-0.5 text-xs text-slate-500">{shortAddr(props.token)}</p>
        </div>
        <button
          className="btn-primary shrink-0 text-xs"
          disabled={props.disabled || isPending}
          onClick={onMint}
        >
          {isPending && tx.kind === "pending" ? "Minting…" : "Claim 1,000,000"}
        </button>
      </div>

      {address && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Your balance</span>
          {balanceLoading ? (
            <Skeleton className="h-3 w-20" />
          ) : (
            <span className="text-slate-300">
              {formatUnits(balance as bigint, props.decimals)} {props.symbol}
            </span>
          )}
        </div>
      )}

      <TransactionStatus state={tx} />
    </div>
  );
}

function ClaimAllButton(props: {
  pairs: { underlying: Address; symbol: string; decimals: number }[];
}) {
  const { address } = useAccount();
  const { sendCallsAsync } = useSendCalls();
  const { writeContractAsync } = useWriteContract();
  const [tx, setTx] = useState<TxState>({ kind: "idle" });

  const claimSequential = async () => {
    const total = props.pairs.length;
    for (let i = 0; i < total; i++) {
      const p = props.pairs[i];
      setTx({ kind: "pending", label: `Claiming ${i + 1}/${total} ${p.symbol}…` });
      const amount = FAUCET_MINT_AMOUNT * 10n ** BigInt(p.decimals);
      await writeContractAsync({
        address: p.underlying,
        abi: erc20Abi,
        functionName: "mint",
        args: [address!, amount],
      });
    }
  };

  const onClaimAll = async () => {
    if (!address) {
      pushToast("error", "Connect a wallet first");
      return;
    }
    setTx({ kind: "pending", label: "Claiming all tokens…" });
    try {
      const calls = props.pairs.map((p) => ({
        to: p.underlying,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "mint",
          args: [address, FAUCET_MINT_AMOUNT * 10n ** BigInt(p.decimals)],
        }),
      }));
      await sendCallsAsync({ calls });
    } catch {
      try {
        await claimSequential();
      } catch (err) {
        setTx({ kind: "error", message: humanizeError(err) });
        return;
      }
    }
    setTx({
      kind: "success",
      label: `Claimed all ${props.pairs.length} tokens`,
      network: "sepolia",
    });
    pushToast("success", "All tokens claimed successfully");
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Claim all test tokens</p>
          <p className="text-xs text-slate-400">
            Mint 1,000,000 of each token in one go
          </p>
        </div>
        <button
          className="btn-primary shrink-0 text-xs"
          disabled={tx.kind === "pending"}
          onClick={onClaimAll}
        >
          {tx.kind === "pending" ? "Claiming…" : `Claim All (${props.pairs.length})`}
        </button>
      </div>
      <TransactionStatus state={tx} />
    </div>
  );
}

function Header() {
  return (
    <header className="text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Sepolia Faucet</h1>
      <p className="mt-1 text-sm text-slate-400">
        Claim the official cTokenMock test tokens (1,000,000 per call, per token).
        These mint into your connected wallet and are immediately wrap-ready.
      </p>
    </header>
  );
}
