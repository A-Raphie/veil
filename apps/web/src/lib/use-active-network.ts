"use client";

/**
 * Resolve the active network key from the connected wallet chain.
 * Falls back to "sepolia" when no wallet is connected (the judging network).
 */

import { useAccount, useChainId } from "wagmi";
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID, type NetworkKey } from "@wrapper-registry/contracts";
import { useMemo } from "react";

export interface ActiveNetwork {
  network: NetworkKey;
  chainId: number;
  /** True when the connected wallet is on a chain this app supports. */
  isSupported: boolean;
  /** True when the wallet is connected. */
  isConnected: boolean;
}

export function useActiveNetwork(): ActiveNetwork {
  const chainId = useChainId();
  const { isConnected } = useAccount();

  return useMemo<ActiveNetwork>(() => {
    const network: NetworkKey = chainId === MAINNET_CHAIN_ID ? "mainnet" : "sepolia";
    const isSupported =
      chainId === SEPOLIA_CHAIN_ID || chainId === MAINNET_CHAIN_ID;
    return { network, chainId, isSupported, isConnected };
  }, [chainId, isConnected]);
}
