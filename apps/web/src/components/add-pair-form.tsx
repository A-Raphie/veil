"use client";

/**
 * AddPairForm — the in-browser admin UI for adding custom ERC-20 ↔ ERC-7984
 * pairs. Pairs are validated (address format, decimals, duplicates) and
 * persisted to localStorage, so they survive page refresh and immediately
 * appear in the registry grid with a "local" badge.
 *
 * This is the "admin UI" extensibility path explicitly allowed by the bounty
 * spec. The CLI (pnpm add-pair) remains as the power-user / build-time path.
 */

import { useState } from "react";
import { usePublicClient } from "wagmi";
import { useLocalPairs } from "@/lib/use-local-pairs";
import { checkAddress, addressErrorReason } from "@/lib/address";
import { pushToast } from "@/components/toast";
import { Plus, ChevronDown, ChevronUp, Trash2, ShieldCheck } from "lucide-react";
import { shortAddr } from "@/lib/format";

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

// ERC interface IDs for on-chain validation.
const ERC7984_INTERFACE_ID = "0x4958f2a4";
const ERC20_INTERFACE_ID = "0x36372b07";

const SUPPORTS_INTERFACE_ABI = [
  {
    type: "function",
    name: "supportsInterface",
    stateMutability: "view",
    inputs: [{ name: "interfaceId", type: "bytes4" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

/**
 * Check whether an address implements an ERC interface via supportsInterface.
 * Returns true/false, or null if the call fails (EOA, no code, broken contract).
 */
async function checkInterface(
  client: ReturnType<typeof usePublicClient> extends infer C ? C : never,
  address: string,
  interfaceId: string,
): Promise<boolean | null> {
  if (!client) return null;
  try {
    const result = await client.readContract({
      address: address as `0x${string}`,
      abi: SUPPORTS_INTERFACE_ABI,
      functionName: "supportsInterface",
      args: [interfaceId as `0x${string}`],
    });
    return result as boolean;
  } catch {
    return null;
  }
}

export function AddPairForm() {
  const [open, setOpen] = useState(false);
  const { pairs, addPair, removePair } = useLocalPairs();
  const client = usePublicClient();

  // form state
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [decimals, setDecimals] = useState("6");
  const [confidential, setConfidential] = useState("");
  const [underlying, setUnderlying] = useState("");
  const [faucetable, setFaucetable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const resetForm = () => {
    setSymbol("");
    setName("");
    setDecimals("6");
    setConfidential("");
    setUnderlying("");
    setFaucetable(false);
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate addresses
    const cCheck = checkAddress(confidential);
    if (!cCheck.ok && cCheck.reason !== "empty") {
      setError(`Wrapper address: ${addressErrorReason(cCheck.reason)}`);
      return;
    }
    const uCheck = checkAddress(underlying);
    if (!uCheck.ok && uCheck.reason !== "empty") {
      setError(`Underlying address: ${addressErrorReason(uCheck.reason)}`);
      return;
    }
    if (!cCheck.ok || !uCheck.ok) {
      setError("Both addresses are required.");
      return;
    }
    if (cCheck.address.toLowerCase() === uCheck.address.toLowerCase()) {
      setError("Wrapper and underlying addresses must be different.");
      return;
    }
    if (!symbol.trim()) {
      setError("Symbol is required.");
      return;
    }
    const dec = parseInt(decimals, 10);
    if (isNaN(dec) || dec < 0 || dec > 18) {
      setError("Decimals must be an integer 0–18.");
      return;
    }

    // --- On-chain interface validation ---
    // Reject addresses that aren't real ERC-7984 / ERC-20 contracts so the user
    // doesn't add a garbage pair that fails on wrap/decrypt.
    setValidating(true);
    setError(null);
    try {
      const isErc7984 = await checkInterface(client, cCheck.address, ERC7984_INTERFACE_ID);
      if (isErc7984 !== true) {
        setError(
          isErc7984 === null
            ? "No contract found at the wrapper address (is it an EOA?). Check the address and network."
            : "This address does not implement the ERC-7984 interface. Are you sure it's a confidential wrapper?",
        );
        return;
      }
      const isErc20 = await checkInterface(client, uCheck.address, ERC20_INTERFACE_ID);
      if (isErc20 !== true) {
        setError(
          isErc20 === null
            ? "No contract found at the underlying address (is it an EOA?)."
            : "The underlying address does not implement the ERC-20 interface.",
        );
        return;
      }
    } finally {
      setValidating(false);
    }

    const result = addPair({
      symbol: symbol.trim().toUpperCase(),
      name: name.trim() || `Confidential ${symbol.trim()}`,
      decimals: dec,
      confidentialToken: cCheck.address,
      underlying: uCheck.address,
      faucetable,
    });

    if (result.ok) {
      pushToast("success", `Added ${symbol.trim().toUpperCase()} — it appears in the grid with a "local" badge`);
      resetForm();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="card space-y-4">
      {/* Toggle header */}
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Plus className="h-4 w-4 text-brand-400" />
          Add a custom pair
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>

      {open && (
        <form onSubmit={onSubmit} className="space-y-3">
          <p className="text-xs text-slate-400">
            Add any ERC-20 ↔ ERC-7984 wrapper pair. It appears in the grid with a
            &ldquo;local&rdquo; badge and works with wrap/unwrap/decrypt. Pairs
            persist in your browser (localStorage).
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ap-symbol" className="mb-1 block text-xs font-medium text-slate-400">
                Symbol *
              </label>
              <input
                id="ap-symbol"
                className="input"
                placeholder="e.g. USDC"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                maxLength={12}
              />
            </div>
            <div>
              <label htmlFor="ap-name" className="mb-1 block text-xs font-medium text-slate-400">
                Name
              </label>
              <input
                id="ap-name"
                className="input"
                placeholder="e.g. Confidential USDC"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ap-confidential" className="mb-1 block text-xs font-medium text-slate-400">
                ERC-7984 wrapper address *
              </label>
              <input
                id="ap-confidential"
                className="input mono"
                placeholder="0x…"
                value={confidential}
                onChange={(e) => setConfidential(e.target.value)}
                spellCheck={false}
              />
            </div>
            <div>
              <label htmlFor="ap-underlying" className="mb-1 block text-xs font-medium text-slate-400">
                Underlying ERC-20 address *
              </label>
              <input
                id="ap-underlying"
                className="input mono"
                placeholder="0x…"
                value={underlying}
                onChange={(e) => setUnderlying(e.target.value)}
                spellCheck={false}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="ap-decimals" className="mb-1 block text-xs font-medium text-slate-400">
                Decimals
              </label>
              <input
                id="ap-decimals"
                type="number"
                min={0}
                max={18}
                className="input w-20"
                value={decimals}
                onChange={(e) => setDecimals(e.target.value)}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={faucetable}
                onChange={(e) => setFaucetable(e.target.checked)}
                className="h-4 w-4 accent-brand-500"
              />
              Faucetable (underlying has public <span className="mono">mint()</span>)
            </label>
          </div>

          {error && (
            <p className="text-xs text-rose-300">{error}</p>
          )}

          <button type="submit" className="btn-primary text-sm" disabled={validating}>
            <Plus className="h-4 w-4" />
            {validating ? "Validating on-chain…" : "Add pair"}
          </button>
        </form>
      )}

      {/* Manage existing UI-added pairs */}
      {pairs.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-slate-400">Your custom pairs</p>
          {pairs.map((p) => (
            <div key={p.confidentialToken} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2">
                <span className="badge bg-violet-500/15 text-violet-300">
                  <ShieldCheck className="h-3 w-3" /> local
                </span>
                <span className="font-medium">{p.symbol}</span>
                <span className="mono text-slate-500">{shortAddr(p.confidentialToken)}</span>
              </span>
              <button
                className="text-slate-500 hover:text-rose-400"
                onClick={() => {
                  removePair(p.confidentialToken);
                  pushToast("info", `Removed ${p.symbol}`);
                }}
                aria-label={`Remove ${p.symbol}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
