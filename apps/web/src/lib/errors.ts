/**
 * Turn a wagmi/contract error into a short, friendly message.
 * Shared across pages (cannot live in a page.tsx because Next.js App Router
 * forbids non-default exports from route files).
 */
export function humanizeError(err: unknown): string {
  const msg = getErrorMessage(err);

  // Log the full error for debugging (visible in browser console)
  console.error("[humanizeError]", err);

  // Wallet / user actions
  if (/user rejected|user denied|transaction rejected/i.test(msg))
    return "Transaction rejected in wallet";
  if (/insufficient funds/i.test(msg)) return "Insufficient funds for gas";
  if (/wallet not connected|signer not configured/i.test(msg))
    return "Connect your wallet first";
  if (/signing rejected|signing failed/i.test(msg))
    return "Signature rejected in wallet";
  if (/chain mismatch/i.test(msg))
    return "Wrong network — switch to the correct network in your wallet";

  // Balance errors (SDK-specific)
  if (/insufficient erc-20 balance/i.test(msg))
    return "Insufficient balance — you don't have enough tokens";
  if (/insufficient confidential balance/i.test(msg))
    return "Insufficient confidential balance — you don't have enough to unwrap";
  if (/erc20 read failed|could not read erc-20/i.test(msg))
    return "Could not read token balance — try again";

  // Contract execution
  if (/execution reverted/i.test(msg)) {
    const m = msg.match(/reverted with reason string '([^']+)'/);
    return m ? `Reverted: ${m[1]}` : "Contract reverted";
  }

  // Decryption / relayer
  if (/decryption failed/i.test(msg)) return "Decryption failed — try again";
  if (/relayer request failed|relayer.*error/i.test(msg))
    return "Relayer error — try again in a moment";

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

  // SDK error codes — check the code property on the error object
  const code = getErrorCode(err);
  if (code === "INSUFFICIENT_ERC20_BALANCE")
    return "Insufficient balance — you don't have enough tokens";
  if (code === "INSUFFICIENT_CONFIDENTIAL_BALANCE")
    return "Insufficient confidential balance — you don't have enough to unwrap";
  if (code === "ERC20_READ_FAILED")
    return "Could not read token balance — try again";
  if (code === "WALLET_NOT_CONNECTED") return "Connect your wallet first";
  if (code === "SIGNING_REJECTED") return "Signature rejected in wallet";
  if (code === "TRANSACTION_REVERTED") return "Transaction failed on-chain";
  if (code === "RELAYER_REQUEST_FAILED")
    return "Relayer error — try again in a moment";
  if (code === "DECRYPTION_FAILED") return "Decryption failed — try again";
  if (code === "BALANCE_CHECK_UNAVAILABLE")
    return "Could not verify balance — try again";

  // Fallback — truncate but don't hide completely
  if (msg && msg !== "unknown" && msg !== "Error" && msg.length < 120) return msg;
  return "Something went wrong";
}

/**
 * Extract the most meaningful error message from an error and its cause chain.
 * Walks up to 3 levels deep to find a match.
 */
function getErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return String(err);

  const msg = err.message;
  // If the message itself is useful, return it
  if (msg && msg !== "unknown" && msg !== "Error") return msg;

  // Walk the cause chain
  let cause = err.cause;
  let depth = 0;
  while (cause instanceof Error && depth < 3) {
    if (cause.message && cause.message !== "unknown" && cause.message !== "Error")
      return cause.message;
    cause = cause.cause;
    depth++;
  }

  return msg || String(err);
}

/**
 * Try to extract an SDK error code from the error object.
 * The Zama SDK errors have a `code` property with string values like
 * "INSUFFICIENT_ERC20_BALANCE", "RELAYER_REQUEST_FAILED", etc.
 */
function getErrorCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  // Check cause chain
  if (err instanceof Error && err.cause) {
    return getErrorCode(err.cause);
  }
  return undefined;
}
