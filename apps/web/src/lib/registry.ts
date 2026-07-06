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
import { useMemo, useState, useEffect } from "react";
// Build-time import of the local pairs config. This file is written by
// `pnpm add-pair` (packages/registry-config/scripts/add-pair.cjs) and is the
// "custom/dev-only pairs" half of the hybrid registry model. It starts empty
// ({ pairs: [] }) and grows as users add their own ERC-20 ↔ ERC-7984 pairs.
// The export is declared in apps/web/src/types/local-config.d.ts.
import localConfigRaw from "@wrapper-registry/registry-config/local";
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

/**
 * UI-added pairs persisted in localStorage (the "admin UI" extensibility path).
 * Read inside a component (client-only); returns [] during SSR.
 */
function useUiPairs(): LocalPair[] {
  const [pairs, setPairs] = useState<LocalPair[]>([]);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("veil:local-pairs");
      if (!raw) return;
      setPairs(parseLocalConfig(raw));
    } catch {
      /* malformed storage — ignore */
    }
    const onChanged = () => {
      try {
        const raw = window.localStorage.getItem("veil:local-pairs");
        setPairs(raw ? parseLocalConfig(raw) : []);
      } catch {
        setPairs([]);
      }
    };
    window.addEventListener("veil:local-pairs-changed", onChanged);
    window.addEventListener("storage", onChanged);
    return () => {
      window.removeEventListener("veil:local-pairs-changed", onChanged);
      window.removeEventListener("storage", onChanged);
    };
  }, []);
  return pairs;
}

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
  const uiPairs = useUiPairs();

  // Include uiPairs in the queryKey so React Query refires when localStorage
  // pairs change — without this, the query captures a stale uiPairs closure
  // and newly-added pairs don't appear until a manual refetch.
  return useQuery<UnifiedPair[]>({
    queryKey: ["registry-pairs", network, uiPairs],
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
              name: meta?.name ?? "Unregistered pair",
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
          // so the app still renders. Logged only in dev to avoid console noise.
          if (process.env.NODE_ENV !== "production") {
            console.warn("[registry] on-chain read failed, using static fallback", err);
          }
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

      // --- 2. Local JSON-config overrides (secondary) ---
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

      // --- 3. UI-added pairs from localStorage (tertiary, admin UI path) ---
      for (const lp of uiPairs) {
        const key = normalizeAddress(lp.confidentialToken);
        if (seen.has(key)) continue; // higher layers win on collision
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
