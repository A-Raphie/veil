"use client";

/**
 * Resolve the active network key from the connected wallet chain.
 * Supports Sepolia and Ethereum mainnet. Falls back to "sepolia" when no wallet
 * is connected or the wallet is on an unsupported chain.
 */

import { useAccount, useChainId } from "wagmi";
import { SEPOLIA_CHAIN_ID, MAINNET_CHAIN_ID, type NetworkKey } from "@wrapper-registry/contracts";
import { useMemo } from "react";

/** Chain ID → NetworkKey lookup. */
const CHAIN_TO_NETWORK: Record<number, NetworkKey> = {
  [SEPOLIA_CHAIN_ID]: "sepolia",
  [MAINNET_CHAIN_ID]: "mainnet",
};

export interface ActiveNetwork {
  network: NetworkKey;
  chainId: number;
  /** True when the connected wallet is on a supported chain (Sepolia or mainnet). */
  isSupported: boolean;
  /** True when the wallet is connected. */
  isConnected: boolean;
}

export function useActiveNetwork(): ActiveNetwork {
  const chainId = useChainId();
  const { isConnected } = useAccount();

  return useMemo<ActiveNetwork>(() => {
    const network: NetworkKey = CHAIN_TO_NETWORK[chainId] ?? "sepolia";
    const isSupported = chainId === SEPOLIA_CHAIN_ID || chainId === MAINNET_CHAIN_ID;
    return { network, chainId, isSupported, isConnected };
  }, [chainId, isConnected]);
}
