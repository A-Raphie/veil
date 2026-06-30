/**
 * Local pair overrides — the "dev-only / custom pairs" half of the hybrid
 * registry sourcing model required by the bounty:
 *
 *   "Source the wrapper registry as a hybrid: read the official onchain
 *    Wrappers Registry as the primary source of truth, and additionally
 *    support a local config to declare custom or dev-only pairs."
 *
 * The on-chain registry is read-only for us (registerConfidentialToken is
 * owner-gated to the Protocol DAO). This module is the documented, type-safe
 * escape hatch for adding your own ERC-20 ↔ ERC-7984 pairs (e.g. a wrapper
 * you deployed yourself, or a dev/local anvil pair) without touching chain.
 *
 * See README.md §"Adding a new pair" for the step-by-step.
 */

export type Address = `0x${string}`;

/** Shape of a single entry in `pairs.local.json`. */
export interface LocalPairInput {
  /** Stable symbol used as the merge key, e.g. "MYTKN". */
  symbol: string;
  /** Display name, e.g. "My Confidential Token". */
  name: string;
  /** Underlying ERC-20 decimals. Confidential balance is euint64 (max 6). */
  decimals: number;
  /** ERC-7984 confidential wrapper contract address. */
  confidentialToken: Address;
  /** Underlying cleartext ERC-20 address. */
  underlying: Address;
  /** Mark `true` if the underlying has a public `mint(to, amount)` (faucet). */
  faucetable?: boolean;
}

/** Validated, normalized local pair. */
export interface LocalPair {
  symbol: string;
  name: string;
  decimals: number;
  confidentialToken: Address;
  underlying: Address;
  faucetable: boolean;
  /** Always `true` for local entries — distinguishes from registry pairs. */
  source: "local";
}

export interface LocalRegistryConfig {
  pairs: LocalPairInput[];
}

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export class LocalConfigError extends Error {
  constructor(
    message: string,
    readonly entryIndex?: number,
  ) {
    super(message);
    this.name = "LocalConfigError";
  }
}

/** Lowercase + checksum-agnostic normalization for address comparison. */
export function normalizeAddress(a: string): Address {
  return a.toLowerCase() as Address;
}

function validateEntry(entry: LocalPairInput, index: number): LocalPair {
  if (!entry || typeof entry !== "object") {
    throw new LocalConfigError(`pair #${index} is not an object`, index);
  }
  if (!entry.symbol || typeof entry.symbol !== "string") {
    throw new LocalConfigError(`pair #${index} is missing a string "symbol"`, index);
  }
  if (!entry.name || typeof entry.name !== "string") {
    throw new LocalConfigError(`pair #${index} is missing a string "name"`, index);
  }
  if (typeof entry.decimals !== "number" || entry.decimals < 0 || entry.decimals > 18) {
    throw new LocalConfigError(
      `pair #${index} (${entry.symbol}) has invalid decimals: ${entry.decimals}`,
      index,
    );
  }
  if (!ADDRESS_RE.test(entry.confidentialToken)) {
    throw new LocalConfigError(
      `pair #${index} (${entry.symbol}) has an invalid confidentialToken address: ${entry.confidentialToken}`,
      index,
    );
  }
  if (!ADDRESS_RE.test(entry.underlying)) {
    throw new LocalConfigError(
      `pair #${index} (${entry.symbol}) has an invalid underlying address: ${entry.underlying}`,
      index,
    );
  }
  if (normalizeAddress(entry.confidentialToken) === normalizeAddress(entry.underlying)) {
    throw new LocalConfigError(
      `pair #${index} (${entry.symbol}) confidentialToken and underlying are identical`,
      index,
    );
  }
  return {
    symbol: entry.symbol,
    name: entry.name,
    decimals: entry.decimals,
    confidentialToken: entry.confidentialToken,
    underlying: entry.underlying,
    faucetable: entry.faucetable ?? false,
    source: "local",
  };
}

/** Validate a parsed config object; throws LocalConfigError on the first issue. */
export function validateLocalConfig(config: unknown): LocalPair[] {
  if (!config || typeof config !== "object") {
    throw new LocalConfigError("config is not an object");
  }
  const { pairs } = config as Partial<LocalRegistryConfig>;
  if (!Array.isArray(pairs)) {
    throw new LocalConfigError('"pairs" must be an array');
  }
  const seen = new Map<string, number>();
  const validated = pairs.map((p, i) => {
    const v = validateEntry(p as LocalPairInput, i);
    const key = normalizeAddress(v.confidentialToken);
    if (seen.has(key)) {
      throw new LocalConfigError(
        `duplicate confidentialToken address ${v.confidentialToken} (pairs #${seen.get(key)} and #${i})`,
        i,
      );
    }
    seen.set(key, i);
    return v;
  });
  return validated;
}

/**
 * Parse + validate a JSON string. Useful for tests and for loading the config
 * file content directly. Throws on invalid JSON or invalid shape.
 */
export function parseLocalConfig(json: string): LocalPair[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new LocalConfigError(`config is not valid JSON: ${(e as Error).message}`);
  }
  return validateLocalConfig(parsed);
}
