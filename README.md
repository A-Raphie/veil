# Confidential Wrapper Registry

A production-ready dApp that turns Zama's on-chain **Confidential Wrappers Registry**
into a usable product: browse every official ERC-20 ↔ ERC-7984 wrapper pair, claim
official test tokens from the faucet, wrap/unwrap, and decrypt any ERC-7984 balance.

Built on **Zama FHEVM** using the `@zama-fhe/sdk` v3 React SDK. Supports
**Sepolia** (the judging network) and **Ethereum mainnet**.

---

## Live demo

- **App:** _<add your deployed URL here, e.g. https://wrapper-registry.vercel.app>_
- **Video pitch:** _<add your X/YouTube/Loom link here>_
- **Networks:** Sepolia (chain 11155111) and Ethereum mainnet (chain 1)

> The bounty requires the project name **not** contain "Zama" — it doesn't.

---

## Features

| Feature | What it does |
|---|---|
| **Registry browser** (`/`) | Reads the live on-chain Wrappers Registry and renders every ERC-20 ↔ ERC-7984 pair with symbol, name, decimals, and both contract addresses. Merges any local dev pairs. |
| **Sepolia faucet** (`/faucet`) | Mints the 7 official `cTokenMock` underlying tokens (1,000,000 units/call) directly into your wallet. |
| **Wrap & unwrap** (`/wrap`) | Wraps underlying ERC-20 → confidential ERC-7984 (auto-approves) and unwraps back — the SDK orchestrates the on-chain two-step (request → public decrypt → finalize) in one click. |
| **Decrypt any balance** (`/decrypt`) | Decrypts the connected wallet's balance for **any** ERC-7984 token — registry or not — via a one-time EIP-712 "permit" signature (paste-an-address or pick from the registry). |

---

## How the registry is sourced (hybrid model)

Per the bounty spec, the registry is sourced as a **hybrid**:

1. **Primary — on-chain registry.** The app reads
   `getTokenConfidentialTokenPairs()` from the live
   [Confidential Wrappers Registry](https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry)
   contract. This is the source of truth — new pairs registered by the Protocol DAO
   appear automatically with no app redeploy.
2. **Secondary — local config.** Custom/dev-only pairs (e.g. a wrapper you deployed
   yourself) can be declared in `packages/registry-config/pairs.local.json`. On a
   collision, the on-chain registry wins.

This keeps the official registry authoritative while still letting developers extend
the app for their own wrappers without waiting on the DAO.

---

## Adding a new ERC-20 ↔ ERC-7984 pair

The on-chain registry is read-only for non-DAO accounts (`registerConfidentialToken`
is owner-gated). To surface a pair **you** control (a wrapper you deployed, or a local
anvil pair), add it via the local config:

1. **Copy the example config:**

   ```bash
   cp packages/registry-config/pairs.local.example.json \
      packages/registry-config/pairs.local.json
   ```

2. **Add an entry** to `pairs.local.json` (validated by `@wrapper-registry/registry-config`):

   ```jsonc
   {
     "pairs": [
       {
         "symbol": "MYTKN",                         // stable key
         "name": "My Confidential Token (dev)",     // display name
         "decimals": 6,                             // underlying ERC-20 decimals (≤6 for the euint64 balance)
         "confidentialToken": "0x…yourERC7984",     // the wrapper contract
         "underlying": "0x…yourERC20",              // the cleartext ERC-20
         "faucetable": false                        // true only if the underlying has a public mint()
       }
     ]
   }
   ```

3. **Point the import** at your local file. In `apps/web/src/lib/registry.ts`:

   ```ts
   // was: import localConfigRaw from "@wrapper-registry/registry-config/example";
   import localConfigRaw from "@wrapper-registry/registry-config/local";
   ```

   then add the `"./local": "./pairs.local.json"` export to
   `packages/registry-config/package.json` (mirroring the existing `"./example"` entry).

