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
      {
        symbol: "tGBP",
        name: "Confidential tGBP",
        decimals: 18,
        confidentialToken: "0x167DC962808B32CFFFc7e14B5018c0bE06A3A208",
        underlying: "0xf6Ef9ADB61A48E29E36bc873070A46A3D2667ff3",
        faucetable: false,
      },
      {
        symbol: "steakcUSDC",
        name: "Confidential steakcUSDC (Mock)",
        decimals: 6,
        confidentialToken: "0x13F7d34A4f0102734F19E3Ff16e068Fe194B28c4",
        underlying: "0x6AB54988261AEC573a2CA13cF802d3B1114f864C",
        faucetable: false,
      },
    ],
  },
  mainnet: {
    chainId: MAINNET_CHAIN_ID,
    explorer: "https://etherscan.io",
    registry: "0xeb5015fF021DB115aCe010f23F55C2591059bBA0",
    // All 9 official mainnet pairs, addresses verified against
    // docs.zama.org/protocol/protocol-apps/addresses/mainnet/ethereum
    // Decimals are NOT published by the docs; standard known values used.
    pairs: [
      {
        symbol: "USDC",
        name: "Confidential USDC",
        decimals: 6,
        confidentialToken: "0xe978F22157048E5DB8E5d07971376e86671672B2",
        underlying: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        faucetable: false,
      },
      {
        symbol: "USDT",
        name: "Confidential USDT",
        decimals: 6,
        confidentialToken: "0xAe0207C757Aa2B4019Ad96edD0092ddc63EF0c50",
        underlying: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        faucetable: false,
      },
      {
        symbol: "WETH",
        name: "Confidential WETH",
        decimals: 18,
        confidentialToken: "0xda9396b82634Ea99243cE51258B6A5Ae512D4893",
        underlying: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        faucetable: false,
      },
      {
        symbol: "BRON",
        name: "Confidential BRON",
        decimals: 18,
        confidentialToken: "0x85dE671c3bec1aDeD752c3Cea943521181C826bc",
        underlying: "0xBA2C598E11eD093079cC324FCa5BbbA99F616E83",
        faucetable: false,
      },
      {
        symbol: "ZAMA",
        name: "Confidential ZAMA",
        decimals: 18,
        confidentialToken: "0x80CB147Fd86dC6dEe3Eee7e4Cee33d1397d98071",
        underlying: "0xA12CC123ba206d4031D1c7f6223D1C2Ec249f4f3",
        faucetable: false,
      },
      {
        symbol: "tGBP",
        name: "Confidential tGBP",
        decimals: 18,
        confidentialToken: "0xa873750ccBafD5ec7Dd13bfD5237d7129832eDD9",
        underlying: "0x27f6c8289550fce67f6b50bed1f519966afe5287",
        faucetable: false,
      },
      {
        symbol: "XAUt",
        name: "Confidential XAUt",
        decimals: 18,
        confidentialToken: "0x73cc9aF9d6BEFdb3c3fAf8a5E8c05Cb95FdaEEf1",
        underlying: "0x68749665FF8D2d112Fa859AA293F07A622782F38",
        faucetable: false,
      },
      {
        symbol: "bbqTGBP",
        name: "Confidential bbqTGBP",
        decimals: 18,
        confidentialToken: "0xBA4cFF6ED6F7Cb2A58776dECa4E984b498446762",
        underlying: "0xbeeffABcd0dB09589Dd21854aa760C52aB4bf04F",
        faucetable: false,
      },
      {
        symbol: "steakcUSDC",
        name: "Confidential steakcUSDC",
        decimals: 6,
        confidentialToken: "0x66Bf74E96900D1a19c7070D939D124f2F565C458",
        underlying: "0xbEEF00A59B577423653A1526c7009bdE103F542B",
        faucetable: false,
      },
    ],
  },
};

/** Per-call mint cap on the cTokenMock underlying ERC-20s (1,000,000 units). */
export const FAUCET_MINT_AMOUNT = 1_000_000n;

/** Default gas margin multiplier for FHE transactions (they can be heavier). */
export const DEFAULT_GAS_MULTIPLIER = 1.3;
