# Veil

> **Encrypted by default. Yours to reveal.**
>
> Veil is a production-ready dApp that turns Zama's on-chain **Confidential Wrappers
> Registry** into a usable product: browse every official ERC-20 ↔ ERC-7984 wrapper
> pair, claim official test tokens from the faucet, wrap/unwrap, and decrypt any
> ERC-7984 balance.

Built on **Zama FHEVM** with the `@zama-fhe/sdk` v3 React SDK. Supports **Sepolia**
(the judging network) and **Ethereum mainnet**.

---

## Live demo

- **App:** https://veil-registry.vercel.app
- **Video pitch:** _<add your X/YouTube/Loom link — to be added>_
- **Networks:** Sepolia (chain 11155111) and Ethereum mainnet (chain 1)

> The bounty rules forbid "Zama" in the project name — Veil complies.

---

## Features

| Feature | Route | What it does |
|---|---|---|
| **Registry browser** | `/` | Reads the live on-chain Wrappers Registry and renders every ERC-20 ↔ ERC-7984 pair with full metadata + addresses. Merges any local dev pairs. |
| **Sepolia faucet** | `/faucet` | Mints the 8 official `cTokenMock` underlying tokens (1,000,000 units/call) with per-token balance + tx status. |
| **Wrap & unwrap** | `/wrap` | Wraps ERC-20 → ERC-7984 (auto-approves) and unwraps back — the SDK orchestrates the on-chain two-step (request → public decrypt → finalize) in one click. Live balance panels for both sides. |
| **Decrypt any balance** | `/decrypt` | Decrypts the connected wallet's balance for **any** ERC-7984 token via a one-time EIP-712 permit. Paste-an-address or pick from the registry; input is syntactically validated. |

Every transaction surfaces pending → success (with explorer link) → error states inline, plus a toast system.

---

## How the registry is sourced (hybrid model)

Per the bounty spec, the registry is sourced as a **hybrid**:

1. **Primary — on-chain registry.** The app reads `getTokenConfidentialTokenPairs()`
   from the live
   [Confidential Wrappers Registry](https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry).
   New pairs registered by the Protocol DAO appear automatically — no redeploy.
2. **Secondary — local config.** Custom/dev-only pairs (e.g. a wrapper you deployed)
   live in `packages/registry-config/pairs.local.json`. On collision, the on-chain
   registry wins.

---

## Adding a new ERC-20 ↔ ERC-7984 pair

The on-chain registry is read-only for non-DAO accounts. To surface a pair **you**
control, use the included CLI:

```bash
pnpm add-pair
# or non-interactive:
pnpm add-pair \
  --symbol MYTKN \
  --confidential 0xYOUR_ERC7984 \
  --underlying 0xYOUR_ERC20 \
  --name "My Confidential Token" \
  --decimals 6 \
  --faucetable
```

This writes a validated entry to `pairs.local.json`. Run `pnpm dev` and the pair
appears in the registry browser with a `local` badge; wrap/unwrap/decrypt work
against it exactly like any official pair. See `pnpm add-pair --help` for all flags.

The config is validated at startup (`validateLocalConfig`): bad addresses, duplicate
wrappers, and out-of-range decimals throw `LocalConfigError` with the offending
entry index, so misconfigurations fail loudly.

> Manual alternative: copy `pairs.local.example.json` → `pairs.local.json` and edit
> by hand. Both paths are equivalent; the CLI just removes the toil.

---

## Tech stack

- **Next.js 15** (App Router) + React 18 + TypeScript (strict)
- **wagmi v3** + **viem v2** for wallet + EVM
- **@zama-fhe/sdk** + **@zama-fhe/react-sdk** v3.2.0 (shield/unshield, EIP-712 permit decryption)
- **Tailwind CSS** with a custom design-token system
- **pnpm** workspace monorepo

### Monorepo layout

```
veil/
├── apps/web/                     # Next.js dApp
│   ├── src/app/                  # routes: /, /faucet, /wrap, /decrypt, /api/relayer/[chainId]
│   ├── src/components/           # hero, nav, wallet, tx-status, alert, skeleton, toast
│   ├── src/lib/                  # registry reader, format, errors, address validation
│   ├── src/config/networks.ts    # wagmi + Zama SDK config (client-only)
│   ├── public/                   # favicon.svg, og-image.png
│   └── next.config.mjs           # COOP/COEP headers (required for FHE WASM)
├── packages/contracts/           # ABIs + canonical Sepolia/mainnet addresses
└── packages/registry-config/     # typed local-config schema + validation + add-pair CLI
```

---

## Configuration

### 1. Relayer API key (MAINNET ONLY — not needed for Sepolia)

The **Sepolia testnet relayer is open** (`https://relayer.testnet.zama.org/v2`, no
key required, verified empirically), so the entire bounty-judging flow works with
**zero configuration**. Veil points the SDK straight at the public Sepolia host.

Only **mainnet** decryption requires a key (the mainnet relayer gates every request
behind `x-api-key`). Veil routes mainnet through a server-side proxy
(`/api/relayer/1`) so the key stays off the client:

- Request a key from Zama ([reviewed form](https://forms.gle/jq84zEek1oiv3kBz9)).
- Copy `.env.example` → `.env.local` in `apps/web/` and set `RELAYER_API_KEY`.
- (Optional) Set `NEXT_PUBLIC_SITE_URL` to your deployed URL for correct OG metadata.

### 2. Cross-origin isolation (already configured)

FHE WASM runs in a Web Worker and needs `SharedArrayBuffer`, which requires COOP/COEP
headers — set in `next.config.mjs`. If a third-party wallet iframe ever breaks,
switch the embedder policy to `credentialless` as a fallback.

---

## Local development

**Prerequisites:** Node ≥ 22, pnpm ≥ 10.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts:

```bash
pnpm build        # production build
pnpm start        # serve the production build
pnpm typecheck    # tsc --noEmit across all packages
pnpm add-pair     # add a custom ERC-20 ↔ ERC-7984 pair (see above)
```

---

## Deployment (Vercel)

1. Push the repo to GitHub.
2. Import into Vercel — the `veil-web` workspace is auto-detected.
3. Set `NEXT_PUBLIC_SITE_URL` to your deployed URL (for OG metadata).
4. (Mainnet only) Set `RELAYER_API_KEY`.
5. Deploy. COOP/COEP headers apply automatically via `next.config.mjs`.

---

## Supported networks

| Network | Chain ID | Registry | Faucet |
|---|---|---|---|
| **Sepolia** | 11155111 | `0x2f0750Bbb0A246059d80e94c454586a7F27a128e` | ✅ 8 cTokenMocks |
| **Ethereum mainnet** | 1 | `0xeb5015fF021DB115aCe010f23F55C2591059bBA0` | — |

Canonical addresses live in `packages/contracts/src/addresses.ts`.

---

## Acknowledgements

- [Zama FHEVM](https://github.com/zama-ai) — fully homomorphic encryption for EVM.
- [@zama-fhe/sdk](https://docs.zama.org/protocol/sdk) v3 for the React hooks.
