import type { Address } from "viem";

/**
 * Confidential Wrappers Registry — read-only surface we use in the browser.
 * Source: docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry
 *
 * registerConfidentialToken / revokeConfidentialToken are owner-gated to the
 * Protocol DAO, so we deliberately omit them — the dApp treats the registry
 * as read-only and adds custom/dev pairs via local config instead.
 */
export const registryAbi = [
  {
    type: "function",
    name: "getConfidentialTokenAddress",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [
      { name: "isValid", type: "bool" },
      { name: "confidentialToken", type: "address" },
    ],
  },
  {
    type: "function",
    name: "getTokenAddress",
    stateMutability: "view",
    inputs: [{ name: "confidentialWrapper", type: "address" }],
    outputs: [
      { name: "isValid", type: "bool" },
      { name: "token", type: "address" },
    ],
  },
  {
    type: "function",
    name: "isConfidentialTokenValid",
    stateMutability: "view",
    inputs: [{ name: "wrapper", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "getTokenConfidentialTokenPairs",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "pairs",
        type: "tuple[]",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "confidentialTokenAddress", type: "address" },
          { name: "isValid", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getTokenConfidentialTokenPairsLength",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getTokenConfidentialTokenPair",
    stateMutability: "view",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [
      {
        name: "pair",
        type: "tuple",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "confidentialTokenAddress", type: "address" },
          { name: "isValid", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getTokenConfidentialTokenPairsSlice",
    stateMutability: "view",
    inputs: [
      { name: "from", type: "uint256" },
      { name: "to", type: "uint256" },
    ],
    outputs: [
      {
        name: "pairs",
        type: "tuple[]",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "confidentialTokenAddress", type: "address" },
          { name: "isValid", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getTokenIndex",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "ConfidentialTokenRegistered",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "confidentialToken", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "ConfidentialTokenRevoked",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "confidentialToken", type: "address", indexed: true },
    ],
  },
] as const;

export type RegistryPair = {
  tokenAddress: Address;
  confidentialTokenAddress: Address;
  isValid: boolean;
};
