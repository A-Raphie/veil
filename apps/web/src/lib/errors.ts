/**
 * Turn a wagmi/contract error into a short, friendly message.
 * Shared across pages (cannot live in a page.tsx because Next.js App Router
 * forbids non-default exports from route files).
 */
export function humanizeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/user rejected/i.test(msg)) return "Transaction rejected in wallet";
  if (/insufficient funds/i.test(msg)) return "Insufficient funds for gas";
  if (/execution reverted/i.test(msg)) {
    const m = msg.match(/reverted with reason string '([^']+)'/);
    return m ? `Reverted: ${m[1]}` : "Contract reverted";
  }
  return msg.slice(0, 160);
}
