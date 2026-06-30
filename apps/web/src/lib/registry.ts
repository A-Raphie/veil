"use client";

/**
 * Hybrid registry sourcing (required by the bounty):
 *   1. On-chain Wrappers Registry = PRIMARY source of truth
 *   2. Local config (pairs.local.json) = custom/dev-only overrides
 *
 * This hook reads the live on-chain registry for the active network and merges
 * in any local pairs, marking each with its source. Local pairs that collide
 * with a registry confidentialToken address are skipped (registry wins).
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
// Build-time import of the optional local pairs config. Exported from the
// registry-config package (see its package.json "./example"). To customize,
// copy pairs.local.example.json → packages/registry-config/pairs.local.json
// and point this import at "./local".
import localConfigRaw from "@wrapper-registry/registry-config/example";
import {
  NETWORKS,
  registryAbi,
  type Address,
  type NetworkKey,
  type RegistryPair,
} from "@wrapper-registry/contracts";
import {
  normalizeAddress,
  parseLocalConfig,
  type LocalPair,
} from "@wrapper-registry/registry-config";
import { usePublicClient } from "wagmi";

/** A normalized pair used across the UI, tagged with its origin. */
export interface UnifiedPair {
  symbol: string;
  name: string;
  decimals: number;
  confidentialToken: Address;
  underlying: Address;
  faucetable: boolean;
  source: "registry" | "local";
  isValid: boolean;
}

/**
 * Locally-configured pairs for a network (parsed + validated once).
 *
 * The local config is the "dev-only / custom pairs" half of the hybrid registry
 * model. Edit `pairs.local.json` (see pairs.local.example.json) to add your own
 * ERC-20 ↔ ERC-7984 pairs. The import is resolved at build time by the bundler;
 * a type declaration in src/types/local-config.d.ts types the JSON module.
 */
function loadLocalPairs(): LocalPair[] {
  try {
    const raw = localConfigRaw;
    return parseLocalConfig(JSON.stringify(raw));
  } catch {
    return [];
  }
}

/** Static fallback metadata keyed by confidentialToken address (lowercased). */
const FALLBACK_META = new Map<string, { symbol: string; name: string; decimals: number }>();

function buildFallback(network: NetworkKey): Map<string, { symbol: string; name: string; decimals: number; faucetable: boolean }> {
  const map = new Map<string, { symbol: string; name: string; decimals: number; faucetable: boolean }>();
  for (const p of NETWORKS[network].pairs) {
    map.set(normalizeAddress(p.confidentialToken), {
      symbol: p.symbol,
      name: p.name,
      decimals: p.decimals,
      faucetable: p.faucetable,
    });
  }
  return map;
}

/**
 * Read all pairs from the on-chain registry for the active network.
 */
export function useRegistryPairs(network: NetworkKey) {
  const client = usePublicClient({ chainId: NETWORKS[network].chainId });
  const fallback = useMemo(() => buildFallback(network), [network]);
  const localPairs = useMemo(() => loadLocalPairs(), []);

  return useQuery<UnifiedPair[]>({
    queryKey: ["registry-pairs", network],
    queryFn: async () => {
      const registry = NETWORKS[network].registry;
      const out: UnifiedPair[] = [];

      // --- 1. On-chain registry (primary) ---
      if (client) {
        try {
          const pairs = (await client.readContract({
            address: registry,
            abi: registryAbi,
            functionName: "getTokenConfidentialTokenPairs",
            args: [],
          })) as RegistryPair[];

          for (const p of pairs) {
            const key = normalizeAddress(p.confidentialTokenAddress);
            const meta = fallback.get(key);
            out.push({
              symbol: meta?.symbol ?? "UNKNOWN",
              name: meta?.name ?? "Confidential Token",
              decimals: meta?.decimals ?? 6,
              confidentialToken: p.confidentialTokenAddress,
              underlying: p.tokenAddress,
              faucetable: meta?.faucetable ?? false,
              source: "registry",
              isValid: p.isValid,
            });
          }
        } catch (err) {
          // If the on-chain read fails (RPC down), fall through to static list
          // so the app still renders. Logged for the operator.
          console.warn("[registry] on-chain read failed, using static fallback", err);
          for (const p of NETWORKS[network].pairs) {
            out.push({
              ...p,
              confidentialToken: p.confidentialToken,
              source: "registry",
              isValid: true,
            });
          }
        }
      } else {
        // No client (SSR / pre-connect) — static fallback.
        for (const p of NETWORKS[network].pairs) {
          out.push({
            ...p,
            confidentialToken: p.confidentialToken,
            source: "registry",
            isValid: true,
          });
        }
      }

      // --- 2. Local overrides (secondary) ---
      const seen = new Set(out.map((p) => normalizeAddress(p.confidentialToken)));
      for (const lp of localPairs) {
        const key = normalizeAddress(lp.confidentialToken);
        if (seen.has(key)) continue; // registry wins on collision
        out.push({
          symbol: lp.symbol,
          name: lp.name,
          decimals: lp.decimals,
          confidentialToken: lp.confidentialToken,
          underlying: lp.underlying,
          faucetable: lp.faucetable,
          source: "local",
          isValid: true,
        });
        seen.add(key);
      }

      return out;
    },
    staleTime: 60_000,
  });
}
