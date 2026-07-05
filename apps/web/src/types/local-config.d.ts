/**
 * Type the JSON exports from @wrapper-registry/registry-config.
 * - ./example = the static example file (shipped with the package)
 * - ./local   = pairs.local.json, written by `pnpm add-pair` (user-editable)
 *
 * resolveJsonModule infers the shape of the imported .json, but the package
 * subpath needs a module declaration so TS resolves the bare specifier.
 */
declare module "@wrapper-registry/registry-config/example" {
  const config: LocalConfigShape;
  export default config;
}

declare module "@wrapper-registry/registry-config/local" {
  const config: LocalConfigShape;
  export default config;
}

interface LocalConfigShape {
  pairs: Array<{
    symbol: string;
    name: string;
    decimals: number;
    confidentialToken: `0x${string}`;
    underlying: `0x${string}`;
    faucetable?: boolean;
  }>;
}
