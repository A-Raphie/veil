"use client";

/**
 * AddPairForm — the in-browser admin UI for adding custom ERC-20 ↔ ERC-7984
 * pairs. Pairs are validated on-chain (name/symbol/decimals must respond) and
 * persisted to localStorage, so they survive page refresh and immediately
 * appear in the registry grid with a "local" badge.
 *
 * Auto-fill: when the user pastes a valid wrapper address, the form fetches
 * name/symbol/decimals from the contract and populates the fields automatically.
 * The user only needs to paste the underlying ERC-20 address.
 *
 * Note: supportsInterface() reverts on Zama FHEVM wrappers (FHE ACL-gated),
 * so we validate by reading name/symbol/decimals instead — if those respond,
 * it's a valid ERC-7984 wrapper.
 */

import { useState } from "react";
import { usePublicClient } from "wagmi";
import { useLocalPairs } from "@/lib/use-local-pairs";
import { checkAddress, addressErrorReason } from "@/lib/address";
import { pushToast } from "@/components/toast";
import { Plus, ChevronDown, ChevronUp, Trash2, ShieldCheck, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { shortAddr } from "@/lib/format";
import { wrapperAbi, erc20Abi } from "@wrapper-registry/contracts";

const ERC20_READ_ABI = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
] as const;

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
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [underlyingCheck, setUnderlyingCheck] = useState<{ state: "idle" | "checking" | "valid" | "invalid"; name?: string }>({ state: "idle" });

  const resetForm = () => {
    setSymbol("");
    setName("");
    setDecimals("6");
    setConfidential("");
    setUnderlying("");
    setError(null);
    setAutoFilled(false);
    setUnderlyingCheck({ state: "idle" });
  };

  // Auto-fill name/symbol/decimals when the wrapper address is valid (42 chars).
  // Fires on every change; the reads are cheap and cached by the RPC layer.
  const onConfidentialChange = async (val: string) => {
    setConfidential(val);
    setAutoFilled(false);
    setUnderlying("");
    const check = checkAddress(val);
    if (!check.ok || !client) return;
    try {
      const [n, s, d, u] = await Promise.all([
        client.readContract({ address: check.address, abi: wrapperAbi, functionName: "name" }),
        client.readContract({ address: check.address, abi: wrapperAbi, functionName: "symbol" }),
        client.readContract({ address: check.address, abi: wrapperAbi, functionName: "decimals" }),
        client.readContract({ address: check.address, abi: wrapperAbi, functionName: "underlying" }),
      ]);
      setName(n as string);
      setSymbol((s as string).replace(/^c/, "").toUpperCase() || (s as string).toUpperCase());
      setDecimals(String(d));
      setUnderlying(u as string);
      setAutoFilled(true);
    } catch {
      // not a valid wrapper or RPC failed — user types manually
    }
  };

  // Reverse check: validate the underlying address is a real ERC-20.
  const onUnderlyingChange = async (val: string) => {
    setUnderlying(val);
    setUnderlyingCheck({ state: "idle" });
    const check = checkAddress(val);
    if (!check.ok || !client) return;
    setUnderlyingCheck({ state: "checking" });
    try {
      const tokenName = await client.readContract({
        address: check.address,
        abi: ERC20_READ_ABI,
        functionName: "name",
      });
      setUnderlyingCheck({ state: "valid", name: tokenName as string });
    } catch {
      setUnderlyingCheck({ state: "invalid" });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate addresses (format)
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

    // --- On-chain validation ---
    // supportsInterface reverts on Zama wrappers (FHE ACL-gated), so we validate
    // by reading name/symbol/decimals. If those respond, it's a valid ERC-7984.
    setValidating(true);
    setError(null);
    try {
      // Check wrapper: must respond to name() + symbol() + decimals()
      try {
        await client!.readContract({ address: cCheck.address, abi: wrapperAbi, functionName: "name" });
        await client!.readContract({ address: cCheck.address, abi: wrapperAbi, functionName: "decimals" });
      } catch {
        setError("No valid ERC-7984 wrapper found at this address. Are you sure it's a confidential wrapper contract?");
        return;
      }
      // Check underlying: must respond to decimals() (standard ERC-20)
      try {
        await client!.readContract({ address: uCheck.address, abi: ERC20_READ_ABI, functionName: "decimals" });
      } catch {
        setError("No valid ERC-20 contract found at the underlying address.");
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
      faucetable: false,
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
            Add any ERC-20 ↔ ERC-7984 wrapper pair. Paste the wrapper address and
            Veil auto-fills the details from the contract. Pairs persist in your
            browser (localStorage).
          </p>

          <div>
            <label htmlFor="ap-confidential" className="mb-1 block text-xs font-medium text-slate-400">
              ERC-7984 wrapper address *
            </label>
            <input
              id="ap-confidential"
              className="input mono"
              placeholder="0x…"
              value={confidential}
              onChange={(e) => onConfidentialChange(e.target.value)}
              spellCheck={false}
            />
            {autoFilled && (
              <p className="mt-1 flex items-center gap-1 text-xs text-brand-400">
                <Sparkles className="h-3 w-3" /> Auto-filled from contract
              </p>
            )}
          </div>

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
                onChange={(e) => { setSymbol(e.target.value); setAutoFilled(false); }}
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
                onChange={(e) => { setName(e.target.value); setAutoFilled(false); }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="ap-underlying" className="mb-1 block text-xs font-medium text-slate-400">
                Underlying ERC-20 address *
              </label>
              <input
                id="ap-underlying"
                className="input mono w-64 max-w-full"
                placeholder="0x…"
                value={underlying}
                onChange={(e) => onUnderlyingChange(e.target.value)}
                spellCheck={false}
              />
              {/* Underlying validation badge */}
              {underlyingCheck.state === "checking" && (
                <p className="mt-1 text-xs text-slate-500">Checking…</p>
              )}
              {underlyingCheck.state === "valid" && (
                <p className="mt-1 flex items-center gap-1 text-xs text-brand-400">
                  <CheckCircle2 className="h-3 w-3" /> Valid ERC-20{underlyingCheck.name ? `: ${underlyingCheck.name}` : ""}
                </p>
              )}
              {underlyingCheck.state === "invalid" && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-400">
                  <XCircle className="h-3 w-3" /> Not a valid ERC-20 contract
                </p>
              )}
            </div>
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
