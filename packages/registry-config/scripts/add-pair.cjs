#!/usr/bin/env node
/**
 * veil add-pair — scaffold a new ERC-20 ↔ ERC-7984 pair into the local config.
 *
 * Usage:
 *   pnpm add-pair
 *   pnpm add-pair --symbol MYTKN --confidential 0xabc... --underlying 0xdef...
 *
 * Adds the entry to packages/registry-config/pairs.local.json, creating the
 * file (and backing up any existing one) if needed, then validates the result
 * with the same schema the app uses at runtime.
 *
 * This is the documented extensibility path (README §"Adding a new pair").
 */

const fs = require("fs");
const path = require("path");

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

function parseArgs(argv) {
  const out = { interactive: true, symbol: "", name: "", decimals: 6, confidential: "", underlying: "", faucetable: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--symbol": out.symbol = argv[++i]; break;
      case "--name": out.name = argv[++i]; break;
      case "--decimals": out.decimals = parseInt(argv[++i], 10); break;
      case "--confidential": out.confidential = argv[++i]; break;
      case "--underlying": out.underlying = argv[++i]; break;
      case "--faucetable": out.faucetable = true; out.interactive = false; break;
      case "--non-interactive": out.interactive = false; break;
      case "-h": case "--help":
        console.log(`veil add-pair — add an ERC-20 ↔ ERC-7984 pair to the local registry config.

Usage:
  pnpm add-pair
  pnpm add-pair --symbol MYTKN --confidential 0x... --underlying 0x... [--name "My Token"] [--decimals 6] [--faucetable]

Flags:
  --symbol        Stable symbol (e.g. MYTKN). Required.
  --confidential  ERC-7984 wrapper contract address. Required.
  --underlying    Underlying ERC-20 address. Required.
  --name          Display name (defaults to "Confidential <symbol>").
  --decimals      Underlying decimals 0–18 (default 6; max 6 for the euint64 balance).
  --faucetable    Mark the underlying as having a public mint() (Sepolia mocks only).
  --non-interactive  Don't prompt; use flags only.
`);
        process.exit(0);
    }
  }
  return out;
}

function prompt(rl, q) {
  return new Promise((res) => rl.question(q, res));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const readline = args.interactive ? require("readline").createInterface({ input: process.stdin, output: process.stdout }) : null;

  const symbol = args.symbol || (args.interactive ? (await prompt(readline, "Symbol (e.g. MYTKN): ")).trim() : "");
  if (!symbol) { console.error("✗ --symbol is required"); process.exit(1); }

  const confidential = (args.confidential || (args.interactive ? (await prompt(readline, "ERC-7984 wrapper address: ")).trim() : "")).trim();
  if (!ADDR_RE.test(confidential)) { console.error("✗ invalid confidentialToken address"); process.exit(1); }

  const underlying = (args.underlying || (args.interactive ? (await prompt(readline, "Underlying ERC-20 address: ")).trim() : "")).trim();
  if (!ADDR_RE.test(underlying)) { console.error("✗ invalid underlying address"); process.exit(1); }

  if (confidential.toLowerCase() === underlying.toLowerCase()) {
    console.error("✗ confidentialToken and underlying must differ"); process.exit(1);
  }

  const name = args.name || (args.interactive ? (await prompt(readline, `Display name [Confidential ${symbol}]: `)).trim() : "") || `Confidential ${symbol}`;
  let decimals = args.decimals;
  if (args.interactive) {
    const d = (await prompt(readline, `Decimals [${decimals}]: `)).trim();
    if (d) decimals = parseInt(d, 10);
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    console.error("✗ decimals must be an integer 0–18"); process.exit(1);
  }
  if (decimals > 6) {
    console.warn(`⚠ ${decimals} decimals: confidential balances round to 6 (euint64). Wrapping will round down.`);
  }

  if (readline) readline.close();

  // Locate + update the config file.
  const configFile = path.join(__dirname, "..", "pairs.local.json");
  const exampleFile = path.join(__dirname, "..", "pairs.local.example.json");
  let config = { pairs: [] };
  if (fs.existsSync(configFile)) {
    try { config = JSON.parse(fs.readFileSync(configFile, "utf8")); } catch { config = { pairs: [] }; }
  } else if (fs.existsSync(exampleFile)) {
    config = JSON.parse(fs.readFileSync(exampleFile, "utf8"));
  }

  // De-dup: replace if the same confidentialToken exists.
  const entry = { symbol, name, decimals, confidentialToken: confidential, underlying, faucetable: args.faucetable };
  const without = (config.pairs || []).filter((p) => p.confidentialToken?.toLowerCase() !== confidential.toLowerCase());
  config.pairs = [...without, entry];

  fs.writeFileSync(configFile, JSON.stringify(config, null, 2) + "\n");

  console.log(`✓ added ${symbol} → ${configFile}`);
  console.log(`  ${confidential} (ERC-7984)  ←  ${underlying} (ERC-20)`);
  console.log(`  next: pnpm dev — the pair appears in the registry with a “local” badge.`);
}

main().catch((e) => { console.error("✗", e.message); process.exit(1); });
