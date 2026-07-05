"use client";

/**
 * Resolve the active network key from the connected wallet chain.
 * Sepolia-only app — falls back to "sepolia" when no wallet is connected.
 */

import { useAccount, useChainId } from "wagmi";
import { SEPOLIA_CHAIN_ID, type NetworkKey } from "@wrapper-registry/contracts";
import { useMemo } from "react";

export interface ActiveNetwork {
  network: NetworkKey;
  chainId: number;
  /** True when the connected wallet is on Sepolia. */
  isSupported: boolean;
  /** True when the wallet is connected. */
  isConnected: boolean;
}

export function useActiveNetwork(): ActiveNetwork {
  const chainId = useChainId();
  const { isConnected } = useAccount();

  return useMemo<ActiveNetwork>(() => {
    const network: NetworkKey = "sepolia";
    const isSupported = chainId === SEPOLIA_CHAIN_ID;
    return { network, chainId, isSupported, isConnected };
  }, [chainId, isConnected]);
}
