import type { Address } from "viem";

/**
 * ERC-7984 Confidential Token Wrapper (ConfidentialWrapper.sol =
 * ERC7984ERC20WrapperUpgradeable). We use this ABI for raw metadata reads
 * (rate, decimals, underlying) and as a fallback if the react-sdk's shield/
 * unshield hooks ever need to be bypassed. The react-sdk's `useShield` /
 * `useUnshield` are the primary path and handle wrap/unwrap internally.
 *
 * Source: docs.zama.org/protocol/protocol-apps/confidential-tokens/confidential-wrapper
 */
export const wrapperAbi = [
  // ---- ERC-20 metadata (inherited, also on the wrapper itself) ----
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  // ---- Wrapper specifics ----
  {
    type: "function",
    name: "rate",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "underlying",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "wrap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "unwrap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "encryptedAmount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "finalizeUnwrap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "unwrapRequestId", type: "uint256" },
      { name: "unwrapAmountCleartext", type: "uint256" },
      { name: "decryptionProof", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "inferredTotalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "confidentialTotalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "maxTotalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  // ---- Events ----
  {
    type: "event",
    name: "Wrap",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "roundedAmount", type: "uint256", indexed: false },
      { name: "encryptedWrappedAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "UnwrapRequested",
    inputs: [
      { name: "receiver", type: "address", indexed: true },
      { name: "unwrapRequestId", type: "uint256", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

export type WrapEventArgs = {
  to: Address;
  roundedAmount: bigint;
  encryptedWrappedAmount: bigint;
};
