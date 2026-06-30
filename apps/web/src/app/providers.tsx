"use client";

/**
 * Client providers: wagmi + React Query + Zama SDK.
 *
 * All Zama SDK assembly happens HERE (client-only) — never at module top-level.
 * Per the Next.js SSR guide, importing @zama-fhe/* at the top of a server
 * module crashes because the SDK touches Web Worker / IndexedDB / WASM.
 */

import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { buildWagmiConfig, buildZamaConfig } from "@/config/networks";

export function Providers({ children }: { children: ReactNode }) {
  // QueryClient must be stable per session, created once.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  // wagmi + Zama configs are created once per client session.
  const [wagmiConfig] = useState(buildWagmiConfig);
  const [zamaConfig] = useState(() => buildZamaConfig(wagmiConfig));

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZamaProvider config={zamaConfig}>{children}</ZamaProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
