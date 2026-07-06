"use client";

/**
 * Faucet — mint the official cTokenMock underlying ERC-20s on Sepolia.
 *
 * Each cTokenMock exposes a public `mint(to, amount)` capped at 1,000,000 units
 * per call. On mainnet there's nothing to mint, so the page is Sepolia-only.
 */

import { useState } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
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
import { Coins, Wallet } from "lucide-react";
import Link from "next/link";

export default function FaucetPage() {
  const { network, isConnected, isSupported } = useActiveNetwork();
  const allPairs = NETWORKS[network].pairs;
  const faucetable = allPairs.filter((p) => p.faucetable);

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-[45px]">
      <Header />

      <WrongNetworkBanner />

      {!isConnected && (
        <div className="card flex items-center gap-3 text-sm text-slate-300">
          <Wallet className="h-4 w-4 text-brand-400" />
          Connect a wallet on Sepolia to claim official cTokenMocks.
        </div>
      )}

      {isConnected && isSupported && faucetable.length > 0 && (
        <ClaimAllButton pairs={faucetable} />
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allPairs.map((p) => (
          <FaucetRow
            key={p.underlying}
            symbol={p.symbol}
            name={p.name}
            decimals={p.decimals}
            token={p.underlying}
            faucetable={p.faucetable}
            disabled={!isConnected || !isSupported || !p.faucetable}
          />
        ))}
      </section>

      <div className="card text-center text-xs text-slate-400">
        Wrap them into confidential tokens on the{" "}
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
  faucetable: boolean;
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
    <div className={["card space-y-3", !props.faucetable && "opacity-40"].join(" ")}>
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
        {props.faucetable ? (
          <button
            className="btn-primary shrink-0 text-xs"
            disabled={props.disabled || isPending}
            onClick={onMint}
          >
            {isPending && tx.kind === "pending" ? "Minting…" : "Claim 1,000,000"}
          </button>
        ) : (
          <span className="badge bg-slate-500/15 text-slate-400 shrink-0 text-xs">
            restricted
          </span>
        )}
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
  const { writeContractAsync } = useWriteContract();
  const [tx, setTx] = useState<TxState>({ kind: "idle" });

  const onClaimAll = async () => {
    if (!address) {
      pushToast("error", "Connect a wallet first");
      return;
    }
    // Claim each token sequentially, awaiting each receipt. This is slower than
    // an EIP-5792 bundle but always correct — writeContractAsync resolves only
    // once the tx is mined, so the success state fires after every mint lands.
    const total = props.pairs.length;
    try {
      for (let i = 0; i < total; i++) {
        const p = props.pairs[i];
        if (!p) continue;
        setTx({ kind: "pending", label: `Claiming ${i + 1}/${total} (${p.symbol})…` });
        const amount = FAUCET_MINT_AMOUNT * 10n ** BigInt(p.decimals);
        await writeContractAsync({
          address: p.underlying,
          abi: erc20Abi,
          functionName: "mint",
          args: [address, amount],
        });
      }
      setTx({
        kind: "success",
        label: `Claimed all ${total} tokens`,
        network: "sepolia",
      });
      pushToast("success", "All tokens claimed successfully");
    } catch (err) {
      setTx({ kind: "error", message: humanizeError(err) });
    }
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
        Mint test tokens to wrap into confidential ERC-7984 equivalents.
      </p>
    </header>
  );
}
