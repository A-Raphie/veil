/**
 * Address validation + ERC-7984 detection helpers.
 *
 * Used to give the /decrypt page graceful errors for invalid or non-ERC-7984
 * addresses instead of silent failed contract reads (rubric: "sensible error
 * handling for unsupported tokens").
 */

import { isAddress, getAddress } from "viem";

export type AddressCheck =
  | { ok: true; address: `0x${string}` }
  | { ok: false; reason: "empty" | "malformed" | "too-short" | "too-long" };

/** Validate a pasted address string. Does NOT check on-chain — just format. */
export function checkAddress(raw: string): AddressCheck {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "empty" };
  if (trimmed.length < 42) return { ok: false, reason: "too-short" };
  if (trimmed.length > 42) return { ok: false, reason: "too-long" };
  if (!isAddress(trimmed)) {
    return { ok: false, reason: "malformed" };
  }
  return { ok: true, address: getAddress(trimmed) };
}

export function addressErrorReason(reason: Exclude<AddressCheck, { ok: true }>["reason"]): string {
  switch (reason) {
    case "empty":
      return "Enter a token address.";
    case "too-short":
      return "Address is too short — an Ethereum address is 42 characters (0x + 40 hex).";
    case "too-long":
      return "Address is too long.";
    case "malformed":
      return "That doesn't look like a valid Ethereum address.";
  }
}
