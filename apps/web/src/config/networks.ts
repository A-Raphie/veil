"use client";

/**
 * Network + SDK configuration.
 *
 * IMPORTANT (SDK v3): do NOT construct the Zama config at module top-level —
 * it touches browser-only APIs (Web Worker, IndexedDB, WASM) and will crash
 * during SSR ("window is not defined"). Everything here is exported as factory
 * functions / constants and only assembled inside the client Providers.
 *
 * See docs.zama.org/protocol/sdk/guides/nextjs-ssr.md
 */

import { http, createConfig } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { createConfig as createZamaConfig } from "@zama-fhe/react-sdk/wagmi";
import { web } from "@zama-fhe/sdk/web";
import {
  sepolia as sepoliaFhe,
  mainnet as mainnetFhe,
  type FheChain,
} from "@zama-fhe/sdk/chains";

export const SUPPORTED_CHAINS = [sepolia, mainnet] as const;

/**
 * Sepolia FheChain — the testnet relayer is OPEN (no x-api-key required; the
 * bounty is judged here). Point the SDK straight at the public host. Verified
 * empirically: https://relayer.testnet.zama.org/v2 returns 200/400 without a key.
 */
export const sepoliaFheChain = {
  ...sepoliaFhe,
  relayerUrl: "https://relayer.testnet.zama.org/v2",
} as const satisfies FheChain;

/**
 * Mainnet FheChain — the relayer requires an x-api-key. Route through our
 * server-side proxy (api/relayer/[chainId]/route.ts) which injects the key.
 */
export const mainnetFheChain = {
  ...mainnetFhe,
  relayerUrl: "/api/relayer/1",
} as const satisfies FheChain;

export const FHE_CHAINS = [sepoliaFheChain, mainnetFheChain] as const;

/** wagmi config — the host RPC layer.
 *  multiInjectedProviderDiscovery auto-wires injected wallets (MetaMask etc.)
 *  without needing an explicit connectors import (which pulls a heavy package).
 */
export function buildWagmiConfig() {
  return createConfig({
    chains: SUPPORTED_CHAINS,
    multiInjectedProviderDiscovery: true,
    transports: {
      [sepolia.id]: http(),
      [mainnet.id]: http(),
    },
  });
}

/**
 * Zama SDK config — assembled in the client Providers component.
 * Pass the already-built wagmiConfig.
 */
export function buildZamaConfig(wagmiConfig: ReturnType<typeof buildWagmiConfig>) {
  return createZamaConfig({
    chains: FHE_CHAINS,
    wagmiConfig,
    relayers: {
      [sepoliaFheChain.id]: web(),
      [mainnetFheChain.id]: web(),
    },
  });
}

export type WagmiConfig = ReturnType<typeof buildWagmiConfig>;
export type ZamaConfig = ReturnType<typeof buildZamaConfig>;
