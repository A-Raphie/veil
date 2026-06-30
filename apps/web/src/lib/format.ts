/**
 * Display helpers for addresses, bigints, and chain state.
 */

import type { Address } from "viem";
import { NETWORKS, type NetworkKey } from "@wrapper-registry/contracts";

/** Shorten 0x1234…abcd for compact UI display. */
export function shortAddr(addr: Address | string, head = 6, tail = 4): string {
  const s = String(addr);
  if (s.length <= head + tail + 2) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

/** Format a raw bigint amount with the token's decimals. */
export function formatUnits(value: bigint, decimals: number, maxFrac = 4): string {
  if (decimals === 0) return value.toString();
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  let fracStr = frac.toString().padStart(decimals, "0");
  if (maxFrac < decimals) {
    fracStr = fracStr.slice(0, maxFrac);
  }
  fracStr = fracStr.replace(/0+$/, "");
  const out = fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
  return negative ? `-${out}` : out;
}

/** Parse a human amount string into a bigint at the given decimals. */
export function parseUnits(input: string, decimals: number): bigint {
  const cleaned = input.trim();
  if (!cleaned) return 0n;
  if (!/^\d*\.?\d*$/.test(cleaned)) throw new Error("Invalid number");
  const [whole, frac = ""] = cleaned.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(fracPadded || "0");
}

export function explorerTxUrl(network: NetworkKey, txHash: string): string {
  return `${NETWORKS[network].explorer}/tx/${txHash}`;
}

export function explorerAddressUrl(network: NetworkKey, address: string): string {
  return `${NETWORKS[network].explorer}/address/${address}`;
}
