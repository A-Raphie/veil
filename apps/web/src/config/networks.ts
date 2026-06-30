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

/** Sepolia FheChain with the relayer pointed at our server-side proxy. */
export const sepoliaFheChain = {
  ...sepoliaFhe,
  relayerUrl: "/api/relayer/11155111",
} as const satisfies FheChain;

/** Mainnet FheChain — also proxied (reuse the same route, different chain id). */
export const mainnetFheChain = {
  ...mainnetFhe,
  relayerUrl: "/api/relayer/1",
} as const satisfies FheChain;

export const FHE_CHAINS = [sepoliaFheChain, mainnetFheChain] as const;

/** wagmi config — the host RPC layer. */
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
