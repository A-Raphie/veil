/**
 * Turn a wagmi/contract error into a short, friendly message.
 * Shared across pages (cannot live in a page.tsx because Next.js App Router
 * forbids non-default exports from route files).
 */
export function humanizeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  // Wallet / user actions
  if (/user rejected|user denied|transaction rejected/i.test(msg))
    return "Transaction rejected in wallet";
  if (/insufficient funds/i.test(msg)) return "Insufficient funds for gas";

  // Contract execution
  if (/execution reverted/i.test(msg)) {
    const m = msg.match(/reverted with reason string '([^']+)'/);
    return m ? `Reverted: ${m[1]}` : "Contract reverted";
  }

  // Network / RPC
  if (
    /http request failed|fetch failed|network error|econnrefused|econnreset|enotfound|failed to fetch/i.test(
      msg,
    )
  )
    return "Network error — check your connection and try again";
  if (/timeout|timed out/i.test(msg))
    return "Request timed out — try again";
  if (/rate limit|429/i.test(msg))
    return "Too many requests — wait a moment and try again";
  if (/block range|too many results/i.test(msg))
    return "Query too large — try a smaller range";

  // Chain / input
  if (/not supported|unsupported chain/i.test(msg))
    return "This network is not supported";
  if (/invalid input|invalid address|invalid chain/i.test(msg))
    return "Invalid input — check your wallet and try again";
  if (/method not found|method not supported/i.test(msg))
    return "RPC error — try a different network";

  // Fallback — never show raw error text to users
  return "Something went wrong";
}
