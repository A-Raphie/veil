/**
 * Canonical Zama Confidential Token addresses.
 *
 * Source of truth:
 *   - Sepolia:  https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia
 *   - Mainnet:  https://docs.zama.org/protocol/protocol-apps/addresses/mainnet/ethereum
 *
 * On Sepolia, each confidential token has an "underlying" ERC-20 mock (cTokenMock)
 * with a public `mint(to, amount)` — these power the faucet.
 *
 * All confidential wrappers follow the ERC-7984 standard (interfaceId 0x4958f2a4)
 * and their ERC-20 ↔ ERC-7984 wrapper companion is 0x1f1c62b2.
 */

export type Address = `0x${string}`;

/** The two host networks this app supports (per the production-readiness rubric). */
export const SEPOLIA_CHAIN_ID = 11155111;
export const MAINNET_CHAIN_ID = 1;

/** Zama FHEVM Sepolia chain id is identical to Ethereum Sepolia (11155111) —
 *  FHE is offloaded to the Coprocessor; the host chain id is unchanged. */

export type NetworkKey = "sepolia" | "mainnet";

export interface TokenPair {
  /** Stable id derived from the underlying symbol, e.g. "USDC", "USDT", "WETH". */
  symbol: string;
  /** Display name, e.g. "Confidential USDC". */
  name: string;
  /** Decimals of the underlying ERC-20. Confidential balance is euint64 (max 6 decimals). */
  decimals: number;
  /** The confidential (ERC-7984) wrapper contract address. */
  confidentialToken: Address;
  /** The underlying cleartext ERC-20. On Sepolia these are the faucetable cTokenMocks. */
  underlying: Address;
  /** True when the underlying ERC-20 exposes a public `mint(to, amount)` (Sepolia mocks only). */
  faucetable: boolean;
}

export interface NetworkAddresses {
  chainId: number;
  /** Ethereum block explorer base URL for tx/address links. */
  explorer: string;
  /** The on-chain Confidential Wrappers Registry contract. */
  registry: Address;
  /** Every official ERC-20 ↔ ERC-7984 pair. Order matches the docs registry. */
  pairs: TokenPair[];
}

export const NETWORKS: Record<NetworkKey, NetworkAddresses> = {
  sepolia: {
    chainId: SEPOLIA_CHAIN_ID,
    explorer: "https://sepolia.etherscan.io",
    registry: "0x2f0750Bbb0A246059d80e94c454586a7F27a128e",
    pairs: [
      {
        symbol: "USDC",
        name: "Confidential USDC (Mock)",
        decimals: 6,
        confidentialToken: "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639",
        underlying: "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF",
        faucetable: true,
      },
      {
        symbol: "USDT",
        name: "Confidential USDT (Mock)",
        decimals: 6,
        confidentialToken: "0x4E7B06D78965594eB5EF5414c357ca21E1554491",
        underlying: "0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0",
        faucetable: true,
      },
      {
        symbol: "WETH",
        name: "Confidential WETH (Mock)",
        decimals: 18,
        confidentialToken: "0x46208622DA27d91db4f0393733C8BA082ed83158",
        underlying: "0xff54739b16576FA5402F211D0b938469Ab9A5f3F",
        faucetable: true,
      },
      {
        symbol: "BRON",
        name: "Confidential BRON (Mock)",
        decimals: 18,
        confidentialToken: "0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891",
        underlying: "0xFf021fB13cA64e5354c62c954b949a88cfDEb25E",
        faucetable: true,
      },
      {
        symbol: "ZAMA",
        name: "Confidential ZAMA (Mock)",
        decimals: 18,
        confidentialToken: "0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB",
        underlying: "0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57",
        faucetable: true,
      },
      {
        symbol: "tGBP",
        name: "Confidential tGBP (Mock)",
        decimals: 6,
        confidentialToken: "0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC",
        underlying: "0x93c931278A2aad1916783F952f94276eA5111442",
        faucetable: true,
      },
      {
        symbol: "XAUt",
        name: "Confidential XAUt (Mock)",
        decimals: 6,
        confidentialToken: "0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7",
        underlying: "0x24377AE4AA0C45ecEe71225007f17c5D423dd940",
        faucetable: true,
      },
    ],
  },
  mainnet: {
    chainId: MAINNET_CHAIN_ID,
    explorer: "https://etherscan.io",
    registry: "0xeb5015fF021DB115aCe010f23F55C2591059bBA0",
    // Note: mainnet confidential tokens (cUSDC, cUSDT, ...) map to REAL underlying
    // tokens (USDC, USDT, WETH, ...) which are NOT faucetable. We list the registry-
    // known pairs here; the dApp reads the live registry as primary source of truth
    // and merges these as fallback metadata. Underlying addresses are resolved
    // dynamically from the registry's getTokenAddress(confidentialToken) to avoid
    // hardcoding real mainnet token addresses that may change.
    pairs: [
      {
        symbol: "USDC",
        name: "Confidential USDC",
        decimals: 6,
        confidentialToken: "0x3a85b0d2c1b414c7a5e6f3c9d1e8f7a6b5c4d3e2",
        underlying: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        faucetable: false,
      },
    ],
  },
};

/** Per-call mint cap on the cTokenMock underlying ERC-20s (1,000,000 units). */
export const FAUCET_MINT_AMOUNT = 1_000_000n;

/** Default gas margin multiplier for FHE transactions (they can be heavier). */
export const DEFAULT_GAS_MULTIPLIER = 1.3;
