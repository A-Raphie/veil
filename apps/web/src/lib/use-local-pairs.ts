"use client";

/**
 * useLocalPairs — manages UI-added ERC-20 ↔ ERC-7984 pairs in localStorage.
 *
 * This is the "admin UI" path for the extensibility requirement. Pairs added
 * here persist across page refreshes (localStorage survives) and merge into the
 * registry grid alongside on-chain and JSON-config pairs (see useRegistryPairs).
 *
 * Validation reuses the same schema as the CLI path
 * (@wrapper-registry/registry-config → parseLocalConfig), so UI-added and
 * CLI-added pairs are structurally identical.
 */

import { useState, useEffect, useCallback } from "react";
import {
  parseLocalConfig,
  normalizeAddress,
  type LocalPair,
  type LocalPairInput,
} from "@wrapper-registry/registry-config";
import { useQueryClient } from "@tanstack/react-query";

const STORAGE_KEY = "veil:local-pairs";

function readStorage(): LocalPair[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return parseLocalConfig(raw);
  } catch {
    return [];
  }
}

function writeStorage(pairs: LocalPairInput[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ pairs }));
  // Notify other tabs/components.
  window.dispatchEvent(new Event("veil:local-pairs-changed"));
}

export function useLocalPairs() {
  const [pairs, setPairs] = useState<LocalPair[]>([]);
  const queryClient = useQueryClient();

  // Read on mount + whenever the storage event fires.
  useEffect(() => {
    setPairs(readStorage());
    const onChanged = () => setPairs(readStorage());
    window.addEventListener("veil:local-pairs-changed", onChanged);
    window.addEventListener("storage", onChanged);
    return () => {
      window.removeEventListener("veil:local-pairs-changed", onChanged);
      window.removeEventListener("storage", onChanged);
    };
  }, []);

  const addPair = useCallback(
    (input: LocalPairInput): { ok: true } | { ok: false; error: string } => {
      const existing = readStorage();
      const merged: LocalPairInput[] = [...existing, input];
      try {
        // parseLocalConfig validates addresses, decimals, duplicates.
        const validated = parseLocalConfig(JSON.stringify({ pairs: merged }));
        writeStorage(validated);
        // Invalidate the registry query so the grid refreshes immediately.
        queryClient.invalidateQueries({ queryKey: ["registry-pairs"] });
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Invalid pair" };
      }
    },
    [queryClient],
  );

  const removePair = useCallback(
    (confidentialToken: string) => {
      const existing = readStorage();
      const filtered = existing.filter(
        (p) => normalizeAddress(p.confidentialToken) !== normalizeAddress(confidentialToken),
      );
      writeStorage(filtered);
      setPairs(filtered);
      queryClient.invalidateQueries({ queryKey: ["registry-pairs"] });
    },
    [queryClient],
  );

  return { pairs, addPair, removePair };
}