4. **Redeploy.** The pair now shows up in the registry browser with a `local` badge,
   and wrap/unwrap/decrypt work against it just like any official pair.

The config is **validated at startup** (`validateLocalConfig`): bad addresses,
duplicate wrappers, and out-of-range decimals throw `LocalConfigError` with the
offending entry index, so misconfigurations fail loudly rather than silently.

---

## Tech stack

- **Next.js 15** (App Router) + React 18 + TypeScript
- **wagmi v3** + **viem v2** for wallet + EVM
- **@zama-fhe/sdk** + **@zama-fhe/react-sdk** v3.2.0 for FHE (shield/unshield, EIP-712 permit decryption)
- **Tailwind CSS** + **shadcn-style** components
- **pnpm** workspace monorepo

### Monorepo layout

```
wrapper-registry-dapp/
├── apps/web/                     # Next.js dApp
│   ├── src/app/                  # routes: /, /faucet, /wrap, /decrypt, /api/relayer/[chainId]
│   ├── src/components/           # nav, wallet, network badge, toasts, copy
│   ├── src/lib/                  # registry reader, format, errors, active-network
│   ├── src/config/networks.ts    # wagmi + Zama SDK config (client-only assembly)
│   └── next.config.mjs           # COOP/COEP headers (required for FHE WASM)
├── packages/contracts/           # ABIs + canonical Sepolia/mainnet addresses
└── packages/registry-config/     # typed local-config schema + validation
```

---

## Configuration

### 1. Relayer API key (required)

The Zama browser relayer requires an `x-api-key` header. To keep the key out of the
browser, the app proxies relayer calls through a server route
(`/api/relayer/[chainId]`) that injects the key from the environment.

- Obtain a key from Zama (see the [authentication guide](https://docs.zama.org/protocol/sdk/guides/authentication)).
- Copy `.env.example` → `.env.local` in `apps/web/` and set:

  ```bash
  RELAYER_API_KEY=your_key_here
  ```

### 2. Cross-origin isolation (already configured)

FHE WASM runs in a Web Worker and needs `SharedArrayBuffer`, which requires
cross-origin isolation headers. These are set in `next.config.mjs` (`headers()`):

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

> **Note:** `require-corp` means cross-origin resources (some wallet popups, CDN
> fonts) must send `Cross-Origin-Resource-Policy: cross-origin` or be loaded with
> `crossorigin="anonymous"`. If a third-party wallet iframe breaks, switch the
> embedder policy to `credentialless` as a fallback.

---

## Local development

**Prerequisites:** Node ≥ 22, pnpm ≥ 10.

```bash
# 1. Install
pnpm install

# 2. Configure
cp .env.example apps/web/.env.local
# edit apps/web/.env.local → set RELAYER_API_KEY

# 3. Run
pnpm dev          # http://localhost:3000
```

Other scripts:

```bash
pnpm build        # production build
pnpm start        # serve the production build
pnpm typecheck    # tsc --noEmit across all packages
```

---

## Deployment (Vercel)

1. Push the repo to GitHub.
2. Import into Vercel — set the root to `apps/web` (or use the monorepo root; the
   `web` workspace is auto-detected).
3. Add the environment variable `RELAYER_API_KEY`.
4. Deploy. The `next.config.mjs` COOP/COEP headers apply automatically.

---

## Supported networks

| Network | Chain ID | Registry | Faucet |
|---|---|---|---|
| **Sepolia** | 11155111 | `0x2f0750Bbb0A246059d80e94c454586a7F27a128e` | ✅ 7 cTokenMocks |
| **Ethereum mainnet** | 1 | `0xeb5015fF021DB115aCe010f23F55C2591059bBA0` | — |

Canonical addresses live in `packages/contracts/src/addresses.ts`.

---

## Acknowledgements

- [Zama FHEVM](https://github.com/zama-ai) — fully homomorphic encryption for EVM.
- [@zama-fhe/sdk](https://docs.zama.org/protocol/sdk) v3 for the React hooks.
