/**
 * Type the JSON export from @wrapper-registry/registry-config/example.
 * resolveJsonModule infers the shape of the imported .json, but the package
 * subpath needs a module declaration so TS resolves the bare specifier.
 */
declare module "@wrapper-registry/registry-config/example" {
  const config: {
    pairs: Array<{
      symbol: string;
      name: string;
      decimals: number;
      confidentialToken: `0x${string}`;
      underlying: `0x${string}`;
      faucetable?: boolean;
    }>;
  };
  export default config;
}
